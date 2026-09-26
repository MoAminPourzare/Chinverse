"""Provider boundary for Phase 8 payments.

This module intentionally contains no Stripe/Zarinpal SDK and performs no
network calls.  A commercial adapter must implement this protocol, pass the
same signature/idempotency tests, and be enabled explicitly through secrets.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping, Protocol

from app.core.config import settings
from app.core.phase8 import verify_webhook_signature


class PaymentProviderNotConfigured(RuntimeError):
    """Raised when checkout is requested before a reviewed adapter is installed."""


@dataclass(frozen=True)
class CheckoutSession:
    provider: str
    provider_reference: str
    checkout_url: str
    expires_at: str | None = None


class PaymentProvider(Protocol):
    name: str

    async def create_checkout(
        self,
        *,
        order_id: int,
        amount: int,
        currency: str,
        return_url: str,
        metadata: Mapping[str, Any],
    ) -> CheckoutSession:
        ...

    def verify_webhook(self, *, payload: bytes, signature: str | None) -> bool:
        ...


class DisabledPaymentProvider:
    name = "disabled"

    async def create_checkout(self, **_: Any) -> CheckoutSession:
        raise PaymentProviderNotConfigured("No payment provider is configured")

    def verify_webhook(self, *, payload: bytes, signature: str | None) -> bool:
        return False


class GenericHmacPaymentProvider:
    """Signature/idempotency test adapter; it does not create real checkouts."""

    name = "generic_hmac"

    async def create_checkout(self, **_: Any) -> CheckoutSession:
        raise PaymentProviderNotConfigured(
            "generic_hmac verifies callbacks only; install a reviewed checkout adapter"
        )

    def verify_webhook(self, *, payload: bytes, signature: str | None) -> bool:
        return verify_webhook_signature(
            payload, signature, settings.PAYMENT_WEBHOOK_SECRET
        )


def get_payment_provider() -> PaymentProvider:
    if settings.PAYMENT_PROVIDER == "generic_hmac":
        return GenericHmacPaymentProvider()
    return DisabledPaymentProvider()
