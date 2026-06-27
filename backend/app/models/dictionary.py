from typing import Optional, List
from sqlalchemy import String, ForeignKey, Text, BigInteger, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base, TimestampMixin


class DictionaryWord(Base, TimestampMixin):
    __tablename__ = "dictionary_words"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    chinese: Mapped[str] = mapped_column(String, index=True, unique=True, nullable=False)
    pinyin: Mapped[str] = mapped_column(String, index=True, nullable=False)
    audio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    level: Mapped[str] = mapped_column(String, index=True, nullable=False) # HSK1, HSK2, etc.
    hsk_level: Mapped[Optional[int]] = mapped_column(Integer, index=True, nullable=True)
    source: Mapped[str] = mapped_column(String, default="manual", nullable=False)
    source_word_id: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    status: Mapped[str] = mapped_column(String, default="published", nullable=False)
    persian_meaning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    chinese_meaning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    composition: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    definitions: Mapped[List["WordDefinition"]] = relationship(
        back_populates="word",
        cascade="all, delete-orphan",
        order_by="WordDefinition.sense_order, WordDefinition.lang_code, WordDefinition.id",
    )
    collocations: Mapped[List["WordCollocation"]] = relationship(
        back_populates="word",
        cascade="all, delete-orphan",
        order_by="WordCollocation.sense_order, WordCollocation.id",
    )
    examples: Mapped[List["WordExample"]] = relationship(
        back_populates="word",
        cascade="all, delete-orphan",
        order_by="WordExample.sense_order, WordExample.id",
    )


class WordDefinition(Base, TimestampMixin):
    __tablename__ = "word_definitions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dictionary_words.id"), nullable=False, index=True)
    lang_code: Mapped[str] = mapped_column(String, nullable=False)
    definition_text: Mapped[str] = mapped_column(Text, nullable=False)
    part_of_speech: Mapped[str] = mapped_column(String, nullable=False)
    sense_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    word: Mapped["DictionaryWord"] = relationship(back_populates="definitions")

class WordCollocation(Base, TimestampMixin):
    __tablename__ = "word_collocations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dictionary_words.id"), nullable=False, index=True)
    phrase_zh: Mapped[str] = mapped_column(String, nullable=False)
    phrase_pinyin: Mapped[str] = mapped_column(String, nullable=False)
    translation_target: Mapped[str] = mapped_column(String, nullable=False)
    sense_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

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
    sense_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    word: Mapped["DictionaryWord"] = relationship(back_populates="examples")
    media: Mapped[Optional["MediaAsset"]] = relationship()

# Forward reference for MediaAsset
from app.models.media import MediaAsset
