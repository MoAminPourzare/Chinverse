from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Date, ForeignKey, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class StudySession(Base, TimestampMixin):
    __tablename__ = "study_sessions"
    __table_args__ = (
        Index("ix_study_sessions_user_date", "user_id", "date"),
        Index("uq_study_sessions_user_date", "user_id", "date", unique=True),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    minutes: Mapped[int] = mapped_column(Integer, default=0)
    learned_words_count: Mapped[int] = mapped_column(Integer, default=0)
    watched_seconds: Mapped[int] = mapped_column(Integer, default=0)
    reviewed_words_count: Mapped[int] = mapped_column(Integer, default=0)
    date: Mapped[date] = mapped_column(Date, nullable=False)

    user: Mapped["User"] = relationship()
