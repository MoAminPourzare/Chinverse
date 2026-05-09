from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, ForeignKey, DateTime, Integer, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base_class import Base, TimestampMixin

class UserFlashcard(Base, TimestampMixin):
    __tablename__ = "user_flashcards"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dictionary_words.id"), nullable=False, index=True)
    
    box_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    next_review_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)
    last_reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="flashcards")
    word: Mapped["DictionaryWord"] = relationship("DictionaryWord")

    # Constraint to ensure one flashcard per word per user
    __table_args__ = (
        UniqueConstraint('user_id', 'word_id', name='uq_user_word_flashcard'),
        Index("ix_user_flashcards_user_next_review", "user_id", "next_review_at"),
        Index("ix_user_flashcards_user_box", "user_id", "box_number"),
    )

# Forward references
from app.models.user import User
from app.models.dictionary import DictionaryWord
