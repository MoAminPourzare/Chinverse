from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import BigInteger, Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.dictionary import DictionaryWord
    from app.models.media import MediaAsset


class PublicationStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class SubtitleQualityStatus(str, Enum):
    PENDING = "pending"
    VALID = "valid"
    INVALID = "invalid"

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
    category_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("categories.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)

    # Relationships
    category: Mapped["Category"] = relationship(back_populates="subcategories")
    courses: Mapped[List["Course"]] = relationship(back_populates="subcategory", cascade="all, delete-orphan")

class Course(Base, TimestampMixin):
    __tablename__ = "courses"
    __table_args__ = (
        Index("ix_courses_public_catalog", "status", "subcategory_id", "id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    subcategory_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("subcategories.id"), nullable=False, index=True)
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
    status: Mapped[PublicationStatus] = mapped_column(
        String,
        nullable=False,
        default=PublicationStatus.DRAFT,
        server_default=text("'draft'"),
    )
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default=text("1"))
    cover_media_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("media_assets.id", ondelete="SET NULL"),
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
    subcategory: Mapped["Subcategory"] = relationship(back_populates="courses")
    sections: Mapped[List["CourseSection"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    saved_by_users: Mapped[List["UserSavedCourse"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    cover_media: Mapped[Optional["MediaAsset"]] = relationship(foreign_keys=[cover_media_id])

    @property
    def subcategory_slug(self) -> Optional[str]:
        subcategory = self.__dict__.get("subcategory")
        return subcategory.slug if subcategory else None


class UserSavedCourse(Base, TimestampMixin):
    __tablename__ = "user_saved_courses"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_saved_courses_user_course"),
        Index("ix_user_saved_courses_user_created", "user_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)

    course: Mapped["Course"] = relationship(back_populates="saved_by_users")

class CourseSection(Base, TimestampMixin):
    __tablename__ = "course_sections"
    __table_args__ = (
        Index("ix_course_sections_course_order", "course_id", "order_index"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("courses.id"), nullable=False, index=True)
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
    __table_args__ = (
        Index("ix_lessons_section_order", "section_id", "id"),
        Index("ix_lessons_public_course", "status", "course_id", "section_id", "id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("courses.id"), nullable=False, index=True)
    section_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("course_sections.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    video_url: Mapped[str] = mapped_column(String, nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    duration_minutes: Mapped[float] = mapped_column(Float, default=0.0)
    media_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("media_assets.id"), nullable=True, index=True)
    poster_media_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("media_assets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_free: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    status: Mapped[PublicationStatus] = mapped_column(
        String,
        nullable=False,
        default=PublicationStatus.DRAFT,
        server_default=text("'draft'"),
    )
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default=text("1"))
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    published_by_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    section: Mapped["CourseSection"] = relationship(back_populates="lessons")
    media: Mapped[Optional["MediaAsset"]] = relationship(foreign_keys=[media_id])
    poster_media: Mapped[Optional["MediaAsset"]] = relationship(foreign_keys=[poster_media_id])
    content: Mapped[List["Content"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")
    subtitles: Mapped[List["LessonSubtitle"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")
    subtitle_tracks: Mapped[List["SubtitleTrack"]] = relationship(
        back_populates="lesson",
        cascade="all, delete-orphan",
    )
    word_maps: Mapped[List["LessonWordMap"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")

class Content(Base, TimestampMixin):
    __tablename__ = "contents"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lessons.id"), nullable=False, index=True)
    content_type: Mapped[str] = mapped_column(String, nullable=False) # video, text
    video_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    text_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    lesson: Mapped["Lesson"] = relationship(back_populates="content")

class LessonSubtitle(Base, TimestampMixin):
    __tablename__ = "lesson_subtitles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lessons.id"), nullable=False, index=True)
    lang_code: Mapped[str] = mapped_column(String, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False) # VTT/SRT content or JSON
    timestamp_start: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp_end: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    lesson: Mapped["Lesson"] = relationship(back_populates="subtitles")


class SubtitleTrack(Base, TimestampMixin):
    __tablename__ = "subtitle_tracks"
    __table_args__ = (
        UniqueConstraint("lesson_id", "language", "revision", name="uq_subtitle_tracks_lesson_language_revision"),
        Index("ix_subtitle_tracks_lesson_status", "lesson_id", "status"),
        Index(
            "uq_subtitle_tracks_one_published_language",
            "lesson_id",
            "language",
            unique=True,
            postgresql_where=text("status = 'published'"),
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    language: Mapped[str] = mapped_column(String(20), nullable=False)
    format: Mapped[str] = mapped_column(String(20), nullable=False, default="json", server_default=text("'json'"))
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default=text("1"))
    supersedes_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("subtitle_tracks.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[PublicationStatus] = mapped_column(
        String,
        nullable=False,
        default=PublicationStatus.DRAFT,
        server_default=text("'draft'"),
    )
    quality_status: Mapped[SubtitleQualityStatus] = mapped_column(
        String,
        nullable=False,
        default=SubtitleQualityStatus.PENDING,
        server_default=text("'pending'"),
    )
    quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quality_report: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    checksum_sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    source_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    published_by_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    lesson: Mapped["Lesson"] = relationship(back_populates="subtitle_tracks")
    cues: Mapped[List["SubtitleCue"]] = relationship(
        back_populates="track",
        cascade="all, delete-orphan",
        order_by="SubtitleCue.cue_index",
    )
    supersedes: Mapped[Optional["SubtitleTrack"]] = relationship(remote_side="SubtitleTrack.id")


class SubtitleCue(Base, TimestampMixin):
    __tablename__ = "subtitle_cues"
    __table_args__ = (
        UniqueConstraint("track_id", "cue_index", name="uq_subtitle_cues_track_index"),
        Index("ix_subtitle_cues_track_time", "track_id", "timestamp_start", "timestamp_end"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    track_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("subtitle_tracks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    cue_index: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp_start: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp_end: Mapped[float] = mapped_column(Float, nullable=False)
    zh_text: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default=text("''"))
    pinyin: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default=text("''"))
    target_text: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default=text("''"))
    highlighted_words: Mapped[List[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default=text("'[]'::jsonb"),
    )

    track: Mapped["SubtitleTrack"] = relationship(back_populates="cues")

class LessonWordMap(Base, TimestampMixin):
    __tablename__ = "lesson_word_maps"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lessons.id"), nullable=False, index=True)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dictionary_words.id"), nullable=False, index=True)
    timestamp: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    lesson: Mapped["Lesson"] = relationship(back_populates="word_maps")
    word: Mapped["DictionaryWord"] = relationship()
