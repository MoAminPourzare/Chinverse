import asyncio
import json
import logging
import time
from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from app import main as main_module
from app.core import observability
from app.core import health as health_module
from app.core.config import settings
from app.core.health import _bounded_check
from app.core.observability import (
    JsonLogFormatter,
    RedactingTextFormatter,
    RequestObservabilityMiddleware,
    _method_label,
)
from app.main import app
from app.db.session import engine


@pytest.mark.asyncio
async def test_health_endpoint_and_security_headers():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "chinverse-api",
        "deployment_tier": "staging",
        "indexable": False,
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
    assert response.headers["cache-control"] == "no-store"


@pytest.mark.asyncio
async def test_liveness_does_not_call_dependency_readiness(monkeypatch):
    readiness = AsyncMock(side_effect=AssertionError("liveness must not touch dependencies"))
    monkeypatch.setattr(main_module, "readiness_checks", readiness)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    readiness.assert_not_awaited()


@pytest.mark.asyncio
async def test_readiness_reports_database_and_storage_and_fails_closed(monkeypatch):
    readiness = AsyncMock(return_value={"database": "ok", "storage": "ok"})
    monkeypatch.setattr(main_module, "readiness_checks", readiness)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        healthy = await client.get("/health/ready")
    assert healthy.status_code == 200
    assert healthy.json() == {
        "status": "ok",
        "checks": {"database": "ok", "storage": "ok"},
    }
    assert healthy.headers["cache-control"] == "no-store"

    readiness.return_value = {"database": "ok", "storage": "failed"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        unavailable = await client.get("/health/ready")
    assert unavailable.status_code == 503
    assert unavailable.json() == {
        "status": "unavailable",
        "checks": {"database": "ok", "storage": "failed"},
    }
    assert unavailable.headers["cache-control"] == "no-store"


@pytest.mark.asyncio
async def test_unhandled_error_keeps_request_id_security_cors_and_private_logs(caplog):
    request_id = "123e4567-e89b-12d3-a456-426614174000"

    async def explode():
        raise RuntimeError("synthetic phase seven failure")

    route_count = len(app.router.routes)
    app.add_api_route("/_phase7/unhandled", explode, methods=["GET"], include_in_schema=False)
    caplog.set_level("INFO", logger="chinverse.request")
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/_phase7/unhandled?token=must-not-appear",
                headers={
                    "Origin": "http://localhost:3000",
                    "Authorization": "Bearer must-not-appear",
                    "X-Request-ID": request_id,
                },
            )
    finally:
        del app.router.routes[route_count:]

    assert response.status_code == 500
    assert response.json()["request_id"] == request_id
    assert response.headers["x-request-id"] == request_id
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["content-security-policy"].startswith("default-src 'none'")
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    request_records = [record for record in caplog.records if record.name == "chinverse.request"]
    assert request_records
    rendered = "\n".join(record.getMessage() for record in request_records)
    assert "must-not-appear" not in rendered


