from enum import Enum
from typing import Optional, List
from sqlalchemy import String, Boolean, ForeignKey, Text, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base, TimestampMixin
from sqlalchemy.dialects.postgresql import JSON

class UserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"

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
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    platform: Mapped[SocialPlatform] = mapped_column(String, nullable=False)
    handle_or_url: Mapped[str] = mapped_column(String, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="social_links")

class UserGalleryItem(Base, TimestampMixin):
    __tablename__ = "user_gallery_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    caption: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="gallery_items")
