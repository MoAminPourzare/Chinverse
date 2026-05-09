from enum import Enum
from typing import Optional, List
from datetime import date
from sqlalchemy import String, ForeignKey, Text, BigInteger, Boolean, Float, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base, TimestampMixin

class ConsultationStatus(str, Enum):
    OPEN = "open"
    PENDING_PAYMENT = "pending_payment"
    CLOSED = "closed"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"

class Service(Base, TimestampMixin):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    provider_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    base_price: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    provider: Mapped["User"] = relationship()
    requests: Mapped[List["ConsultationRequest"]] = relationship(back_populates="service", cascade="all, delete-orphan")

class ConsultationRequest(Base, TimestampMixin):
    __tablename__ = "consultation_requests"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    service_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("services.id"), nullable=False, index=True)
    requester_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[ConsultationStatus] = mapped_column(String, default=ConsultationStatus.OPEN)
    initial_message: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    service: Mapped["Service"] = relationship(back_populates="requests")
    requester: Mapped["User"] = relationship()

class SubscriptionPlan(Base, TimestampMixin):
    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    duration_months: Mapped[int] = mapped_column(BigInteger, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    subscriptions: Mapped[List["UserSubscription"]] = relationship(back_populates="plan")

class UserSubscription(Base, TimestampMixin):
    __tablename__ = "user_subscriptions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    plan_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("subscription_plans.id"), nullable=False, index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(String, default=SubscriptionStatus.ACTIVE)

    # Relationships
    user: Mapped["User"] = relationship()
    plan: Mapped["SubscriptionPlan"] = relationship(back_populates="subscriptions")

# Forward references
from app.models.user import User