@pytest.mark.asyncio
async def test_metrics_are_disabled_by_default_and_require_a_strong_bearer(monkeypatch):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        disabled = await client.get("/metrics")
    assert disabled.status_code == 404

    token = "phase-seven-metrics-token-that-is-long-enough"
    monkeypatch.setattr(settings, "METRICS_ENABLED", True)
    monkeypatch.setattr(settings, "METRICS_BEARER_TOKEN", token)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        unauthorized = await client.get("/metrics")
        authorized = await client.get(
            "/metrics",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert unauthorized.status_code == 401
    assert unauthorized.headers["cache-control"] == "no-store"
    assert authorized.status_code == 200
    assert authorized.headers["cache-control"] == "no-store"
    assert "chinverse_http_requests_total" in authorized.text


def test_metric_method_label_has_bounded_cardinality() -> None:
    assert _method_label("get") == "GET"
    assert _method_label("BREW") == "OTHER"
    assert _method_label("attacker-controlled-method") == "OTHER"


def test_json_logs_redact_provider_credentials_and_pii() -> None:
    record = logging.LogRecord(
        name="test",
        level=logging.ERROR,
        pathname=__file__,
        lineno=1,
        msg=(
            "Bearer bearer-secret user@example.com password=hunter2 "
            "postgresql://user:db-secret@db.example/chinverse "
            "X-Amz-Signature=signed-value"
        ),
        args=(),
        exc_info=None,
    )
    rendered = JsonLogFormatter().format(record)
    plain_rendered = RedactingTextFormatter("%(message)s").format(record)
    for secret in (
        "bearer-secret",
        "user@example.com",
        "hunter2",
        "db-secret",
        "signed-value",
    ):
        assert secret not in rendered
        assert secret not in plain_rendered


@pytest.mark.asyncio
async def test_untrusted_request_id_is_replaced_instead_of_logged() -> None:
    supplied = "token=attacker-secret"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health", headers={"X-Request-ID": supplied})

    generated = response.headers["x-request-id"]
    assert generated != supplied
    assert observability.REQUEST_ID_RE.fullmatch(generated)


@pytest.mark.asyncio
async def test_observability_waits_for_the_complete_streamed_body() -> None:
    response_started = asyncio.Event()
    release_body = asyncio.Event()
    messages: list[dict] = []

    async def streaming_app(_scope, _receive, send):
        await send({"type": "http.response.start", "status": 200, "headers": []})
        response_started.set()
        await release_body.wait()
        await send({"type": "http.response.body", "body": b"done", "more_body": False})

    async def receive():
        return {"type": "http.disconnect"}

    async def send(message):
        messages.append(message)

    middleware = RequestObservabilityMiddleware(streaming_app)
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": "/stream",
        "raw_path": b"/stream",
        "query_string": b"",
        "root_path": "",
        "headers": [],
        "client": ("127.0.0.1", 1234),
        "server": ("test", 80),
        "state": {},
    }
    task = asyncio.create_task(middleware(scope, receive, send))
    await response_started.wait()
    assert task.done() is False
    release_body.set()
    await task

    start_message = next(item for item in messages if item["type"] == "http.response.start")
    headers = dict(start_message["headers"])
    assert b"x-request-id" in headers


@pytest.mark.asyncio
async def test_dependency_health_check_has_a_hard_async_deadline(monkeypatch):
    async def never_finishes():
        await asyncio.sleep(1)

    monkeypatch.setattr(settings, "HEALTHCHECK_TIMEOUT_SECONDS", 0.02)
    started_at = time.perf_counter()
    name, healthy = await _bounded_check("slow-provider", never_finishes)

    assert name == "slow-provider"
    assert healthy is False
    assert time.perf_counter() - started_at < 0.2


@pytest.mark.asyncio
async def test_readiness_active_probe_is_single_flight_and_cached(monkeypatch):
    database = AsyncMock(return_value=None)
    storage = AsyncMock(return_value=None)
    monkeypatch.setattr(health_module, "_check_database", database)
    monkeypatch.setattr(health_module, "probe_storage", storage)
    monkeypatch.setattr(settings, "HEALTHCHECK_CACHE_TTL_SECONDS", 60.0)
    health_module.reset_readiness_cache()
    try:
        results = await asyncio.gather(
            *(health_module.readiness_checks() for _ in range(20))
        )
        cached = await health_module.readiness_checks()
    finally:
        health_module.reset_readiness_cache()

    assert all(result == {"database": "ok", "storage": "ok"} for result in results)
    assert cached == {"database": "ok", "storage": "ok"}
    database.assert_awaited_once()
    storage.assert_awaited_once()


def test_raw_uvicorn_access_logger_is_disabled():
    assert logging.getLogger("uvicorn.access").isEnabledFor(logging.INFO) is False


def test_sqlalchemy_exception_text_hides_bound_parameters() -> None:
    assert engine.sync_engine.hide_parameters is True


@pytest.mark.parametrize(
    ("raw_value", "expected"),
    (
        ("/chat/42?token=secret", "/chat/{id}"),
        (
            "GET /api/v1/users/123e4567-e89b-12d3-a456-426614174000/messages#latest",
            "GET /api/v1/users/{id}/messages",
        ),
        (
            "https://api.example.test/events/01ARZ3NDEKTSV4RRFFQ69G5FAV/details",
            "https://api.example.test/events/{id}/details",
        ),
        (
            "https://api.example.test/assets/abcdef0123456789abcdef01/content",
            "https://api.example.test/assets/{id}/content",
        ),
        ("/chat/%34%32/messages", "/chat/{id}/messages"),
        ("/api/v1/chat/{user_id}/messages", "/api/v1/chat/{user_id}/messages"),
        ("/courses/hsk-3/lessons", "/courses/hsk-3/lessons"),
    ),
)
def test_sentry_url_redacts_only_clear_identifier_segments(
    raw_value: str,
    expected: str,
) -> None:
    assert observability._redact_sentry_url(raw_value) == expected


