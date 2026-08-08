from uuid import uuid4
import time

import pytest
from httpx import ASGITransport, AsyncClient
import pyotp
from sqlalchemy import select

from app.main import app
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.security import LegalAcceptance
from app.models.user import User, UserRole


pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_signup_login_and_authenticated_profile_round_trip():
    suffix = str(uuid4().int)[-9:]
    email = f"phase1-{uuid4().hex[:12]}@example.com"
    phone = f"09{suffix}"
    password = "Secure auth passphrase 123!"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        readiness = await client.get("/health/ready")
        assert readiness.status_code == 200, readiness.text
        assert readiness.json() == {
            "status": "ok",
            "checks": {"database": "ok"},
        }

        signup = await client.post(
            "/api/v1/signup",
            json={
                "email": email.upper(),
                "phone": phone,
                "password": password,
                "display_name": "کاربر آزمایشی",
                "accept_terms": True,
                "accept_privacy": True,
                "accept_community_guidelines": True,
            },
        )
        assert signup.status_code == 200, signup.text
        assert signup.json()["email"] == email

        async with SessionLocal() as db:
            accepted = (
                await db.execute(
                    select(LegalAcceptance).where(
                        LegalAcceptance.user_id == signup.json()["id"]
                    )
                )
            ).scalars().all()
        assert {item.document_type for item in accepted} == {
            "terms",
            "privacy",
            "community_guidelines",
        }
        assert all(item.ip_hash and item.user_agent_hash for item in accepted)

        login = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": password},
        )
        assert login.status_code == 200, login.text
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        me = await client.get("/api/v1/users/me", headers=headers)
        assert me.status_code == 200, me.text
        assert me.json()["profile"]["display_name"] == "کاربر آزمایشی"

        external_avatar = await client.put(
            "/api/v1/users/me/profile",
            headers=headers,
            json={"avatar_url": "https://tracker.example/pixel.png"},
        )
        assert external_avatar.status_code == 400, external_avatar.text

        activity = await client.get(
            "/api/v1/daily-activity/summary?days=7",
            headers=headers,
        )
        assert activity.status_code == 200, activity.text
        assert activity.json()["streak"]["current_days"] == 0

        update = await client.put(
            "/api/v1/users/me/profile",
            headers=headers,
            json={
                "gender": "خانم",
                "country": "ایران",
                "city": "یزد",
                "profile_truth_confirmed": True,
            },
        )
        assert update.status_code == 200, update.text
        profile = update.json()["profile"]
        assert profile["gender"] == "خانم"
        assert profile["profile_truth_confirmed"] is True


@pytest.mark.asyncio
async def test_account_deletion_requires_reauthentication_and_revokes_access():
    suffix = str(uuid4().int)[-9:]
    email = f"delete-{uuid4().hex[:12]}@example.com"
    phone = f"09{suffix}"
    password = "Secure deletion passphrase 123!"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        signup = await client.post(
            "/api/v1/signup",
            json={
                "email": email,
                "phone": phone,
                "password": password,
                "display_name": "کاربر حذف آزمایشی",
                "accept_terms": True,
                "accept_privacy": True,
                "accept_community_guidelines": True,
            },
        )
        assert signup.status_code == 200, signup.text

        login = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": password},
        )
        assert login.status_code == 200, login.text
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        rejected = await client.request(
            "DELETE",
            "/api/v1/users/me",
            headers=headers,
            json={"current_password": "incorrect password", "confirm": True},
        )
        assert rejected.status_code == 401, rejected.text
        assert (await client.get("/api/v1/users/me", headers=headers)).status_code == 200

        deleted = await client.request(
            "DELETE",
            "/api/v1/users/me",
            headers=headers,
            json={"current_password": password, "confirm": True},
        )
        assert deleted.status_code == 200, deleted.text
        assert (await client.get("/api/v1/users/me", headers=headers)).status_code == 401

        async with SessionLocal() as db:
            assert await db.scalar(select(User.id).where(User.email == email)) is None


