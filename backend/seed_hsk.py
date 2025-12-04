import logging
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.course import Course, CourseSection, Lesson, Content, Category, Subcategory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_hsk_data(db: Session):
    # 1. Create Category "Chinese Learning"
    category = db.query(Category).filter(Category.slug == "chinese-learning").first()
    if not category:
        category = Category(name="Chinese Learning", slug="chinese-learning")
        db.add(category)
        db.commit()
        db.refresh(category)
        logger.info("Created Category: Chinese Learning")

    # 2. Create Subcategory "HSK"
    subcategory = db.query(Subcategory).filter(Subcategory.name == "HSK", Subcategory.category_id == category.id).first()
    if not subcategory:
        subcategory = Subcategory(name="HSK", category_id=category.id)
        db.add(subcategory)
        db.commit()
        db.refresh(subcategory)
        logger.info("Created Subcategory: HSK")

    # 3. Create Courses (HSK 1-6)
    hsk_courses = [
        {"level": "1", "title": "HSK 1 Standard Course", "desc": "Beginner level course covering 150 words.", "color": "yellow"},
        {"level": "2", "title": "HSK 2 Standard Course", "desc": "Elementary level course covering 300 words.", "color": "teal"},
        {"level": "3", "title": "HSK 3 Standard Course", "desc": "Intermediate level course covering 600 words.", "color": "orange"},
        {"level": "4", "title": "HSK 4 Standard Course", "desc": "Intermediate level course covering 1200 words.", "color": "red"},
        {"level": "5", "title": "HSK 5 Standard Course", "desc": "Advanced level course covering 2500 words.", "color": "blue"},
        {"level": "6", "title": "HSK 6 Standard Course", "desc": "Advanced level course covering 5000 words.", "color": "purple"},
    ]

    for course_data in hsk_courses:
        course = db.query(Course).filter(Course.title == course_data["title"]).first()
        if not course:
            course = Course(
                subcategory_id=subcategory.id,
                title=course_data["title"],
                description=course_data["desc"],
                cover_image_url=f"/static/hsk{course_data['level']}.jpg", # Placeholder
                level=course_data["level"]
            )
            db.add(course)
            db.commit()
            db.refresh(course)
            logger.info(f"Created Course: {course.title}")

            # 4. Create Sections and Lessons for each course
            section = CourseSection(course_id=course.id, title="Standard Course Lessons", order_index=1)
            db.add(section)
            db.commit()
            db.refresh(section)

            for i in range(1, 16): # 15 lessons per course
                lesson = Lesson(
                    course_id=course.id,
                    section_id=section.id,
                    title=f"Lesson {i}",
                    duration_minutes=45.0,
                    is_free=(i == 1) # First lesson is free
                )
                db.add(lesson)
                db.commit()
                db.refresh(lesson)

                # 5. Create Content (Video)
                content = Content(
                    lesson_id=lesson.id,
                    content_type="video",
                    video_url="https://www.w3schools.com/html/mov_bbb.mp4", # Dummy video
                    text_content=f"Transcript for Lesson {i}..."
                )
                db.add(content)
                db.commit()
                logger.info(f"  Created Lesson {i} for {course.title}")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_hsk_data(db)
    finally:
        db.close()
