"""Persistence models for the closed beta and payment webhook boundary."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin


class BetaInvite(Base, TimestampMixin):
    """An invitation whose raw code is never persisted."""

    __tablename__ = "beta_invites"
    __table_args__ = (
        UniqueConstraint("code_hash", name="uq_beta_invites_code_hash"),
        Index("ix_beta_invites_email_status", "email_hash", "status"),
        Index("ix_beta_invites_expires_status", "expires_at", "status"),
        CheckConstraint(
            "status IN ('issued', 'redeemed', 'revoked', 'expired')",
            name="ck_beta_invites_status",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    # A normalized email digest binds an invite without retaining another copy
    # of a user's PII in the beta table.
    email_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=text("'issued'")
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    redeemed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    redeemed_by_user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    issued_by_user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class BetaFeedback(Base, TimestampMixin):
    """Structured beta feedback with bounded, non-secret client metadata."""

    __tablename__ = "beta_feedback"
    __table_args__ = (
        Index("ix_beta_feedback_status_created", "status", "created_at"),
        Index("ix_beta_feedback_user_created", "user_id", "created_at"),
        Index("ix_beta_feedback_release_created", "release_sha", "created_at"),
        CheckConstraint(
            "rating IS NULL OR (rating >= 1 AND rating <= 5)",
            name="ck_beta_feedback_rating",
        ),
        CheckConstraint(
            "status IN ('open', 'triaged', 'resolved', 'dismissed')",
            name="ck_beta_feedback_status",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    steps_to_reproduce: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    route: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    release_sha: Mapped[str] = mapped_column(String(64), nullable=False)
    client_metadata: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=text("'open'")
    )
    triage_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by_user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class PaymentWebhookEvent(Base, TimestampMixin):
    """Idempotency ledger for a verified payment provider callback."""

    __tablename__ = "payment_webhook_events"
    __table_args__ = (
        UniqueConstraint("provider", "event_id", name="uq_payment_webhook_provider_event"),
        Index("ix_payment_webhook_events_order_created", "order_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    event_id: Mapped[str] = mapped_column(String(255), nullable=False)
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    order_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("subscription_orders.id", ondelete="SET NULL"), nullable=True
    )
    payload_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default=text("'received'"))
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
