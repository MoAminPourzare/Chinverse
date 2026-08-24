from __future__ import annotations

import hashlib
import hmac
from types import SimpleNamespace

import pytest

from fastapi.testclient import TestClient

from app.core.phase8 import (
    evaluate_beta_access,
    generate_invite_code,
    hash_invite_code,
    normalize_invite_code,
    rollout_bucket,
    verify_webhook_signature,
)
from app.services.phase8_beta import sanitize_client_metadata
from app.services.payment_provider import (
    DisabledPaymentProvider,
    GenericHmacPaymentProvider,
    PaymentProviderNotConfigured,
)
from app.services.phase8_beta import accept_payment_webhook
from app.services.phase8_beta import accept_beta_consent
from app.api import deps
from app.core.config import settings
from app.main import app
from app.models.user import User


def test_closed_beta_requires_invite_or_allowlist() -> None:
    assert not evaluate_beta_access(
        enabled=False,
        invite_required=True,
        email="tester@example.com",
        subject=1,
    ).eligible
    assert evaluate_beta_access(
        enabled=True,
        invite_required=True,
        email="tester@example.com",
        subject=1,
        allowlist="tester@example.com",
    ).reason == "allowlist"
    assert not evaluate_beta_access(
        enabled=True,
        invite_required=True,
        email="other@example.com",
        subject=1,
        rollout_percent=100,
    ).eligible
    assert evaluate_beta_access(
        enabled=True,
        invite_required=True,
        email="other@example.com",
        subject=1,
        invite_redeemed=True,
    ).eligible


def test_rollout_is_stable_and_bounded() -> None:
    first = rollout_bucket("user-123")
    assert first == rollout_bucket("user-123")
    assert 0 <= first < 100


def test_invite_code_is_base32_like_and_only_digest_is_persisted() -> None:
    code = generate_invite_code()
    normalized = normalize_invite_code(code)
    assert len(normalized) == 20
    assert all(character in "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" for character in normalized)
    digest = hash_invite_code(code, "s" * 32)
    assert len(digest) == 64
    assert digest != normalized
    assert hash_invite_code("invalid", "s" * 32) == ""


def test_client_metadata_is_allowlisted_and_bounded() -> None:
    result = sanitize_client_metadata(
        {
            "platform": "ios",
            "screen_width": 390,
            "standalone": True,
            "token": "must-not-persist",
            "nested": {"email": "user@example.com"},
            "browser": "x" * 500,
        }
    )
    assert set(result) == {"platform", "screen_width", "standalone", "browser"}
    assert len(result["browser"]) == 120
    assert "token" not in result


def test_webhook_signature_is_constant_time_and_fail_closed() -> None:
    payload = b'{"id":"evt_1"}'
    secret = "p" * 32
    signature = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    assert verify_webhook_signature(payload, signature, secret)
    assert verify_webhook_signature(payload, f"sha256={signature}", secret)
    assert not verify_webhook_signature(payload, signature[:-1], secret)
    assert not verify_webhook_signature(payload, signature, "")


def test_payment_provider_boundary_never_fabricates_checkout() -> None:
    provider = DisabledPaymentProvider()
    assert not provider.verify_webhook(payload=b"{}", signature="anything")
    try:
        import asyncio

        asyncio.run(
            provider.create_checkout(
                order_id=1,
                amount=100,
                currency="IRT",
                return_url="https://example.com/return",
                metadata={},
            )
        )
    except PaymentProviderNotConfigured:
        pass
    else:  # pragma: no cover - defensive assertion
        raise AssertionError("disabled provider returned a checkout session")

    generic = GenericHmacPaymentProvider()
    assert generic.name == "generic_hmac"


