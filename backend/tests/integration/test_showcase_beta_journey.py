"""Exercise the beta directory and protect verified-only deployments and private fields."""

from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.db.session import SessionLocal
from app.main import app
from app.models.service import UserService
from app.models.user import User, UserProfile, UserStatus


pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_showcase_registration_service_details_and_visibility_policy(monkeypatch):
    monkeypatch.setattr(settings, "DEPLOYMENT_TIER", "staging")
    monkeypatch.setattr(settings, "REQUIRE_VERIFIED_LOGIN", False)
    suffix = str(uuid4().int)[-9:]
    email = f"showcase-{uuid4().hex}@example.com"
    password = "Showcase regression passphrase 123!"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        signup = await client.post("/api/v1/signup", json={
            "email": email, "phone": f"09{suffix}", "password": password,
            "display_name": "عرفان آزمایشی",
            "accept_terms": True, "accept_privacy": True, "accept_community_guidelines": True,
        })
        assert signup.status_code == 200, signup.text
        owner_id = signup.json()["id"]
        assert signup.json()["is_verified"] is False
        login = await client.post("/api/v1/login/access-token", data={"username": email, "password": password})
        assert login.status_code == 200, login.text
        owner_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        created = await client.post("/api/v1/users/me/services", headers=owner_headers, data={
            "title": "خدمت آزمایشی عرفان", "description": "توضیحات خدمت برای بازآزمایی ویترین.",
        })
        assert created.status_code == 201, created.text
        service_id = created.json()["id"]

        async with SessionLocal() as db:
            control = User(email=f"verified-{uuid4().hex}@example.com", phone=f"08{suffix}",
                password_hash="unused-fixture-hash", status=UserStatus.ACTIVE, is_verified=True)
            db.add(control)
            await db.flush()
            control_id = control.id
            db.add(UserProfile(user_id=control_id, display_name="کاربر تأییدشده"))
            control_service = UserService(user_id=control_id, title="خدمت کاربر تأییدشده", description="شرح خدمت")
            db.add(control_service)
            await db.flush()
            control_service_id = control_service.id
            await db.commit()

        async def check_public_routes(visible):
            users = await client.get("/api/v1/users/showcase?limit=100")
            services = await client.get("/api/v1/users/me/services/public?limit=100")
            assert users.status_code == services.status_code == 200
            assert (owner_id in {item["id"] for item in users.json()}) is visible
            assert (service_id in {item["id"] for item in services.json()}) is visible
            assert control_id in {item["id"] for item in users.json()}
            assert control_service_id in {item["id"] for item in services.json()}
            for path in (
                f"/api/v1/users/{owner_id}/public",
                f"/api/v1/users/{owner_id}/services",
                f"/api/v1/users/me/services/public/{service_id}",
            ):
                response = await client.get(path)
                assert response.status_code == (200 if visible else 404), response.text
                assert email not in response.text
                assert password not in response.text
                assert '"phone"' not in response.text
                assert '"password_hash"' not in response.text
            assert email not in users.text + services.text
            assert '"phone"' not in users.text + services.text

        for tier, required, visible in (
            ("staging", False, True), ("staging", True, False),
            ("production", False, False), ("local", False, False),
        ):
            monkeypatch.setattr(settings, "DEPLOYMENT_TIER", tier)
            monkeypatch.setattr(settings, "REQUIRE_VERIFIED_LOGIN", required)
            await check_public_routes(visible)

        monkeypatch.setattr(settings, "DEPLOYMENT_TIER", "staging")
        monkeypatch.setattr(settings, "REQUIRE_VERIFIED_LOGIN", False)
        for status in (UserStatus.SUSPENDED, UserStatus.DELETED):
            async with SessionLocal() as db:
                owner = await db.get(User, owner_id)
                owner.status = status
                owner.is_verified = True
                await db.commit()
            await check_public_routes(False)
