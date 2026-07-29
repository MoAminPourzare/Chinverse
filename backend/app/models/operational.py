from datetime import date
from typing import Any, Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    desc,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin


class UserNotification(Base, TimestampMixin):
    __tablename__ = "user_notifications"
    __table_args__ = (
        Index("ix_user_notifications_user_created", "user_id", "created_at"),
        Index("ix_user_notifications_user_unread", "user_id", "is_read"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    actor_user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )


class UserReferralCode(Base, TimestampMixin):
    __tablename__ = "user_referral_codes"
    __table_args__ = (
        UniqueConstraint("code"),
        Index("ix_user_referral_codes_code", "code"),
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    code: Mapped[str] = mapped_column(String(32), nullable=False)


class UserReferral(Base, TimestampMixin):
    __tablename__ = "user_referrals"
    __table_args__ = (
        UniqueConstraint(
            "referred_user_id",
            name="uq_user_referrals_referred_user",
        ),
        CheckConstraint(
            "referrer_user_id <> referred_user_id",
            name="ck_user_referrals_not_self",
        ),
        Index(
            "ix_user_referrals_referrer_created",
            "referrer_user_id",
            desc("created_at"),
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    referrer_user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    referred_user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    referral_code: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        server_default=text("'joined'"),
    )
    reward_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        server_default=text("'pending'"),
    )


class SubscriptionOrder(Base, TimestampMixin):
    __tablename__ = "subscription_orders"
    __table_args__ = (
        Index(
            "ix_subscription_orders_user_created",
            "user_id",
            desc("created_at"),
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    plan_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("subscription_plans.id"),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(nullable=False)
    currency: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        server_default=text("'IRT'"),
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        server_default=text("'created'"),
    )
    provider: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    provider_reference: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    checkout_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class UserLessonWatchProgress(Base, TimestampMixin):
    __tablename__ = "user_lesson_watch_progress"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "lesson_id",
            "date",
            name="uq_user_lesson_watch_progress_day",
        ),
        Index(
            "ix_user_lesson_watch_progress_user_date",
            "user_id",
            "date",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    lesson_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    watched_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("0"),
    )
    last_position_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("0"),
    )
    completed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
