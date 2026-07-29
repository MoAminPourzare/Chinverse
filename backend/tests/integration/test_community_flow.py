from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


pytestmark = pytest.mark.integration


async def authenticated_headers(client: AsyncClient) -> dict[str, str]:
    suffix = str(uuid4().int)[-9:]
    email = f"community-{uuid4().hex[:12]}@example.com"
    password = "Secure123"

    signup = await client.post(
        "/api/v1/signup",
        json={
            "email": email,
            "phone": f"09{suffix}",
            "password": password,
            "display_name": "\u06a9\u0627\u0631\u0628\u0631 \u0622\u0632\u0645\u0627\u06cc\u0634\u06cc",
        },
    )
    assert signup.status_code == 200, signup.text

    login = await client.post(
        "/api/v1/login/access-token",
        data={"username": email, "password": password},
    )
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


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
