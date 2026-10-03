from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any, Dict, Optional

from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class MediaPublicationStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class MediaLicenseStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class MediaPlaybackType(str, Enum):
    HLS = "hls"
    PROGRESSIVE = "progressive"

class MediaAsset(Base, TimestampMixin):
    __tablename__ = "media_assets"
    __table_args__ = (
        Index("ix_media_assets_status_license", "status", "license_status"),
        Index("ix_media_assets_supersedes_revision", "supersedes_id", "revision"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    media_type: Mapped[MediaType] = mapped_column(String, nullable=False)
    file_url: Mapped[str] = mapped_column(String, nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    storage_provider: Mapped[str] = mapped_column(String, nullable=False, default="local")
    storage_key: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    status: Mapped[MediaPublicationStatus] = mapped_column(
        String,
        nullable=False,
        default=MediaPublicationStatus.DRAFT,
        server_default=text("'draft'"),
    )
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default=text("1"))
    supersedes_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("media_assets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    playback_type: Mapped[MediaPlaybackType] = mapped_column(
        String,
        nullable=False,
        default=MediaPlaybackType.PROGRESSIVE,
        server_default=text("'progressive'"),
    )
    checksum_sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    source_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    rights_holder: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    license_type: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    license_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    license_status: Mapped[MediaLicenseStatus] = mapped_column(
        String,
        nullable=False,
        default=MediaLicenseStatus.PENDING,
        server_default=text("'pending'"),
    )
    license_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    license_reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    license_reviewed_by_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    published_by_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    uploader: Mapped["User"] = relationship(foreign_keys=[user_id])
    license_reviewer: Mapped[Optional["User"]] = relationship(foreign_keys=[license_reviewed_by_id])
    publisher: Mapped[Optional["User"]] = relationship(foreign_keys=[published_by_id])
    supersedes: Mapped[Optional["MediaAsset"]] = relationship(remote_side="MediaAsset.id")


class MediaAccessAuditEvent(Base, TimestampMixin):
    __tablename__ = "media_access_audit_events"
    __table_args__ = (
        Index("ix_media_access_audit_events_media_created", "media_id", "created_at"),
        Index("ix_media_access_audit_events_user_created", "user_id", "created_at"),
        Index("ix_media_access_audit_events_outcome_created", "outcome", "created_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    media_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("media_assets.id", ondelete="SET NULL"),
        nullable=True,
    )
    lesson_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("lessons.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    action: Mapped[str] = mapped_column(String(40), nullable=False)
    outcome: Mapped[str] = mapped_column(String(20), nullable=False)
    reason: Mapped[str] = mapped_column(String(120), nullable=False)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
