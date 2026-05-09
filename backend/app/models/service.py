from typing import Optional
from sqlalchemy import String, ForeignKey, Text, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base, TimestampMixin


class UserService(Base, TimestampMixin):
    """User's offered services (teaching, translation, consulting, etc.)"""
    __tablename__ = "user_services"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    banner_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    price_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., "توافقی" or "۵۰۰,۰۰۰ تومان"

    # Relationships
    user: Mapped["User"] = relationship(back_populates="services")


# Add to User model: services relationship
# services: Mapped[List["UserService"]] = relationship(back_populates="user", cascade="all, delete-orphan")
