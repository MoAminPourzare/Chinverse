from typing import Optional
from datetime import date
from sqlalchemy import String, ForeignKey, Text, BigInteger, Integer, Date, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base, TimestampMixin

class LeitnerCard(Base, TimestampMixin):
    __tablename__ = "leitner_cards"
    __table_args__ = (
        UniqueConstraint("user_id", "word_id", name="uq_leitner_user_word"),
        Index("ix_leitner_cards_user_next_review", "user_id", "next_review_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dictionary_words.id"), nullable=False, index=True)
    box_index: Mapped[int] = mapped_column(Integer, default=1) # 1 to 5
    next_review_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    last_review_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    consecutive_correct_count: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    user: Mapped["User"] = relationship()
    word: Mapped["DictionaryWord"] = relationship()

class StudySession(Base, TimestampMixin):
    __tablename__ = "study_sessions"
    __table_args__ = (
        Index("ix_study_sessions_user_date", "user_id", "date"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    minutes: Mapped[int] = mapped_column(Integer, default=0)
    learned_words_count: Mapped[int] = mapped_column(Integer, default=0)
    date: Mapped[date] = mapped_column(Date, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship()

class UserStreak(Base, TimestampMixin):
    __tablename__ = "user_streaks"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), primary_key=True)
    current_streak_days: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak_days: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    user: Mapped["User"] = relationship()

class CourseReview(Base, TimestampMixin):
    __tablename__ = "course_reviews"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("courses.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False) # 1-5
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    course: Mapped["Course"] = relationship()
    user: Mapped["User"] = relationship()

# Forward references
from app.models.user import User
from app.models.dictionary import DictionaryWord
from app.models.course import Course