def test_sentry_scrubber_removes_frame_vars_query_auth_and_user_pii():
    event = {
        "request": {
            "url": "https://api.example.test/chat/42?token=url-secret#fragment",
            "query_string": "token=query-secret",
            "headers": [
                ["Authorization", "Bearer auth-secret"],
                ["Cookie", "session=cookie-secret"],
                ["X-Safe-Header", "safe-value"],
                ["X-Request-ID", "123e4567-e89b-12d3-a456-426614174000"],
            ],
            "data": {"password": "body-secret"},
            "cookies": {"session": "request-cookie-secret"},
            "env": {"QUERY_STRING": "env-query-secret"},
        },
        "user": {
            "id": "user-secret",
            "email": "private@example.test",
            "ip_address": "203.0.113.1",
        },
        "exception": {
            "values": [
                {
                    "stacktrace": {
                        "frames": [
                            {
                                "filename": "safe.py",
                                "vars": {"access_token": "frame-secret"},
                                "url": (
                                    "https://api.example.test/users/"
                                    "01ARZ3NDEKTSV4RRFFQ69G5FAV/profile"
                                    "?token=nested-url-secret"
                                ),
                            }
                        ]
                    }
                }
            ]
        },
        "threads": {
            "values": [
                {
                    "stacktrace": {
                        "frames": [{"vars": {"password": "thread-secret"}}]
                    }
                }
            ]
        },
        "contexts": {
            "custom": {
                "refresh_token": "context-secret",
                "safe": "kept",
            }
        },
        "tags": {
            "request_id": "123e4567-e89b-12d3-a456-426614174000",
            "unsafe": "tag-secret",
        },
        "transaction": "GET /api/v1/chat/123e4567-e89b-12d3-a456-426614174000/messages",
        "breadcrumbs": {
            "values": [
                {
                    "data": {
                        "url": "https://provider.example.test/path?key=breadcrumb-secret",
                        "Authorization": "Bearer nested-auth-secret",
                    }
                }
            ]
        },
    }

    scrubbed = observability._scrub_sentry_event(event, {})
    rendered = json.dumps(scrubbed, sort_keys=True)

    assert scrubbed["request"]["url"] == "https://api.example.test/chat/{id}"
    assert scrubbed["request"]["headers"] == [
        ["X-Request-ID", "123e4567-e89b-12d3-a456-426614174000"]
    ]
    assert scrubbed["transaction"] == "GET /api/v1/chat/{id}/messages"
    assert (
        scrubbed["exception"]["values"][0]["stacktrace"]["frames"][0]["url"]
        == "https://api.example.test/users/{id}/profile"
    )
    assert scrubbed["tags"] == {
        "request_id": "123e4567-e89b-12d3-a456-426614174000"
    }
    assert "contexts" not in scrubbed
    assert "breadcrumbs" not in scrubbed
    assert "user" not in scrubbed
    for secret in (
        "url-secret",
        "query-secret",
        "auth-secret",
        "cookie-secret",
        "body-secret",
        "env-query-secret",
        "user-secret",
        "private@example.test",
        "203.0.113.1",
        "frame-secret",
        "thread-secret",
        "context-secret",
        "breadcrumb-secret",
        "nested-auth-secret",
        "nested-url-secret",
        "tag-secret",
        "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "123e4567-e89b-12d3-a456-426614174000/messages",
    ):
        assert secret not in rendered


def test_sentry_never_collects_local_frame_variables(monkeypatch):
    captured: dict = {}

    def fake_init(**kwargs):
        captured.update(kwargs)

    monkeypatch.setattr(settings, "SENTRY_DSN", "https://public@example.ingest.sentry.io/1")
    monkeypatch.setattr(observability.sentry_sdk, "init", fake_init)

    observability.configure_sentry()

    assert captured["include_local_variables"] is False
    assert captured["send_default_pii"] is False
    assert captured["max_request_body_size"] == "never"
    assert captured["before_send"] is observability._scrub_sentry_event
    assert captured["before_send_transaction"] is observability._scrub_sentry_event


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
