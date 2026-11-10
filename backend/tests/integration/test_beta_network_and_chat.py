from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select

from app.core.config import settings
from app.db.session import SessionLocal
from app.main import app
from app.models.social import UserFollow

pytestmark = pytest.mark.integration


async def account(client):
    email = f"beta-social-{uuid4().hex}@example.com"
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
async def test_legacy_network_data_remains_available_without_duplicate_follows(monkeypatch):
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
        async with SessionLocal() as db:
            count = await db.scalar(select(func.count()).select_from(UserFollow).where(
                UserFollow.follower_id == viewer_id, UserFollow.followee_id == target_id))
            assert count == 1
        for _ in range(2):
            assert (await client.delete(f'/api/v1/users/{target_id}/follow', headers=headers)).status_code == 200
        assert (await client.get('/api/v1/users/me/network', headers=headers)).json() == []
