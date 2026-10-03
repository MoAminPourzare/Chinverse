from enum import Enum
from typing import TYPE_CHECKING, Optional, List
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base, TimestampMixin
from sqlalchemy.dialects.postgresql import JSON

if TYPE_CHECKING:
    from app.models.leitner import UserFlashcard
    from app.models.service import UserService
    from app.models.settings import UserLanguageSetting, UserPreference

class UserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class UserRole(str, Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"


class SocialPlatform(str, Enum):
    INSTAGRAM = "instagram"
    TELEGRAM = "telegram"
    LINKEDIN = "linkedin"
    WECHAT = "wechat"
    WHATSAPP = "whatsapp"
    X = "x"

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[UserStatus] = mapped_column(String, default=UserStatus.ACTIVE)
    role: Mapped[UserRole] = mapped_column(
        String(20),
        default=UserRole.USER,
        nullable=False,
        index=True,
    )
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    phone_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    password_changed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    failed_login_attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    locked_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    mfa_secret_ciphertext: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mfa_pending_secret_ciphertext: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    mfa_last_used_step: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    # Relationships
    profile: Mapped["UserProfile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    social_links: Mapped[List["UserSocialLink"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    preference: Mapped["UserPreference"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    language_settings: Mapped[List["UserLanguageSetting"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    gallery_items: Mapped[List["UserGalleryItem"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    services: Mapped[List["UserService"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    flashcards: Mapped[List["UserFlashcard"]] = relationship("UserFlashcard", back_populates="user", cascade="all, delete-orphan")

class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), primary_key=True)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    headline: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    about_me: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    profile_truth_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    website_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    websites: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    socials: Mapped[Optional[list[dict]]] = mapped_column(JSON, nullable=True)
    resume: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="profile")


class UserSocialLink(Base, TimestampMixin):
    __tablename__ = "user_social_links"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    platform: Mapped[SocialPlatform] = mapped_column(String, nullable=False)
    handle_or_url: Mapped[str] = mapped_column(String, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="social_links")

class UserGalleryItem(Base, TimestampMixin):
    __tablename__ = "user_gallery_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    caption: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="gallery_items")
