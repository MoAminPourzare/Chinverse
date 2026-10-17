from datetime import datetime
from pathlib import PurePosixPath
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def _validate_http_or_relative_url(value: str, *, field_name: str) -> str:
    url = value.strip()
    if not url:
        return url
    parsed = urlparse(url)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return url
    if parsed.scheme or parsed.netloc or url.startswith("//"):
        raise ValueError(f"{field_name} must be a valid http(s) or internal URL")

    path = parsed.path
    if not path or "\\" in path or ".." in PurePosixPath(path).parts:
        raise ValueError(f"{field_name} must be a safe internal URL")

    # Older admin fixtures store the canonical private locator as
    # ``uploads/...``.  API responses use an absolute-path reference so
    # Pydantic serialization does not turn a successful insert into a 500.
    return url if url.startswith("/") else f"/{url}"

class ContentBase(BaseModel):
    content_type: str = Field(min_length=1, max_length=40)
    video_url: Optional[str] = Field(default=None, max_length=1000)
    text_content: Optional[str] = Field(default=None, max_length=50000)

class ContentCreate(ContentBase):
    pass

class Content(ContentBase):
    id: int
    lesson_id: int

    model_config = ConfigDict(from_attributes=True)


class SubcategorySummary(BaseModel):
    id: int
    name: str
    slug: str
    category_id: int

    model_config = ConfigDict(from_attributes=True)


class CategorySummary(BaseModel):
    id: int
    name: str
    slug: str
    icon_url: Optional[str] = None
    subcategories: List[SubcategorySummary] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class LessonBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    duration_minutes: float = Field(default=0.0, ge=0, le=1000)
    is_free: bool = False
    video_url: Optional[str] = Field(default=None, max_length=1000)
    thumbnail_url: Optional[str] = Field(default=None, max_length=1000)
    media_id: Optional[int] = Field(default=None, ge=0)
    poster_media_id: Optional[int] = Field(default=None, ge=0)
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    status: str = "draft"
    revision: int = 1
    published_at: Optional[datetime] = None

    @field_validator("title", mode="before")
    @classmethod
    def strip_lesson_title(cls, value: str) -> str:
        return value.strip()

    @field_validator("video_url", "thumbnail_url", mode="before")
    @classmethod
    def validate_optional_media_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        url = value.strip()
        if not url:
            return None
        return _validate_http_or_relative_url(url, field_name="Media URL")

class LessonCreate(LessonBase):
    @model_validator(mode="after")
    def require_media_reference(self):
        if not self.media_id:
            raise ValueError("A lesson requires a registered media_id")
        return self

class Lesson(LessonBase):
    id: int
    course_id: int
    section_id: int

    model_config = ConfigDict(from_attributes=True)


class PublicLesson(BaseModel):
    id: int
    course_id: int
    section_id: int
    title: str
    duration_minutes: float = 0.0
    media_id: Optional[int] = None
    is_free: bool = False
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    status: str = "published"
    revision: int = 1
    published_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CourseSectionBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    order_index: int = Field(default=0, ge=0)
    metadata_json: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("title", mode="before")
    @classmethod
    def strip_section_title(cls, value: str) -> str:
        return value.strip()

class CourseSectionCreate(CourseSectionBase):
    pass

class CourseSection(CourseSectionBase):
    id: int
    lessons: List[Lesson] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class PublicCourseSection(CourseSectionBase):
    id: int
    lessons: List[PublicLesson] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class CourseBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    slug: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1, max_length=8000)
    cover_image_url: Optional[str] = Field(default=None, max_length=1000)
    level: str = Field(min_length=1, max_length=80)
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    status: str = "draft"
    revision: int = 1
    cover_media_id: Optional[int] = None
    published_at: Optional[datetime] = None

    @field_validator("title", "description", "level", mode="before")
    @classmethod
    def strip_course_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("slug", mode="before")
    @classmethod
    def validate_slug(cls, value: str) -> str:
        slug = value.strip().lower()
        import re

        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            raise ValueError("Slug must contain lowercase English letters, numbers and dashes only")
        return slug

    @field_validator("cover_image_url", mode="before")
    @classmethod
    def validate_cover_image_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return _validate_http_or_relative_url(value, field_name="Cover image URL")

class CourseCreate(CourseBase):
    subcategory_id: int = Field(gt=0)

    @model_validator(mode="after")
    def require_registered_cover(self):
        if not self.cover_media_id:
            raise ValueError("A course requires a licensed cover_media_id")
        return self


class CourseSummary(CourseBase):
    id: int
    subcategory_id: int
    subcategory_slug: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class Course(CourseBase):
    id: int
    subcategory_id: int
    subcategory_slug: Optional[str] = None
    sections: List[CourseSection] = Field(default_factory=list)
    likes_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class PublicCourse(BaseModel):
    id: int
    subcategory_id: int
    subcategory_slug: Optional[str] = None
    title: str
    slug: str
    description: str
    level: str
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    status: str = "published"
    revision: int = 1
    cover_media_id: Optional[int] = None
    cover_url: Optional[str] = None
    # Backwards-compatible field name; value is an app-signed URL, never the
    # legacy provider URL stored on courses.cover_image_url.
    cover_image_url: Optional[str] = None
    published_at: Optional[datetime] = None
    sections: List[PublicCourseSection] = Field(default_factory=list)
    likes_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class SavedCourseState(BaseModel):
    saved: bool
