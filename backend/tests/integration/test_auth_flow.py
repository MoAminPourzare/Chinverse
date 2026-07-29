from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_signup_login_and_authenticated_profile_round_trip():
    suffix = str(uuid4().int)[-9:]
    email = f"phase1-{uuid4().hex[:12]}@example.com"
    phone = f"09{suffix}"
    password = "Secure123"

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
            },
        )
        assert signup.status_code == 200, signup.text
        assert signup.json()["email"] == email

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
