from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin


class UserBlock(Base, TimestampMixin):
    __tablename__ = "user_blocks"
    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_user_blocks_pair"),
        CheckConstraint("blocker_id <> blocked_id", name="ck_user_blocks_not_self"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    blocker_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    blocked_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )


class ContentReport(Base, TimestampMixin):
    __tablename__ = "content_reports"
    __table_args__ = (
        Index("ix_content_reports_status_created", "status", "created_at"),
        Index("ix_content_reports_target", "target_type", "target_id"),
        Index(
            "uq_content_reports_active_report",
            "reporter_id",
            "target_type",
            "target_id",
            unique=True,
            postgresql_where=text("status IN ('open', 'reviewing')"),
        ),
        CheckConstraint(
            "status IN ('open', 'reviewing', 'resolved', 'dismissed')",
            name="ck_content_reports_status",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    reporter_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    target_type: Mapped[str] = mapped_column(String(40), nullable=False)
    target_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    reason: Mapped[str] = mapped_column(String(40), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(24),
        default="open",
        nullable=False,
        index=True,
    )
    assigned_to: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )


class ModerationAction(Base, TimestampMixin):
    __tablename__ = "moderation_actions"
    __table_args__ = (
        Index("ix_moderation_actions_target", "target_type", "target_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    report_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("content_reports.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    moderator_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(40), nullable=False)
    target_type: Mapped[str] = mapped_column(String(40), nullable=False)
    target_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
