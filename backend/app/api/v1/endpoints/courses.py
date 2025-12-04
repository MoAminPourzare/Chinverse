from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api import deps
from app.models.course import Course, Lesson, Content, Category, Subcategory
from app.schemas import course as schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Course])
def read_courses(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    category_slug: str = None
) -> Any:
    """
    Retrieve courses.
    """
    query = select(Course)
    if category_slug:
        query = query.join(Course.subcategory).join(Subcategory.category).where(Category.slug == category_slug)
    
    courses = db.scalars(query.offset(skip).limit(limit)).all()
    return courses

@router.get("/{id}", response_model=schemas.Course)
def read_course(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get course by ID.
    """
    course = db.get(Course, id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.get("/{id}/lessons", response_model=List[schemas.Lesson])
def read_course_lessons(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get lessons for a course.
    """
    course = db.get(Course, id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Return all lessons from all sections, flattened or structured?
    # For now, let's just return all lessons associated with the course via sections
    # This might need optimization or better structure in the schema
    lessons = []
    for section in course.sections:
        lessons.extend(section.lessons)
    
    # Sort by order if needed, but sections and lessons should be ordered
    return lessons

@router.get("/lessons/{id}", response_model=schemas.Lesson)
def read_lesson(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get lesson by ID.
    """
    lesson = db.get(Lesson, id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson
