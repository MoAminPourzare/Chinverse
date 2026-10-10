from __future__ import annotations

from datetime import UTC, datetime, timedelta
import hashlib
import hmac
import json
from uuid import uuid4

from fastapi import HTTPException
import pytest
from sqlalchemy import select
from starlette.requests import Request

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.operational import SubscriptionOrder
from app.models.phase8 import PaymentLedgerEntry, PaymentWebhookEvent
from app.models.subscription import SubscriptionPlan, SubscriptionStatus, UserSubscription
from app.models.user import User
from app.services.payments import accept_payment_webhook, reconcile_payment_ledger


pytestmark = pytest.mark.integration


def _request() -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "scheme": "https",
            "path": "/api/v1/subscriptions/webhook/generic_hmac",
            "headers": [(b"user-agent", b"chinverse-phase6-integration")],
            "client": ("127.0.0.1", 43100),
            "server": ("test", 443),
        }
    )


def _signed_event(secret: str, payload: dict[str, object]) -> tuple[bytes, str, str]:
    raw_body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    timestamp = str(int(datetime.now(UTC).timestamp()))
    signed = timestamp.encode() + b"." + raw_body
    signature = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return raw_body, timestamp, signature


async def _create_user_and_order(*, label: str, provider_reference: str) -> tuple[int, int]:
    async with SessionLocal() as session:
        plan = await session.get(SubscriptionPlan, 1003)
        assert plan is not None
        user = User(
            email=f"phase6-{label}-{uuid4().hex[:12]}@example.test",
            phone=f"09{uuid4().int % 10**9:09d}",
            password_hash="phase6-integration-password-hash",
            is_verified=True,
        )
        session.add(user)
        await session.flush()
        order = SubscriptionOrder(
            user_id=user.id,
            plan_id=plan.id,
            amount=plan.price,
            currency="IRT",
            status="pending",
            provider="generic_hmac",
            provider_reference=provider_reference,
        )
        session.add(order)
        await session.commit()
        return int(user.id), int(order.id)


async def _deliver(
    *,
    secret: str,
    event_type: str,
    order_id: int,
    amount: int,
    reference: str,
    event_id: str | None = None,
) -> tuple[dict[str, object], dict[str, object]]:
    payload: dict[str, object] = {
        "id": event_id or f"evt-{uuid4().hex}",
        "type": event_type,
        "order_id": order_id,
        "amount": amount,
        "currency": "IRT",
        "provider_reference": reference,
    }
    raw_body, timestamp, signature = _signed_event(secret, payload)
    async with SessionLocal() as session:
        result = await accept_payment_webhook(
            session,
            provider="generic_hmac",
            raw_body=raw_body,
            signature=signature,
            timestamp=timestamp,
            payload=payload,
            request=_request(),
        )
    return payload, result


@pytest.mark.asyncio
async def test_payment_success_renewal_refund_chargeback_and_reconciliation(monkeypatch):
    secret = "p" * 48
    monkeypatch.setattr(settings, "PAYMENT_PROVIDER", "generic_hmac")
    monkeypatch.setattr(settings, "PAYMENT_WEBHOOK_SECRET", secret)
    monkeypatch.setattr(settings, "PAYMENT_WEBHOOK_TOLERANCE_SECONDS", 300)

    first_reference = f"ref-{uuid4().hex}"
    user_id, first_order_id = await _create_user_and_order(
        label="first",
        provider_reference=first_reference,
    )
    first_payload, first = await _deliver(
        secret=secret,
        event_type="payment.succeeded",
        order_id=first_order_id,
        amount=240_000,
        reference=first_reference,
    )
    assert first["accepted"] is True
    assert first["entitlement_action"] == "grant"

    raw_body, timestamp, signature = _signed_event(secret, first_payload)
    async with SessionLocal() as session:
        duplicate = await accept_payment_webhook(
            session,
            provider="generic_hmac",
            raw_body=raw_body,
            signature=signature,
            timestamp=timestamp,
            payload=first_payload,
            request=_request(),
        )
    assert duplicate == {
        "accepted": True,
        "duplicate": True,
        "event_id": first_payload["id"],
        "status": "processed",
    }

    second_reference = f"ref-{uuid4().hex}"
    async with SessionLocal() as session:
        plan = await session.get(SubscriptionPlan, 1003)
        assert plan is not None
        second_order = SubscriptionOrder(
            user_id=user_id,
            plan_id=plan.id,
            amount=plan.price,
            currency="IRT",
            status="pending",
            provider="generic_hmac",
            provider_reference=second_reference,
        )
        session.add(second_order)
        await session.commit()
        second_order_id = int(second_order.id)

    _, second = await _deliver(
        secret=secret,
        event_type="payment.succeeded",
        order_id=second_order_id,
        amount=240_000,
        reference=second_reference,
    )
    assert second["entitlement_action"] == "renew"

    async with SessionLocal() as session:
        subscriptions = (
            await session.execute(
                select(UserSubscription)
                .where(UserSubscription.user_id == user_id)
                .order_by(UserSubscription.start_date)
            )
        ).scalars().all()
        assert len(subscriptions) == 2
        assert subscriptions[0].status == SubscriptionStatus.ACTIVE
        assert subscriptions[1].start_date == subscriptions[0].end_date + timedelta(days=1)

    _, refund = await _deliver(
        secret=secret,
        event_type="payment.refunded",
        order_id=second_order_id,
        amount=240_000,
        reference=second_reference,
    )
    assert refund["entitlement_action"] == "refunded"

    _, chargeback = await _deliver(
        secret=secret,
        event_type="payment.chargeback",
        order_id=first_order_id,
        amount=240_000,
        reference=first_reference,
    )
    assert chargeback["entitlement_action"] == "chargeback"

    async with SessionLocal() as session:
        first_subscription = await session.scalar(
            select(UserSubscription).where(
                UserSubscription.source_order_id == first_order_id
            )
        )
        second_subscription = await session.scalar(
            select(UserSubscription).where(
                UserSubscription.source_order_id == second_order_id
            )
        )
        assert first_subscription is not None
        assert second_subscription is not None
        assert first_subscription.status == SubscriptionStatus.CHARGEBACK
        assert second_subscription.status == SubscriptionStatus.REFUNDED
        assert first_subscription.revoked_at is not None
        assert second_subscription.revoked_at is not None
        ledger = (
            await session.execute(
                select(PaymentLedgerEntry).where(PaymentLedgerEntry.user_id == user_id)
            )
        ).scalars().all()
        assert [entry.action for entry in ledger] == [
            "grant",
            "renew",
            "refund",
            "chargeback",
        ]
        assert (await reconcile_payment_ledger(session))["healthy"] is True


@pytest.mark.asyncio
async def test_payment_rejects_stale_signature_and_amount_mismatch(monkeypatch):
    secret = "s" * 48
    monkeypatch.setattr(settings, "PAYMENT_PROVIDER", "generic_hmac")
    monkeypatch.setattr(settings, "PAYMENT_WEBHOOK_SECRET", secret)
    monkeypatch.setattr(settings, "PAYMENT_WEBHOOK_TOLERANCE_SECONDS", 30)

    reference = f"ref-{uuid4().hex}"
    _, order_id = await _create_user_and_order(
        label="reject",
        provider_reference=reference,
    )
    payload = {
        "id": f"evt-{uuid4().hex}",
        "type": "payment.succeeded",
        "order_id": order_id,
        "amount": 240_001,
        "currency": "IRT",
        "provider_reference": reference,
    }
    raw_body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    stale_timestamp = str(int((datetime.now(UTC) - timedelta(minutes=5)).timestamp()))
    stale_signature = hmac.new(
        secret.encode(),
        stale_timestamp.encode() + b"." + raw_body,
        hashlib.sha256,
    ).hexdigest()
    async with SessionLocal() as session:
        with pytest.raises(HTTPException, match="timestamp"):
            await accept_payment_webhook(
                session,
                provider="generic_hmac",
                raw_body=raw_body,
                signature=stale_signature,
                timestamp=stale_timestamp,
                payload=payload,
                request=_request(),
            )

    current_timestamp = str(int(datetime.now(UTC).timestamp()))
    current_signature = hmac.new(
        secret.encode(),
        current_timestamp.encode() + b"." + raw_body,
        hashlib.sha256,
    ).hexdigest()
    async with SessionLocal() as session:
        with pytest.raises(HTTPException, match="amount or currency"):
            await accept_payment_webhook(
                session,
                provider="generic_hmac",
                raw_body=raw_body,
                signature=current_signature,
                timestamp=current_timestamp,
                payload=payload,
                request=_request(),
            )

    async with SessionLocal() as session:
        event = await session.scalar(
            select(PaymentWebhookEvent).where(
                PaymentWebhookEvent.event_id == payload["id"]
            )
        )
        assert event is not None
        assert event.status == "rejected"
        assert event.error_code == "amount_currency_mismatch"
        assert await session.scalar(
            select(UserSubscription.id).where(UserSubscription.source_order_id == order_id)
        ) is None
