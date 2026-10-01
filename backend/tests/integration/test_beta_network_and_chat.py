from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select, text

from app.core.config import settings
from app.db.session import SessionLocal
from app.main import app
from app.models.moderation import UserBlock
from app.models.social import ChatPresenceLease, Message, UserFollow
from app.models.user import User, UserStatus

pytestmark = pytest.mark.integration


async def account(client):
    email = f"beta-social-{uuid4().hex}@example.test"
    password = "A secure social integration passphrase 123!"
    signup = await client.post('/api/v1/signup', json={
        'email': email, 'phone': f"09{uuid4().int % 10**9:09d}",
        'password': password, 'display_name': 'کاربر آزمایشی شبکه',
        'accept_terms': True, 'accept_privacy': True, 'accept_community_guidelines': True,
    })
    assert signup.status_code == 200, signup.text
    login = await client.post('/api/v1/login/access-token', data={'username': email, 'password': password})
    assert login.status_code == 200, login.text
    return signup.json()['id'], {'Authorization': f"Bearer {login.json()['access_token']}"}


@pytest.mark.asyncio
async def test_optional_beta_network_and_messages_persist_without_duplicate_follows(monkeypatch):
    monkeypatch.setattr(settings, 'DEPLOYMENT_TIER', 'staging')
    monkeypatch.setattr(settings, 'REQUIRE_VERIFIED_LOGIN', False)
    async with AsyncClient(transport=ASGITransport(app=app), base_url='https://test') as client:
        viewer_id, headers = await account(client)
        target_id, target_headers = await account(client)
        for _ in range(2):
            followed = await client.post(f'/api/v1/users/{target_id}/follow', headers=headers)
            assert followed.status_code == 201, followed.text
        for path in ['/users/me/network', '/users/me/following', f'/users/{viewer_id}/following']:
            result = await client.get(f'/api/v1{path}', headers=headers)
            assert result.status_code == 200, result.text
            assert [person['id'] for person in result.json()] == [target_id]
        assert (await client.get(f'/api/v1/users/{target_id}/is-following', headers=headers)).json()['is_following']
        assert (await client.get('/api/v1/users/me/following-count', headers=headers)).json()['following_count'] == 1
        assert (await client.get('/api/v1/users/me/followers', headers=target_headers)).json()[0]['id'] == viewer_id
        sent = await client.post('/api/v1/chat', headers=headers, json={'receiver_id': target_id, 'content': 'سلام تارا'})
        assert sent.status_code == 200, sent.text
        history = await client.get(f'/api/v1/chat/{target_id}/messages', headers=headers)
        assert history.json()[0]['id'] == sent.json()['id']
        assert history.json()[0]['content'] == 'سلام تارا'
        conversations = await client.get('/api/v1/chat/conversations', headers=headers)
        assert conversations.json()[0]['user']['id'] == target_id
        assert conversations.json()[0]['is_online'] is False
        async with SessionLocal() as db:
            count = await db.scalar(select(func.count()).select_from(UserFollow).where(
                UserFollow.follower_id == viewer_id, UserFollow.followee_id == target_id))
            assert count == 1
        for _ in range(2):
            assert (await client.delete(f'/api/v1/users/{target_id}/follow', headers=headers)).status_code == 200
        assert (await client.get('/api/v1/users/me/network', headers=headers)).json() == []


