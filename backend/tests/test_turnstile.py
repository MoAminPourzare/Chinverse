import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.services import turnstile


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class FakeAsyncClient:
    def __init__(self, payload):
        self.payload = payload

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None

    async def post(self, *_args, **_kwargs):
        return FakeResponse(self.payload)


@pytest.mark.asyncio
async def test_turnstile_is_noop_when_disabled(monkeypatch):
    monkeypatch.setattr(settings, "TURNSTILE_ENABLED", False)
    await turnstile.verify_turnstile(
        token=None,
        remote_ip="127.0.0.1",
        expected_action="login",
    )


@pytest.mark.asyncio
async def test_turnstile_requires_token_and_expected_action(monkeypatch):
    monkeypatch.setattr(settings, "TURNSTILE_ENABLED", True)
    monkeypatch.setattr(settings, "TURNSTILE_SECRET_KEY", "test-secret")

    with pytest.raises(HTTPException) as missing:
        await turnstile.verify_turnstile(
            token=None,
            remote_ip="127.0.0.1",
            expected_action="login",
        )
    assert missing.value.status_code == 403

    monkeypatch.setattr(
        turnstile.httpx,
        "AsyncClient",
        lambda **_kwargs: FakeAsyncClient({"success": True, "action": "signup"}),
    )
    with pytest.raises(HTTPException) as wrong_action:
        await turnstile.verify_turnstile(
            token="valid-provider-token",
            remote_ip="127.0.0.1",
            expected_action="login",
        )
    assert wrong_action.value.status_code == 403

    monkeypatch.setattr(
        turnstile.httpx,
        "AsyncClient",
        lambda **_kwargs: FakeAsyncClient({"success": True}),
    )
    with pytest.raises(HTTPException) as missing_action:
        await turnstile.verify_turnstile(
            token="token-without-bound-action",
            remote_ip="127.0.0.1",
            expected_action="login",
        )
    assert missing_action.value.status_code == 403

    monkeypatch.setattr(
        turnstile.httpx,
        "AsyncClient",
        lambda **_kwargs: FakeAsyncClient({"success": True, "action": "login"}),
    )
    await turnstile.verify_turnstile(
        token="valid-provider-token",
        remote_ip="127.0.0.1",
        expected_action="login",
    )


@pytest.mark.asyncio
async def test_turnstile_binds_token_to_configured_hostname(monkeypatch):
    monkeypatch.setattr(settings, "TURNSTILE_ENABLED", True)
    monkeypatch.setattr(settings, "TURNSTILE_SECRET_KEY", "test-secret")
    monkeypatch.setattr(settings, "TURNSTILE_EXPECTED_HOSTNAMES", "chinverse.example")
    monkeypatch.setattr(
        turnstile.httpx,
        "AsyncClient",
        lambda **_kwargs: FakeAsyncClient(
            {"success": True, "action": "login", "hostname": "evil.example"}
        ),
    )

    with pytest.raises(HTTPException) as wrong_hostname:
        await turnstile.verify_turnstile(
            token="valid-provider-token",
            remote_ip="127.0.0.1",
            expected_action="login",
        )
    assert wrong_hostname.value.status_code == 403

    monkeypatch.setattr(
        turnstile.httpx,
        "AsyncClient",
        lambda **_kwargs: FakeAsyncClient(
            {"success": True, "action": "login", "hostname": "chinverse.example"}
        ),
    )
    await turnstile.verify_turnstile(
        token="valid-provider-token",
        remote_ip="127.0.0.1",
        expected_action="login",
    )


@pytest.mark.asyncio
async def test_turnstile_rejects_oversized_tokens_before_provider_call(monkeypatch):
    monkeypatch.setattr(settings, "TURNSTILE_ENABLED", True)
    monkeypatch.setattr(settings, "TURNSTILE_SECRET_KEY", "test-secret")
    with pytest.raises(HTTPException) as oversized:
        await turnstile.verify_turnstile(
            token="x" * 2049,
            remote_ip="127.0.0.1",
            expected_action="login",
        )
    assert oversized.value.status_code == 403
