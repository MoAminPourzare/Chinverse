from datetime import UTC, datetime
import time
from uuid import uuid4

import pytest
import pyotp
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from starlette.requests import Request

from app.api.rate_limit import enforce_rate_limit
from app.core.config import settings
from app.db.session import SessionLocal
from app.main import app
from app.models.moderation import ContentReport, ModerationAction
from app.models.user import User, UserRole


pytestmark = pytest.mark.integration
PASSWORD = "Secure trust passphrase 123!"
LEGAL_ACCEPTANCE = {
    "accept_terms": True,
    "accept_privacy": True,
    "accept_community_guidelines": True,
}


async def create_verified_user(
    client: AsyncClient,
    label: str,
    *,
    role: UserRole = UserRole.USER,
) -> tuple[int, dict[str, str], str]:
    suffix = str(uuid4().int)[-9:]
    email = f"{label}-{uuid4().hex[:10]}@example.com"
    signup = await client.post(
        "/api/v1/signup",
        json={
            "email": email,
            "phone": f"09{suffix}",
            "password": PASSWORD,
            "display_name": "کاربر امنیت",
            **LEGAL_ACCEPTANCE,
        },
    )
    assert signup.status_code == 200, signup.text
    user_id = signup.json()["id"]

    async with SessionLocal() as db:
        user = await db.get(User, user_id)
        now = datetime.now(UTC)
        user.email_verified_at = now
        user.phone_verified_at = now
        user.is_verified = True
        user.role = role
        await db.commit()

    login = await client.post(
        "/api/v1/login/access-token",
        data={"username": email, "password": PASSWORD},
    )
    assert login.status_code == 200, login.text
    return user_id, {"Authorization": f"Bearer {login.json()['access_token']}"}, email


@pytest.mark.asyncio
async def test_database_rate_limit_is_shared_and_keyed_by_account(monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_ENABLED", True)
    monkeypatch.setattr(settings, "RATE_LIMIT_BACKEND", "database")
    request = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/login",
            "headers": [],
            "client": ("198.51.100.8", 1234),
            "server": ("test", 443),
            "scheme": "https",
            "query_string": b"",
        }
    )
    limiter_name = f"phase3-shared-{uuid4().hex}"
    for _ in range(2):
        await enforce_rate_limit(
            request,
            name=limiter_name,
            max_requests=2,
            window_seconds=60,
            discriminator="person@example.com",
        )
    with pytest.raises(HTTPException) as limited:
        await enforce_rate_limit(
            request,
            name=limiter_name,
            max_requests=2,
            window_seconds=60,
            discriminator="person@example.com",
        )
    assert limited.value.status_code == 429
    assert int(limited.value.headers["Retry-After"]) >= 1

    await enforce_rate_limit(
        request,
        name=limiter_name,
        max_requests=2,
        window_seconds=60,
        discriminator="another@example.com",
    )