@pytest.mark.asyncio
async def test_refresh_logout_and_phone_challenge_lockout(monkeypatch):
    monkeypatch.setattr(settings, "AUTH_DEBUG_TOKENS", True)
    suffix = str(uuid4().int)[-9:]
    email = f"security-{uuid4().hex[:12]}@example.com"
    password = "Secure refresh passphrase 123!"

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="https://test",
    ) as client:
        signup = await client.post(
            "/api/v1/signup",
            json={
                "email": email,
                "phone": f"09{suffix}",
                "password": password,
                "display_name": "کاربر امنیتی",
                "accept_terms": True,
                "accept_privacy": True,
                "accept_community_guidelines": True,
            },
        )
        assert signup.status_code == 200, signup.text

        login = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": password},
        )
        assert login.status_code == 200, login.text
        first_token = login.json()["access_token"]
        first_refresh_cookie = client.cookies.get(settings.REFRESH_COOKIE_NAME)
        assert first_refresh_cookie

        refreshed = await client.post("/api/v1/auth/refresh")
        assert refreshed.status_code == 200, refreshed.text
        refreshed_token = refreshed.json()["access_token"]
        assert refreshed_token != first_token
        second_refresh_cookie = client.cookies.get(settings.REFRESH_COOKIE_NAME)
        assert second_refresh_cookie != first_refresh_cookie
        headers = {"Authorization": f"Bearer {refreshed_token}"}

        sessions = await client.get("/api/v1/auth/sessions", headers=headers)
        assert sessions.status_code == 200, sessions.text
        assert len(sessions.json()) == 1

        replay = await client.post(
            "/api/v1/auth/refresh",
            headers={"Cookie": f"{settings.REFRESH_COOKIE_NAME}={first_refresh_cookie}"},
        )
        assert replay.status_code == 401, replay.text
        replay_revoked_session = await client.get(
            "/api/v1/users/me",
            headers=headers,
        )
        assert replay_revoked_session.status_code == 401, replay_revoked_session.text

        login_again = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": password},
        )
        assert login_again.status_code == 200, login_again.text
        headers = {"Authorization": f"Bearer {login_again.json()['access_token']}"}

        phone_request = await client.post(
            "/api/v1/auth/verification/phone/request",
            headers=headers,
        )
        assert phone_request.status_code == 200, phone_request.text
        phone_token = phone_request.json()["debug_token"]
        assert phone_token
        wrong_token = "000000" if phone_token != "000000" else "999999"
        for _ in range(8):
            rejected = await client.post(
                "/api/v1/auth/verification/phone/confirm",
                headers=headers,
                json={"token": wrong_token},
            )
            assert rejected.status_code == 401, rejected.text

        locked = await client.post(
            "/api/v1/auth/verification/phone/confirm",
            headers=headers,
            json={"token": phone_token},
        )
        assert locked.status_code == 401, locked.text

        logout = await client.post("/api/v1/auth/logout")
        assert logout.status_code == 204, logout.text
        revoked_session = await client.get("/api/v1/users/me", headers=headers)
        assert revoked_session.status_code == 401, revoked_session.text


@pytest.mark.asyncio
async def test_unverified_session_is_limited_until_email_and_phone_are_confirmed(
    monkeypatch,
):
    monkeypatch.setattr(settings, "AUTH_DEBUG_TOKENS", True)
    monkeypatch.setattr(settings, "REQUIRE_VERIFIED_LOGIN", True)
    suffix = str(uuid4().int)[-9:]
    email = f"verification-{uuid4().hex[:12]}@example.com"
    password = "Secure verify passphrase 123!"

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="https://test",
    ) as client:
        signup = await client.post(
            "/api/v1/signup",
            json={
                "email": email,
                "phone": f"09{suffix}",
                "password": password,
                "display_name": "کاربر آزمایشی",
                "accept_terms": True,
                "accept_privacy": True,
                "accept_community_guidelines": True,
            },
        )
        assert signup.status_code == 200, signup.text

        login = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": password},
        )
        assert login.status_code == 200, login.text
        assert login.json()["requires_verification"] is True
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        blocked_profile = await client.get("/api/v1/users/me", headers=headers)
        assert blocked_profile.status_code == 403, blocked_profile.text
        initial_status = await client.get(
            "/api/v1/auth/verification/status",
            headers=headers,
        )
        assert initial_status.json()["account_verified"] is False

        email_request = await client.post(
            "/api/v1/auth/verification/email/request",
            headers=headers,
        )
        email_token = email_request.json()["debug_token"]
        email_confirm = await client.post(
            "/api/v1/auth/verification/email/confirm",
            json={"token": email_token},
        )
        assert email_confirm.status_code == 200, email_confirm.text

        phone_request = await client.post(
            "/api/v1/auth/verification/phone/request",
            headers=headers,
        )
        phone_token = phone_request.json()["debug_token"]
        phone_confirm = await client.post(
            "/api/v1/auth/verification/phone/confirm",
            headers=headers,
            json={"token": phone_token},
        )
        assert phone_confirm.status_code == 200, phone_confirm.text

        verified_profile = await client.get("/api/v1/users/me", headers=headers)
        assert verified_profile.status_code == 200, verified_profile.text


