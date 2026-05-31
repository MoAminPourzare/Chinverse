from enum import Enum
from typing import Any, Dict, Optional, List
from sqlalchemy import String, ForeignKey, Text, BigInteger
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base, TimestampMixin


class DictionaryDraftStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    FAILED = "failed"


class DictionaryWord(Base, TimestampMixin):
    __tablename__ = "dictionary_words"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    chinese: Mapped[str] = mapped_column(String, index=True, nullable=False)
    pinyin: Mapped[str] = mapped_column(String, index=True, nullable=False)
    audio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    level: Mapped[str] = mapped_column(String, index=True, nullable=False) # HSK1, HSK2, etc.
    persian_meaning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    chinese_meaning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    composition: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    definitions: Mapped[List["WordDefinition"]] = relationship(back_populates="word", cascade="all, delete-orphan")
    collocations: Mapped[List["WordCollocation"]] = relationship(back_populates="word", cascade="all, delete-orphan")
    examples: Mapped[List["WordExample"]] = relationship(back_populates="word", cascade="all, delete-orphan")


class DictionaryAiDraft(Base, TimestampMixin):
    __tablename__ = "dictionary_ai_drafts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    batch_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    source_word: Mapped[str] = mapped_column(String, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String, default=DictionaryDraftStatus.PENDING.value, index=True)
    model: Mapped[str] = mapped_column(String, nullable=False)
    prompt_context: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_json: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    raw_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by_user_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=True, index=True)


class WordDefinition(Base, TimestampMixin):
    __tablename__ = "word_definitions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dictionary_words.id"), nullable=False, index=True)
    lang_code: Mapped[str] = mapped_column(String, nullable=False)
    definition_text: Mapped[str] = mapped_column(Text, nullable=False)
    part_of_speech: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    word: Mapped["DictionaryWord"] = relationship(back_populates="definitions")

class WordCollocation(Base, TimestampMixin):
    __tablename__ = "word_collocations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dictionary_words.id"), nullable=False, index=True)
    phrase_zh: Mapped[str] = mapped_column(String, nullable=False)
    phrase_pinyin: Mapped[str] = mapped_column(String, nullable=False)
    translation_target: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    word: Mapped["DictionaryWord"] = relationship(back_populates="collocations")

class WordExample(Base, TimestampMixin):
    __tablename__ = "word_examples"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dictionary_words.id"), nullable=False, index=True)
    media_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("media_assets.id"), nullable=True, index=True)
    zh_text: Mapped[str] = mapped_column(String, nullable=False)
    pinyin: Mapped[str] = mapped_column(String, nullable=False)
    target_text: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    word: Mapped["DictionaryWord"] = relationship(back_populates="examples")
    media: Mapped[Optional["MediaAsset"]] = relationship()

# Forward reference for MediaAsset
from app.models.media import MediaAsset