@pytest.mark.asyncio
async def test_report_claim_remove_role_boundary_suspend_and_audit_survival():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="https://test",
    ) as client:
        owner_id, owner_headers, _ = await create_verified_user(client, "owner")
        reporter_id, reporter_headers, _ = await create_verified_user(client, "reporter")
        moderator_id, moderator_headers, _ = await create_verified_user(
            client,
            "moderator",
            role=UserRole.MODERATOR,
        )

        question = await client.post(
            "/api/v1/community/forum/questions",
            headers=owner_headers,
            json={"title": "Question to moderate", "content": "Reported content"},
        )
        assert question.status_code == 200, question.text
        question_id = question.json()["id"]

        report = await client.post(
            "/api/v1/trust/reports",
            headers=reporter_headers,
            json={
                "target_type": "question",
                "target_id": question_id,
                "reason": "spam",
                "details": "Repeated promotional content",
            },
        )
        assert report.status_code == 201, report.text
        report_id = report.json()["id"]

        duplicate = await client.post(
            "/api/v1/trust/reports",
            headers=reporter_headers,
            json={"target_type": "question", "target_id": question_id, "reason": "spam"},
        )
        assert duplicate.status_code == 409, duplicate.text
        self_report = await client.post(
            "/api/v1/trust/reports",
            headers=reporter_headers,
            json={"target_type": "user", "target_id": reporter_id, "reason": "other"},
        )
        assert self_report.status_code == 400, self_report.text

        queue = await client.get(
            "/api/v1/trust/moderation/reports",
            headers=moderator_headers,
        )
        assert queue.status_code == 200, queue.text
        assert report_id in {item["id"] for item in queue.json()}

        claimed = await client.post(
            f"/api/v1/trust/moderation/reports/{report_id}/claim",
            headers=moderator_headers,
        )
        assert claimed.status_code == 200, claimed.text
        assert claimed.json()["status"] == "reviewing"
        assert claimed.json()["assigned_to"] == moderator_id

        removed = await client.post(
            f"/api/v1/trust/moderation/reports/{report_id}/resolve",
            headers=moderator_headers,
            json={"action": "remove", "notes": "Confirmed by review"},
        )
        assert removed.status_code == 200, removed.text
        assert removed.json()["resolution"] == "remove"
        missing_question = await client.get(
            f"/api/v1/community/forum/questions/{question_id}"
        )
        assert missing_question.status_code == 404, missing_question.text

        notifications = await client.get(
            "/api/v1/notifications",
            headers=reporter_headers,
        )
        assert notifications.status_code == 200, notifications.text
        assert any(item["type"] == "moderation" for item in notifications.json())

        admin_owner_id, admin_owner_headers, admin_owner_email = await create_verified_user(
            client,
            "admin-owner",
            role=UserRole.ADMIN,
        )
        admin_question = await client.post(
            "/api/v1/community/forum/questions",
            headers=admin_owner_headers,
            json={"title": "Administrator content", "content": "Protected by role boundary"},
        )
        assert admin_question.status_code == 200, admin_question.text
        admin_question_id = admin_question.json()["id"]
        admin_report = await client.post(
            "/api/v1/trust/reports",
            headers=reporter_headers,
            json={"target_type": "question", "target_id": admin_question_id, "reason": "other"},
        )
        assert admin_report.status_code == 201, admin_report.text
        forbidden_remove = await client.post(
            f"/api/v1/trust/moderation/reports/{admin_report.json()['id']}/resolve",
            headers=moderator_headers,
            json={"action": "remove"},
        )
        assert forbidden_remove.status_code == 403, forbidden_remove.text
        assert (await client.get(f"/api/v1/community/forum/questions/{admin_question_id}")).status_code == 200

        victim_id, victim_headers, victim_email = await create_verified_user(client, "victim")
        victim_report = await client.post(
            "/api/v1/trust/reports",
            headers=reporter_headers,
            json={"target_type": "user", "target_id": victim_id, "reason": "harassment"},
        )
        suspended = await client.post(
            f"/api/v1/trust/moderation/reports/{victim_report.json()['id']}/resolve",
            headers=moderator_headers,
            json={"action": "suspend_user", "notes": "Confirmed abuse"},
        )
        assert suspended.status_code == 200, suspended.text
        assert (await client.get("/api/v1/users/me", headers=victim_headers)).status_code == 401
        assert (await client.get(f"/api/v1/users/{victim_id}/public")).status_code == 404
        relogin = await client.post(
            "/api/v1/login/access-token",
            data={"username": victim_email, "password": PASSWORD},
        )
        assert relogin.status_code == 403, relogin.text

        mfa_setup = await client.post(
            "/api/v1/auth/mfa/setup",
            headers=admin_owner_headers,
            json={"current_password": PASSWORD},
        )
        assert mfa_setup.status_code == 200, mfa_setup.text
        secret = mfa_setup.json()["secret"]
        mfa_confirm = await client.post(
            "/api/v1/auth/mfa/confirm",
            headers=admin_owner_headers,
            json={"code": pyotp.TOTP(secret).now()},
        )
        assert mfa_confirm.status_code == 200, mfa_confirm.text
        admin_login = await client.post(
            "/api/v1/login/access-token",
            data={"username": admin_owner_email, "password": PASSWORD},
            headers={"X-MFA-Code": pyotp.TOTP(secret).at(time.time() + 30)},
        )
        assert admin_login.status_code == 200, admin_login.text
        verified_admin_headers = {
            "Authorization": f"Bearer {admin_login.json()['access_token']}"
        }
        restored = await client.patch(
            f"/api/v1/admin/users/{victim_id}/status",
            headers=verified_admin_headers,
            json={"status": "active"},
        )
        assert restored.status_code == 200, restored.text
        assert restored.json()["status"] == "active"
        restored_login = await client.post(
            "/api/v1/login/access-token",
            data={"username": victim_email, "password": PASSWORD},
        )
        assert restored_login.status_code == 200, restored_login.text

        deleted = await client.request(
            "DELETE",
            "/api/v1/users/me",
            headers=reporter_headers,
            json={"current_password": PASSWORD, "confirm": True},
        )
        assert deleted.status_code == 200, deleted.text
        assert "Max-Age=0" in deleted.headers.get("set-cookie", "")
        async with SessionLocal() as db:
            preserved_report = await db.get(ContentReport, report_id)
            assert preserved_report is not None
            assert preserved_report.reporter_id is None
            action = await db.scalar(
                select(ModerationAction).where(ModerationAction.report_id == report_id)
            )
            assert action is not None

        assert owner_id != admin_owner_id
