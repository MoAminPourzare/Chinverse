"""Keep mixed and filtered home activity pages stable when timestamps are equal."""
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.db.session import SessionLocal
from app.main import app
from app.models.service import UserService
from app.models.user import User, UserGalleryItem, UserStatus

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_home_feed_has_stable_mixed_pagination_and_server_side_filters(monkeypatch):
    monkeypatch.setattr(settings, "DEPLOYMENT_TIER", "staging")
    monkeypatch.setattr(settings, "REQUIRE_VERIFIED_LOGIN", False)
    stamp = datetime(2090, 1, 1, tzinfo=timezone.utc)
    suffix = uuid4().hex
    async with SessionLocal.begin() as db:
        owner = User(email=f"feed-{suffix}@example.com", phone=f"07{uuid4().int % 10**9:09d}",
                     password_hash="unused-test-hash", status=UserStatus.ACTIVE, is_verified=False)
        db.add(owner)
        await db.flush()
        posts = [UserGalleryItem(user_id=owner.id, image_url=f"/uploads/gallery/{suffix}-{i}.jpg", created_at=stamp) for i in range(2)]
        services = [UserService(user_id=owner.id, title=f"feed-{suffix}-{i}", description="شرح خدمت", created_at=stamp) for i in range(2)]
        db.add_all([*posts, *services])
        await db.flush()
        expected = [f"service_{item.id}" for item in reversed(services)] + [f"gallery_{item.id}" for item in reversed(posts)]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        first = await client.get("/api/v1/feed?limit=2")
        second = await client.get("/api/v1/feed?limit=2&skip=2")
        assert first.status_code == second.status_code == 200
        assert [item["id"] for item in first.json() + second.json()] == expected
        for kind, wanted in (("service", expected[:2]), ("gallery", expected[2:])):
            response = await client.get(f"/api/v1/feed?kind={kind}&limit=2")
            assert response.status_code == 200
            assert [item["id"] for item in response.json()] == wanted
            assert all(item["type"] == kind for item in response.json())
        assert (await client.get("/api/v1/feed?kind=unknown")).status_code == 422
