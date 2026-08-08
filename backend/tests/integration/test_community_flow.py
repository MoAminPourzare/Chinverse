from uuid import uuid4
from datetime import UTC, datetime

import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import SessionLocal
from app.main import app
from app.models.user import User, UserRole


pytestmark = pytest.mark.integration


async def authenticated_user(client: AsyncClient) -> tuple[int, dict[str, str]]:
    suffix = str(uuid4().int)[-9:]
    email = f"community-{uuid4().hex[:12]}@example.com"
    password = "Secure community passphrase 123!"

    signup = await client.post(
        "/api/v1/signup",
        json={
            "email": email,
            "phone": f"09{suffix}",
            "password": password,
            "display_name": "\u06a9\u0627\u0631\u0628\u0631 \u0622\u0632\u0645\u0627\u06cc\u0634\u06cc",
            "accept_terms": True,
            "accept_privacy": True,
            "accept_community_guidelines": True,
        },
    )
    assert signup.status_code == 200, signup.text

    async with SessionLocal() as db:
        user = await db.get(User, signup.json()["id"])
        user.email_verified_at = datetime.now(UTC)
        user.phone_verified_at = datetime.now(UTC)
        user.is_verified = True
        await db.commit()

    login = await client.post(
        "/api/v1/login/access-token",
        data={"username": email, "password": password},
    )
    assert login.status_code == 200, login.text
    return signup.json()["id"], {
        "Authorization": f"Bearer {login.json()['access_token']}"
    }


async def authenticated_headers(client: AsyncClient) -> dict[str, str]:
    _, headers = await authenticated_user(client)
    return headers


@pytest.mark.asyncio
async def test_question_can_be_edited_and_deleted_with_nested_answers():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        headers = await authenticated_headers(client)

        created = await client.post(
            "/api/v1/community/forum/questions",
            headers=headers,
            json={"title": "First question", "content": "Initial question body"},
        )
        assert created.status_code == 200, created.text
        question_id = created.json()["id"]

        updated = await client.patch(
            f"/api/v1/community/forum/questions/{question_id}",
            headers=headers,
            json={"title": "Updated question", "content": "Updated question body"},
        )
        assert updated.status_code == 200, updated.text
        assert updated.json()["title"] == "Updated question"
        assert updated.json()["content"] == "Updated question body"

        parent = await client.post(
            f"/api/v1/community/forum/questions/{question_id}/answers",
            headers=headers,
            json={"content": "Parent answer"},
        )
        assert parent.status_code == 200, parent.text

        child = await client.post(
            f"/api/v1/community/forum/questions/{question_id}/answers",
            headers=headers,
            json={"content": "Nested answer", "parent_id": parent.json()["id"]},
        )
        assert child.status_code == 200, child.text

        deleted = await client.delete(
            f"/api/v1/community/forum/questions/{question_id}",
            headers=headers,
        )
        assert deleted.status_code == 204, deleted.text

        missing = await client.get(f"/api/v1/community/forum/questions/{question_id}")
        assert missing.status_code == 404, missing.text


@pytest.mark.asyncio
async def test_block_prevents_messages_and_reports_are_deduplicated():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="https://test",
    ) as client:
        first_user_id, first_headers = await authenticated_user(client)
        second_user_id, second_headers = await authenticated_user(client)

        blocked = await client.post(
            f"/api/v1/trust/blocks/{second_user_id}",
            headers=first_headers,
        )
        assert blocked.status_code == 200, blocked.text

        rejected_follow = await client.post(
            f"/api/v1/users/{first_user_id}/follow",
            headers=second_headers,
        )
        assert rejected_follow.status_code == 400, rejected_follow.text

        rejected_message = await client.post(
            "/api/v1/chat",
            headers=second_headers,
            json={"receiver_id": first_user_id, "content": "blocked message"},
        )
        assert rejected_message.status_code == 400, rejected_message.text

        unblocked = await client.delete(
            f"/api/v1/trust/blocks/{second_user_id}",
            headers=first_headers,
        )
        assert unblocked.status_code == 204, unblocked.text

        message = await client.post(
            "/api/v1/chat",
            headers=second_headers,
            json={"receiver_id": first_user_id, "content": "reportable message"},
        )
        assert message.status_code == 200, message.text

        _, third_headers = await authenticated_user(client)

        report_payload = {
            "target_type": "message",
            "target_id": message.json()["id"],
            "reason": "harassment",
            "details": "integration security test",
        }
        private_report = await client.post(
            "/api/v1/trust/reports",
            headers=third_headers,
            json=report_payload,
        )
        assert private_report.status_code == 404, private_report.text

        report = await client.post(
            "/api/v1/trust/reports",
            headers=first_headers,
            json=report_payload,
        )
        assert report.status_code == 201, report.text

        duplicate = await client.post(
            "/api/v1/trust/reports",
            headers=first_headers,
            json=report_payload,
        )
        assert duplicate.status_code == 409, duplicate.text

        moderation_denied = await client.get(
            "/api/v1/trust/moderation/reports",
            headers=first_headers,
        )
        assert moderation_denied.status_code == 403, moderation_denied.text

        async with SessionLocal() as session:
            moderator = await session.get(User, first_user_id)
            admin = await session.get(User, second_user_id)
            moderator.role = UserRole.MODERATOR
            admin.role = UserRole.ADMIN
            await session.commit()

        admin_report = await client.post(
            "/api/v1/trust/reports",
            headers=third_headers,
            json={
                "target_type": "user",
                "target_id": second_user_id,
                "reason": "other",
                "details": "role hierarchy integration test",
            },
        )
        assert admin_report.status_code == 201, admin_report.text

        moderation_allowed = await client.get(
            "/api/v1/trust/moderation/reports",
            headers=first_headers,
        )
        assert moderation_allowed.status_code == 200, moderation_allowed.text

        forbidden_suspension = await client.post(
            f"/api/v1/trust/moderation/reports/{admin_report.json()['id']}/resolve",
            headers=first_headers,
            json={"action": "suspend_user", "notes": "must be rejected"},
        )
        assert forbidden_suspension.status_code == 403, forbidden_suspension.text