def test_beta_status_is_explicitly_closed_when_flag_is_off() -> None:
    previous = settings.FEATURE_BETA_ENABLED
    settings.FEATURE_BETA_ENABLED = False
    user = User(
        id=1,
        email="tester@example.com",
        phone="+989120000000",
        password_hash="not-used",
    )
    app.dependency_overrides[deps.get_current_user] = lambda: user
    app.dependency_overrides[deps.get_db] = lambda: None
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/beta/status")
        assert response.status_code == 200
        assert response.json() == {
            "enabled": False,
            "eligible": False,
            "reason": "disabled",
            "cohort": "none",
            "feedback_enabled": False,
            "consent_required": False,
            "consent_accepted": False,
            "consent_version": "beta-v1",
        }
    finally:
        settings.FEATURE_BETA_ENABLED = previous
        app.dependency_overrides.pop(deps.get_current_user, None)
        app.dependency_overrides.pop(deps.get_db, None)


def test_phase8_beta_paths_are_present_in_openapi() -> None:
    paths = app.openapi()["paths"]
    assert "/api/v1/beta/status" in paths
    assert "/api/v1/beta/invites/redeem" in paths
    assert "/api/v1/beta/consent" in paths
    assert "/api/v1/beta/feedback" in paths
    assert "/api/v1/admin/beta/invites/{invite_id}/revoke" in paths
    assert "/api/v1/admin/beta/feedback/{feedback_id}" in paths


def test_beta_consent_is_fail_closed_when_beta_is_disabled() -> None:
    import asyncio

    from app.core.config import settings
    from fastapi import HTTPException

    user = User(
        id=2,
        email="consent@example.com",
        phone="+989120000001",
        password_hash="not-used",
    )
    request = SimpleNamespace(client=SimpleNamespace(host="127.0.0.1"), headers={})
    previous = settings.FEATURE_BETA_ENABLED
    settings.FEATURE_BETA_ENABLED = False
    try:
        with pytest.raises(HTTPException):
            asyncio.run(
                accept_beta_consent(
                    None,
                    user=user,
                    version="beta-v1",
                    request=request,
                )
            )
    finally:
        settings.FEATURE_BETA_ENABLED = previous


class _WebhookResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class _WebhookDb:
    def __init__(self):
        self.event = None
        self.calls = 0
        self.commits = 0
        self.rollbacks = 0

    async def execute(self, _statement):
        self.calls += 1
        if self.calls == 1:
            from app.models.phase8 import PaymentWebhookEvent

            self.event = PaymentWebhookEvent(
                id=1,
                provider="generic_hmac",
                event_id="evt_1",
                event_type="payment.succeeded",
                payload_hash="a" * 64,
                status="received",
            )
            return _WebhookResult(1)
        return _WebhookResult(None)

    async def scalar(self, _statement):
        return self.event

    def add(self, _value):
        return None

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        self.rollbacks += 1


def test_signed_webhook_delivery_is_idempotent(monkeypatch) -> None:
    import asyncio

    from app.core.config import settings

    payload = b'{"id":"evt_1","type":"payment.succeeded"}'
    signature = hmac.new(b"p" * 32, payload, hashlib.sha256).hexdigest()
    monkeypatch.setattr(settings, "PAYMENT_PROVIDER", "generic_hmac")
    monkeypatch.setattr(settings, "PAYMENT_WEBHOOK_SECRET", "p" * 32)
    request = SimpleNamespace(
        client=SimpleNamespace(host="127.0.0.1"),
        headers={},
    )
    db = _WebhookDb()
    first = asyncio.run(
        accept_payment_webhook(
            db,
            provider="generic_hmac",
            raw_body=payload,
            signature=signature,
            payload={"id": "evt_1", "type": "payment.succeeded"},
            request=request,
        )
    )
    # The fake's hash is deliberately changed to the real value to model the
    # database row that the first delivery would persist.
    db.event.payload_hash = hashlib.sha256(payload).hexdigest()
    second = asyncio.run(
        accept_payment_webhook(
            db,
            provider="generic_hmac",
            raw_body=payload,
            signature=signature,
            payload={"id": "evt_1", "type": "payment.succeeded"},
            request=request,
        )
    )
    assert first["duplicate"] is False
    assert second["duplicate"] is True
    assert db.rollbacks == 1
