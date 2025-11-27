from typing import Optional, List
from sqlalchemy import String, ForeignKey, Text, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base, TimestampMixin

class DictionaryWord(Base, TimestampMixin):
    __tablename__ = "dictionary_words"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    chinese: Mapped[str] = mapped_column(String, index=True, nullable=False)
    pinyin: Mapped[str] = mapped_column(String, index=True, nullable=False)
    audio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    level: Mapped[str] = mapped_column(String, index=True, nullable=False) # HSK1, HSK2, etc.

    # Relationships
    definitions: Mapped[List["WordDefinition"]] = relationship(back_populates="word", cascade="all, delete-orphan")
    collocations: Mapped[List["WordCollocation"]] = relationship(back_populates="word", cascade="all, delete-orphan")
    examples: Mapped[List["WordExample"]] = relationship(back_populates="word", cascade="all, delete-orphan")

class WordDefinition(Base, TimestampMixin):
    __tablename__ = "word_definitions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dictionary_words.id"), nullable=False)
    lang_code: Mapped[str] = mapped_column(String, nullable=False)
    definition_text: Mapped[str] = mapped_column(Text, nullable=False)
    part_of_speech: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    word: Mapped["DictionaryWord"] = relationship(back_populates="definitions")

class WordCollocation(Base, TimestampMixin):
    __tablename__ = "word_collocations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dictionary_words.id"), nullable=False)
    phrase_zh: Mapped[str] = mapped_column(String, nullable=False)
    phrase_pinyin: Mapped[str] = mapped_column(String, nullable=False)
    translation_target: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    word: Mapped["DictionaryWord"] = relationship(back_populates="collocations")

class WordExample(Base, TimestampMixin):
    __tablename__ = "word_examples"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dictionary_words.id"), nullable=False)
    media_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("media_assets.id"), nullable=True)
    zh_text: Mapped[str] = mapped_column(String, nullable=False)
    pinyin: Mapped[str] = mapped_column(String, nullable=False)
    target_text: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    word: Mapped["DictionaryWord"] = relationship(back_populates="examples")
    media: Mapped[Optional["MediaAsset"]] = relationship()

# Forward reference for MediaAsset
from app.models.media import MediaAsset
