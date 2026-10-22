from __future__ import annotations

import hashlib
import hmac
import json
from uuid import uuid4

import pytest
from sqlalchemy import func, select
from starlette.requests import Request

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.phase8 import BetaFeedback, BetaInvite, PaymentWebhookEvent
from app.models.security import LegalAcceptance
from app.models.user import User
from app.services.phase8_beta import (
    accept_beta_consent,
    accept_payment_webhook,
    beta_consent_accepted,
    issue_beta_invite,
    redeem_beta_invite,
    revoke_beta_invite,
    submit_beta_feedback,
)


pytestmark = pytest.mark.integration


def _request(path: str) -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "scheme": "http",
            "path": path,
            "headers": [(b"user-agent", b"chinverse-phase1-integration")],
            "client": ("127.0.0.1", 43100),
            "server": ("test", 80),
        }
    )


async def _create_user(label: str) -> User:
    suffix = uuid4().hex[:16]
    async with SessionLocal() as session:
        user = User(
            email=f"phase1-beta-{label}-{suffix}@example.test",
            phone=f"09{uuid4().int % 10**9:09d}",
            password_hash="phase1-integration-password-hash",
            is_verified=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest.mark.asyncio
async def test_beta_invite_consent_and_feedback_persist_on_real_database(monkeypatch):
    monkeypatch.setattr(settings, "FEATURE_BETA_ENABLED", True)
    monkeypatch.setattr(settings, "BETA_INVITE_REQUIRED", True)
    monkeypatch.setattr(settings, "BETA_INVITE_HASH_SECRET", "i" * 48)
    monkeypatch.setattr(settings, "BETA_CONSENT_VERSION", "beta-v1")
    monkeypatch.setattr(settings, "BETA_ALLOWED_EMAILS", "")
    monkeypatch.setattr(settings, "BETA_ROLLOUT_PERCENT", 0)
    monkeypatch.setattr(settings, "RELEASE_SHA", "phase1-integration")

    issuer = await _create_user("issuer")
    tester = await _create_user("tester")
    request = _request("/api/v1/admin/beta/invites")

    async with SessionLocal() as session:
        invite, raw_code = await issue_beta_invite(
            session,
            email=tester.email,
            issued_by_user_id=issuer.id,
            request=request,
            ttl_days=7,
        )
        invite_id = int(invite.id)
        assert raw_code not in invite.code_hash
        assert len(invite.code_hash) == 64

    async with SessionLocal() as session:
        current_tester = await session.get(User, tester.id)
        assert current_tester is not None
        decision = await redeem_beta_invite(
            session,
            code=raw_code,
            user=current_tester,
            request=_request("/api/v1/beta/invites/redeem"),
        )
        assert decision.enabled is True
        assert decision.eligible is True

    async with SessionLocal() as session:
        current_tester = await session.get(User, tester.id)
        assert current_tester is not None
        assert await beta_consent_accepted(session, current_tester) is False
        assert await accept_beta_consent(
            session,
            user=current_tester,
            version="beta-v1",
            request=_request("/api/v1/beta/consent"),
        ) is True
        # The unique document/version boundary makes a retry idempotent.
        assert await accept_beta_consent(
            session,
            user=current_tester,
            version="beta-v1",
            request=_request("/api/v1/beta/consent"),
        ) is True

    async with SessionLocal() as session:
        current_tester = await session.get(User, tester.id)
        assert current_tester is not None
        feedback = await submit_beta_feedback(
            session,
            user=current_tester,
            request=_request("/api/v1/beta/feedback"),
            kind="bug",
            message="The lesson player lost its position after reconnecting.",
            rating=4,
            steps_to_reproduce="Open lesson, disconnect, reconnect, and resume.",
            route="/watch/mandarin/intro",
            client_metadata={
                "platform": "web",
                "browser": "Chromium",
                "screen_width": 5000,
                "secret": "must-be-dropped",
            },
        )
        assert feedback.status == "open"
        assert feedback.release_sha == "phase1-integration"
        assert feedback.client_metadata == {
            "platform": "web",
            "browser": "Chromium",
            "screen_width": 5000,
        }

    async with SessionLocal() as session:
        stored_invite = await session.get(BetaInvite, invite_id)
        assert stored_invite is not None
        assert stored_invite.status == "redeemed"
        assert stored_invite.redeemed_by_user_id == tester.id
        assert await session.scalar(
            select(func.count(LegalAcceptance.id)).where(
                LegalAcceptance.user_id == tester.id,
                LegalAcceptance.document_type == "beta",
                LegalAcceptance.document_version == "beta-v1",
            )
        ) == 1
        stored_feedback = await session.scalar(
            select(BetaFeedback).where(BetaFeedback.id == feedback.id)
        )
        assert stored_feedback is not None
        assert stored_feedback.user_id == tester.id

    # A separate issued invite can be revoked and cannot be reused.
    async with SessionLocal() as session:
        revoked_invite, revoked_code = await issue_beta_invite(
            session,
            email=tester.email,
            issued_by_user_id=issuer.id,
            request=request,
            ttl_days=7,
        )
        revoked = await revoke_beta_invite(
            session,
            invite_id=revoked_invite.id,
            revoked_by_user_id=issuer.id,
            request=_request("/api/v1/admin/beta/invites/revoke"),
        )
        assert revoked.status == "revoked"
        assert revoked_code != raw_code


@pytest.mark.asyncio
async def test_payment_webhook_is_database_idempotent_on_real_database(monkeypatch):
    secret = "p" * 48
    monkeypatch.setattr(settings, "PAYMENT_PROVIDER", "generic_hmac")
    monkeypatch.setattr(settings, "PAYMENT_WEBHOOK_SECRET", secret)

    payload = {"id": f"phase1-event-{uuid4().hex}", "type": "payment.succeeded"}
    raw_body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    async with SessionLocal() as session:
        first = await accept_payment_webhook(
            session,
            provider="generic_hmac",
            raw_body=raw_body,
            signature=signature,
            payload=payload,
            request=_request("/api/v1/payments/webhook"),
        )
    async with SessionLocal() as session:
        second = await accept_payment_webhook(
            session,
            provider="generic_hmac",
            raw_body=raw_body,
            signature=signature,
            payload=payload,
            request=_request("/api/v1/payments/webhook"),
        )

    assert first == {
        "accepted": True,
        "duplicate": False,
        "event_id": payload["id"],
        "status": "received",
    }
    assert second == {
        "accepted": True,
        "duplicate": True,
        "event_id": payload["id"],
        "status": "received",
    }

    async with SessionLocal() as session:
        events = (
            await session.execute(
                select(PaymentWebhookEvent).where(
                    PaymentWebhookEvent.event_id == payload["id"]
                )
            )
        ).scalars().all()
        assert len(events) == 1
        assert events[0].payload_hash == hashlib.sha256(raw_body).hexdigest()
