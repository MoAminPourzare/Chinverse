from enum import Enum
from typing import Optional
from sqlalchemy import String, Boolean, ForeignKey, Float, Integer, UniqueConstraint, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base, TimestampMixin

class TextDisplayMode(str, Enum):
    FA = "fa"
    ZH = "zh"
    MIXED = "mixed"

class UserPreference(Base, TimestampMixin):
    __tablename__ = "user_preferences"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), primary_key=True)
    content_playback_speed: Mapped[float] = mapped_column(Float, default=1.0)
    text_display_mode: Mapped[TextDisplayMode] = mapped_column(String, default=TextDisplayMode.MIXED)
    highlight_color_new_word: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    highlight_color_leitner: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    show_pinyin: Mapped[bool] = mapped_column(Boolean, default=True)
    autoplay_next: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="preference")

class UserLanguageSetting(Base, TimestampMixin):
    __tablename__ = "user_language_settings"
    __table_args__ = (
        UniqueConstraint("user_id", "lang_code", name="uq_user_lang_code"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    lang_code: Mapped[str] = mapped_column(String, nullable=False)
    font_size_level: Mapped[int] = mapped_column(Integer, default=3) # Assuming 1-5, default middle
    line_spacing_level: Mapped[int] = mapped_column(Integer, default=2) # Assuming 1-4

    # Relationships
    user: Mapped["User"] = relationship(back_populates="language_settings")

# Avoid circular imports by importing User only for type checking if needed, 
# but here we use string forward references in relationship definitions which is fine.
from app.models.user import User
