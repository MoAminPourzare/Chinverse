from datetime import date
from enum import Enum
from typing import TYPE_CHECKING, List

from sqlalchemy import BigInteger, Boolean, Date, Float, ForeignKey, Index, String, desc
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"


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

    user: Mapped["User"] = relationship()
    plan: Mapped["SubscriptionPlan"] = relationship(back_populates="subscriptions")
