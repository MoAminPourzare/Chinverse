from typing import Any, Dict, List, Optional
from sqlalchemy import String, ForeignKey, Text, Float, Boolean, Integer, BigInteger, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base, TimestampMixin

class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    icon_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationships
    subcategories: Mapped[List["Subcategory"]] = relationship(back_populates="category", cascade="all, delete-orphan")

class Subcategory(Base, TimestampMixin):
    __tablename__ = "subcategories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("categories.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)

    # Relationships
    category: Mapped["Category"] = relationship(back_populates="subcategories")
    courses: Mapped[List["Course"]] = relationship(back_populates="subcategory", cascade="all, delete-orphan")

class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    subcategory_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("subcategories.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    cover_image_url: Mapped[str] = mapped_column(String, nullable=False)
    level: Mapped[str] = mapped_column(String, nullable=False) # beginner, intermediate, advanced
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    # Relationships
    subcategory: Mapped["Subcategory"] = relationship(back_populates="courses")
    sections: Mapped[List["CourseSection"]] = relationship(back_populates="course", cascade="all, delete-orphan")

class CourseSection(Base, TimestampMixin):
    __tablename__ = "course_sections"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("courses.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="sections")
    lessons: Mapped[List["Lesson"]] = relationship(back_populates="section", cascade="all, delete-orphan")

class Lesson(Base, TimestampMixin):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("courses.id"), nullable=False)
    section_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("course_sections.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    video_url: Mapped[str] = mapped_column(String, nullable=False)
    duration_minutes: Mapped[float] = mapped_column(Float, default=0.0)
    is_free: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    # Relationships
    section: Mapped["CourseSection"] = relationship(back_populates="lessons")
    content: Mapped[List["Content"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")
    subtitles: Mapped[List["LessonSubtitle"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")
    word_maps: Mapped[List["LessonWordMap"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")

class Content(Base, TimestampMixin):
    __tablename__ = "contents"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lessons.id"), nullable=False)
    content_type: Mapped[str] = mapped_column(String, nullable=False) # video, text
    video_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    lesson: Mapped["Lesson"] = relationship(back_populates="content")

class LessonSubtitle(Base, TimestampMixin):
    __tablename__ = "lesson_subtitles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lessons.id"), nullable=False)
    lang_code: Mapped[str] = mapped_column(String, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False) # VTT/SRT content or JSON
    timestamp_start: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp_end: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    lesson: Mapped["Lesson"] = relationship(back_populates="subtitles")

class LessonWordMap(Base, TimestampMixin):
    __tablename__ = "lesson_word_maps"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lessons.id"), nullable=False)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dictionary_words.id"), nullable=False)
    timestamp: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    lesson: Mapped["Lesson"] = relationship(back_populates="word_maps")
    word: Mapped["DictionaryWord"] = relationship()

# Forward reference for DictionaryWord
from app.models.dictionary import DictionaryWord
