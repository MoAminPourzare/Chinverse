from typing import List, Optional
from pydantic import BaseModel, Field

class ContentBase(BaseModel):
    content_type: str
    video_url: Optional[str] = None
    text_content: Optional[str] = None

class ContentCreate(ContentBase):
    pass

class Content(ContentBase):
    id: int
    lesson_id: int

    class Config:
        from_attributes = True

class LessonBase(BaseModel):
    title: str
    duration_minutes: float = 0.0
    is_free: bool = False
    video_url: Optional[str] = None

class LessonCreate(LessonBase):
    section_id: int

class Lesson(LessonBase):
    id: int
    course_id: int
    section_id: int

    class Config:
        from_attributes = True

class CourseSectionBase(BaseModel):
    title: str
    order_index: int = 0

class CourseSectionCreate(CourseSectionBase):
    pass

class CourseSection(CourseSectionBase):
    id: int
    lessons: List[Lesson] = Field(default_factory=list)

    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    title: str
    description: str
    cover_image_url: str
    level: str

class CourseCreate(CourseBase):
    subcategory_id: int

class Course(CourseBase):
    id: int
    subcategory_id: int
    sections: List[CourseSection] = Field(default_factory=list)

    class Config:
        from_attributes = True