@pytest.mark.asyncio
async def test_admin_mfa_enrollment_revokes_sessions_and_backup_codes_are_one_time(
    monkeypatch,
):
    suffix = str(uuid4().int)[-9:]
    email = f"admin-mfa-{uuid4().hex[:12]}@example.com"
    password = "Secure admin passphrase 123!"

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="https://test",
    ) as client:
        signup = await client.post(
            "/api/v1/signup",
            json={
                "email": email,
                "phone": f"09{suffix}",
                "password": password,
                "display_name": "مدیر آزمایشی",
                "accept_terms": True,
                "accept_privacy": True,
                "accept_community_guidelines": True,
            },
        )
        assert signup.status_code == 200, signup.text

        async with SessionLocal() as db:
            user = await db.get(User, signup.json()["id"])
            user.role = UserRole.ADMIN
            await db.commit()

        target_email = f"role-target-{uuid4().hex[:12]}@example.com"
        target_password = "Secure target passphrase 123!"
        target_signup = await client.post(
            "/api/v1/signup",
            json={
                "email": target_email,
                "phone": f"09{str(uuid4().int)[-9:]}",
                "password": target_password,
                "display_name": "کاربر نقش آزمایشی",
                "accept_terms": True,
                "accept_privacy": True,
                "accept_community_guidelines": True,
            },
        )
        assert target_signup.status_code == 200, target_signup.text
        target_login = await client.post(
            "/api/v1/login/access-token",
            data={"username": target_email, "password": target_password},
        )
        assert target_login.status_code == 200, target_login.text
        old_target_headers = {
            "Authorization": f"Bearer {target_login.json()['access_token']}"
        }

        login = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": password},
        )
        assert login.status_code == 200, login.text
        assert login.headers["cache-control"] == "no-store"
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        protected = await client.get("/api/v1/admin/overview", headers=headers)
        assert protected.status_code == 403, protected.text

        wrong_password = await client.post(
            "/api/v1/auth/mfa/setup",
            headers=headers,
            json={"current_password": "Wrong123"},
        )
        assert wrong_password.status_code == 401, wrong_password.text

        setup = await client.post(
            "/api/v1/auth/mfa/setup",
            headers=headers,
            json={"current_password": password},
        )
        assert setup.status_code == 200, setup.text
        secret = setup.json()["secret"]

        confirmed = await client.post(
            "/api/v1/auth/mfa/confirm",
            headers=headers,
            json={"code": pyotp.TOTP(secret).now()},
        )
        assert confirmed.status_code == 200, confirmed.text
        backup_code = confirmed.json()["backup_codes"][0]

        revoked = await client.get("/api/v1/admin/overview", headers=headers)
        assert revoked.status_code == 401, revoked.text

        missing_mfa = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": password},
        )
        assert missing_mfa.status_code == 401, missing_mfa.text

        totp = pyotp.TOTP(secret)
        next_counter = int(time.time()) // totp.interval + 1
        login_code = totp.at(next_counter * totp.interval)
        mfa_login = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": password},
            headers={"X-MFA-Code": login_code},
        )
        assert mfa_login.status_code == 200, mfa_login.text
        assert mfa_login.json()["mfa_verified"] is True
        mfa_headers = {
            "Authorization": f"Bearer {mfa_login.json()['access_token']}"
        }
        overview = await client.get("/api/v1/admin/overview", headers=mfa_headers)
        assert overview.status_code == 200, overview.text

        role_change = await client.patch(
            f"/api/v1/admin/users/{target_signup.json()['id']}/role",
            headers=mfa_headers,
            json={"role": "moderator"},
        )
        assert role_change.status_code == 200, role_change.text
        assert role_change.json()["role"] == "moderator"
        assert (
            await client.get("/api/v1/users/me", headers=old_target_headers)
        ).status_code == 401

        self_demotion = await client.patch(
            f"/api/v1/admin/users/{signup.json()['id']}/role",
            headers=mfa_headers,
            json={"role": "user"},
        )
        assert self_demotion.status_code == 400, self_demotion.text

        target_relogin = await client.post(
            "/api/v1/login/access-token",
            data={"username": target_email, "password": target_password},
        )
        assert target_relogin.status_code == 200, target_relogin.text
        moderator_access = await client.get(
            "/api/v1/trust/moderation/access",
            headers={
                "Authorization": f"Bearer {target_relogin.json()['access_token']}"
            },
        )
        assert moderator_access.status_code == 200, moderator_access.text
        assert moderator_access.json()["can_moderate"] is True

        replayed_totp = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": password},
            headers={"X-MFA-Code": login_code},
        )
        assert replayed_totp.status_code == 401, replayed_totp.text

        backup_login = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": password},
            headers={"X-MFA-Code": backup_code},
        )
        assert backup_login.status_code == 200, backup_login.text

        backup_reuse = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": password},
            headers={"X-MFA-Code": backup_code},
        )
        assert backup_reuse.status_code == 401, backup_reuse.text