@pytest.mark.asyncio
async def test_presence_tracks_the_recipient_lease_and_respects_visibility_and_blocks(monkeypatch):
    monkeypatch.setattr(settings, 'DEPLOYMENT_TIER', 'staging')
    monkeypatch.setattr(settings, 'REQUIRE_VERIFIED_LOGIN', False)
    monkeypatch.setattr(settings, 'CHAT_REALTIME_BACKEND', 'database')
    async with AsyncClient(transport=ASGITransport(app=app), base_url='https://test') as client:
        viewer_id, headers = await account(client)
        target_id, _ = await account(client)
        presence_url = f'/api/v1/chat/{target_id}/presence'
        assert (await client.get(presence_url)).status_code == 401
        async with SessionLocal.begin() as db:
            viewer = await db.get(User, viewer_id)
            viewer.is_verified = True
            db.add(ChatPresenceLease(instance_id='beta-presence-viewer', user_id=viewer_id,
                expires_at=datetime.now(UTC) + timedelta(minutes=1)))
        # The viewer's live connection says nothing about the recipient.
        assert (await client.get(presence_url, headers=headers)).json() == {'is_online': False}
        async with SessionLocal.begin() as db:
            db.add(ChatPresenceLease(instance_id='beta-presence-target', user_id=target_id,
                expires_at=datetime.now(UTC) + timedelta(minutes=1)))
        assert (await client.get(presence_url, headers=headers)).json() == {'is_online': True}
        async with SessionLocal.begin() as db:
            lease = await db.get(ChatPresenceLease, ('beta-presence-target', target_id))
            lease.expires_at = datetime.now(UTC) - timedelta(seconds=1)
        assert (await client.get(presence_url, headers=headers)).json() == {'is_online': False}
        for tier, required in [('production', False), ('staging', True)]:
            monkeypatch.setattr(settings, 'DEPLOYMENT_TIER', tier)
            monkeypatch.setattr(settings, 'REQUIRE_VERIFIED_LOGIN', required)
            assert (await client.get(presence_url, headers=headers)).status_code == 404
            assert (await client.post(f'/api/v1/users/{target_id}/follow', headers=headers)).status_code == 404
            assert (await client.post('/api/v1/chat', headers=headers, json={'receiver_id': target_id, 'content': 'blocked by verification'})).status_code == 404
        monkeypatch.setattr(settings, 'DEPLOYMENT_TIER', 'staging')
        monkeypatch.setattr(settings, 'REQUIRE_VERIFIED_LOGIN', False)
        async with SessionLocal.begin() as db:
            target = await db.get(User, target_id)
            target.status = UserStatus.SUSPENDED
        assert (await client.get(presence_url, headers=headers)).status_code == 404
        assert (await client.post(f'/api/v1/users/{target_id}/follow', headers=headers)).status_code == 404
        assert (await client.post('/api/v1/chat', headers=headers, json={'receiver_id': target_id, 'content': 'unavailable'})).status_code == 404
        async with SessionLocal.begin() as db:
            target = await db.get(User, target_id)
            target.status = UserStatus.ACTIVE
            db.add(UserBlock(blocker_id=target_id, blocked_id=viewer_id))
        assert (await client.get(presence_url, headers=headers)).status_code == 404
        assert (await client.post(f'/api/v1/users/{target_id}/follow', headers=headers)).status_code == 400
        assert (await client.post('/api/v1/chat', headers=headers, json={'receiver_id': target_id, 'content': 'unavailable'})).status_code == 400


@pytest.mark.asyncio
async def test_notification_rollback_cannot_turn_a_saved_message_into_a_failure(monkeypatch):
    from app.api.v1.endpoints import chat
    monkeypatch.setattr(settings, 'DEPLOYMENT_TIER', 'staging')
    monkeypatch.setattr(settings, 'REQUIRE_VERIFIED_LOGIN', False)

    async def fail_notification(db, **_kwargs):
        await db.execute(text('SELECT 1 / 0'))
    monkeypatch.setattr(chat, 'create_notification', fail_notification)
    async with AsyncClient(transport=ASGITransport(app=app), base_url='https://test') as client:
        viewer_id, headers = await account(client)
        target_id, _ = await account(client)
        result = await client.post('/api/v1/chat', headers=headers, json={'receiver_id': target_id, 'content': 'Saved despite notification failure'})
        assert result.status_code == 200, result.text
        async with SessionLocal() as db:
            saved = (await db.scalars(select(Message).where(Message.sender_id == viewer_id))).all()
            assert len(saved) == 1
            assert saved[0].id == result.json()['id']
