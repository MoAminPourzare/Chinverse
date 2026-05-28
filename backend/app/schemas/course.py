from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from pydantic import BaseModel, Field, field_validator


def _validate_http_or_relative_url(value: str, *, field_name: str) -> str:
    url = value.strip()
    if not url:
        return url
    if url.startswith("/"):
        return url
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError(f"{field_name} must be a valid http(s) URL")
    return url

class ContentBase(BaseModel):
    content_type: str = Field(min_length=1, max_length=40)
    video_url: Optional[str] = Field(default=None, max_length=1000)
    text_content: Optional[str] = Field(default=None, max_length=50000)

class ContentCreate(ContentBase):
    pass

class Content(ContentBase):
    id: int
    lesson_id: int

    class Config:
        from_attributes = True


class SubcategorySummary(BaseModel):
    id: int
    name: str
    slug: str
    category_id: int

    class Config:
        from_attributes = True


class CategorySummary(BaseModel):
    id: int
    name: str
    slug: str
    icon_url: Optional[str] = None
    subcategories: List[SubcategorySummary] = Field(default_factory=list)

    class Config:
        from_attributes = True

class LessonBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    duration_minutes: float = Field(default=0.0, ge=0, le=1000)
    is_free: bool = False
    video_url: Optional[str] = Field(default=None, max_length=1000)
    thumbnail_url: Optional[str] = Field(default=None, max_length=1000)
    media_id: Optional[int] = Field(default=None, ge=0)
    metadata_json: Dict[str, Any] = Field(default_factory=dict)

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
    pass

class Lesson(LessonBase):
    id: int
    course_id: int
    section_id: int

    class Config:
        from_attributes = True

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

    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    slug: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1, max_length=8000)
    cover_image_url: str = Field(min_length=1, max_length=1000)
    level: str = Field(min_length=1, max_length=80)
    metadata_json: Dict[str, Any] = Field(default_factory=dict)

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
    def validate_cover_image_url(cls, value: str) -> str:
        return _validate_http_or_relative_url(value, field_name="Cover image URL")

class CourseCreate(CourseBase):
    subcategory_id: int = Field(gt=0)


class CourseSummary(CourseBase):
    id: int
    subcategory_id: int
    subcategory_slug: Optional[str] = None

    class Config:
        from_attributes = True


class Course(CourseBase):
    id: int
    subcategory_id: int
    subcategory_slug: Optional[str] = None
    sections: List[CourseSection] = Field(default_factory=list)
    likes_count: int = 0

    class Config:
        from_attributes = True


class SavedCourseState(BaseModel):
    saved: bool
