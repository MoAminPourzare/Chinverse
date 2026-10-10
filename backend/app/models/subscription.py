from datetime import date, datetime
from enum import Enum
from typing import TYPE_CHECKING, List

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    desc,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    REFUNDED = "refunded"
    CHARGEBACK = "chargeback"


class SubscriptionPlan(Base, TimestampMixin):
    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    duration_months: Mapped[int] = mapped_column(BigInteger, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    subscriptions: Mapped[List["UserSubscription"]] = relationship(back_populates="plan")


class UserSubscription(Base, TimestampMixin):
    __tablename__ = "user_subscriptions"
    __table_args__ = (
        Index(
            "ix_user_subscriptions_user_status_end",
            "user_id",
            "status",
            desc("end_date"),
        ),
        UniqueConstraint("source_order_id", name="uq_user_subscriptions_source_order"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    plan_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("subscription_plans.id"),
        nullable=False,
        index=True,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(
        String,
        default=SubscriptionStatus.ACTIVE,
    )
    source_order_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("subscription_orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revocation_reason: Mapped[str | None] = mapped_column(String(80), nullable=True)

    user: Mapped["User"] = relationship()
    plan: Mapped["SubscriptionPlan"] = relationship(back_populates="subscriptions")
