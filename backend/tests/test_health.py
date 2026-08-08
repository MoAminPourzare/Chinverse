import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint_and_security_headers():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "chinverse-api",
        "deployment_tier": "staging",
        "release": "local",
    }
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert response.headers["content-security-policy"] == (
        "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
    )
    assert response.headers["x-chinverse-deployment-tier"] == "staging"
    assert "noindex" in response.headers["x-robots-tag"]


@pytest.mark.asyncio
async def test_openapi_is_available_in_test_environment():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/openapi.json")

    assert response.status_code == 200
    assert "/api/v1/signup" in response.json()["paths"]


@pytest.mark.asyncio
async def test_allowed_browser_origin_reaches_the_application():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/health",
            headers={"Origin": "http://localhost:3000"},
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


@pytest.mark.asyncio
async def test_disallowed_browser_origin_is_rejected_before_endpoint_execution():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/health",
            headers={"Origin": "https://evil.example"},
        )

    assert response.status_code == 403
    assert response.json() == {"detail": "Origin not allowed"}
    assert response.headers["x-content-type-options"] == "nosniff"


@pytest.mark.asyncio
async def test_api_responses_are_never_stored_by_browser_or_shared_caches():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/users/me")

    assert response.status_code == 401
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["pragma"] == "no-cache"


@pytest.mark.asyncio
async def test_incomplete_public_features_are_not_routed_by_default():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        subscription = await client.get("/api/v1/subscriptions/me")
        referrals = await client.get("/api/v1/referrals/me")

    assert subscription.status_code == 404
    assert referrals.status_code == 404
