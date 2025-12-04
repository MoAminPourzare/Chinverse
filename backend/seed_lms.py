import asyncio
import sys
import os
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# 1. اضافه کردن مسیر پروژه به پایتون
sys.path.append(os.getcwd())

# 2. ایمپورت‌های پروژه
from app.db.session import SessionLocal
# فرض بر این است که مدل‌های شما در این مسیر هستند
from app.models.course import Course, CourseSection, Lesson, Content, Category, Subcategory

# لینک ویدیوی تستی برای همه درس‌ها
SAMPLE_VIDEO = "https://www.w3schools.com/html/mov_bbb.mp4"

async def get_or_create_category(db: AsyncSession, name: str, slug: str):
    result = await db.execute(select(Category).where(Category.slug == slug))
    category = result.scalars().first()
    if not category:
        print(f"Creating Category: {name}")
        category = Category(name=name, slug=slug)
        db.add(category)
        await db.commit()
        await db.refresh(category)
    return category

async def get_or_create_subcategory(db: AsyncSession, name: str, slug: str, category_id: int):
    result = await db.execute(select(Subcategory).where(
        Subcategory.name == name, 
        Subcategory.category_id == category_id
    ))
    sub = result.scalars().first()
    if not sub:
        print(f"Created Subcategory: {name}")
        # فیلد slug حذف شد تا ارور ندهد
        sub = Subcategory(name=name, category_id=category_id)
        db.add(sub)
        await db.commit()
        await db.refresh(sub)
    return sub

async def seed_lms_data():
    async with SessionLocal() as db:
        print("🌱 Seeding LMS Data...")

        # --- 1. Categories ---
        learning_cat = await get_or_create_category(db, "Chinese Learning", "chinese-learning")
        ent_cat = await get_or_create_category(db, "Chinese Entertainment", "chinese-entertainment")

        # --- 2. Subcategories ---
        subs_learning = {}
        for item in [{"name": "HSK", "slug": "hsk"}, {"name": "Pronunciation", "slug": "pronunciation"}, {"name": "Grammar", "slug": "grammar"}]:
            sub = await get_or_create_subcategory(db, item["name"], item["slug"], learning_cat.id)
            subs_learning[item["slug"]] = sub

        subs_ent = {}
        for item in [{"name": "Movies & Series", "slug": "movies"}, {"name": "Cooking", "slug": "cooking"}, {"name": "Reality Shows", "slug": "reality"}]:
            sub = await get_or_create_subcategory(db, item["name"], item["slug"], ent_cat.id)
            subs_ent[item["slug"]] = sub

        # --- 3. HSK Courses ---
        hsk_courses = [
            {"level": "1", "title": "HSK 1 Standard Course", "desc": "Beginner level covering 150 words."},
            {"level": "2", "title": "HSK 2 Standard Course", "desc": "Elementary level covering 300 words."},
            {"level": "3", "title": "HSK 3 Standard Course", "desc": "Intermediate level covering 600 words."},
            {"level": "4", "title": "HSK 4 Standard Course", "desc": "Intermediate level covering 1200 words."},
            {"level": "5", "title": "HSK 5 Standard Course", "desc": "Advanced level covering 2500 words."},
            {"level": "6", "title": "HSK 6 Standard Course", "desc": "Advanced level covering 5000 words."},
        ]

        for data in hsk_courses:
            res = await db.execute(select(Course).where(Course.title == data["title"]))
            if not res.scalars().first():
                course = Course(
                    subcategory_id=subs_learning["hsk"].id,
                    title=data["title"],
                    description=data["desc"],
                    cover_image_url=f"/static/hsk{data['level']}.jpg",
                    level=data["level"]
                )
                db.add(course)
                await db.commit()
                await db.refresh(course)
                print(f"Created Course: {course.title}")

                section = CourseSection(course_id=course.id, title="Standard Course Lessons", order_index=1)
                db.add(section)
                await db.commit()
                await db.refresh(section)

                for i in range(1, 4):
                    lesson = Lesson(
                        course_id=course.id,
                        section_id=section.id,
                        title=f"Lesson {i}",
                        duration_minutes=45.0,
                        is_free=(i == 1),
                        video_url=SAMPLE_VIDEO  # <--- اصلاح شد: اضافه کردن لینک ویدیو
                    )
                    db.add(lesson)
                    await db.commit()

        # --- 4. Pronunciation ---
        pron_courses = [
            {"title": "Basic Tones Mastery", "desc": "Master the 4 tones."},
            {"title": "Pinyin Complete Guide", "desc": "Learn pinyin system."},
        ]
        for data in pron_courses:
            res = await db.execute(select(Course).where(Course.title == data["title"]))
            if not res.scalars().first():
                course = Course(
                    subcategory_id=subs_learning["pronunciation"].id,
                    title=data["title"],
                    description=data["desc"],
                    cover_image_url="/static/pronunciation.jpg",
                    level="Beginner"
                )
                db.add(course)
                await db.commit()
                await db.refresh(course)
                
                section = CourseSection(course_id=course.id, title="Main", order_index=1)
                db.add(section)
                await db.commit()
                await db.refresh(section)
                
                lesson = Lesson(
                    course_id=course.id, 
                    section_id=section.id, 
                    title="Full Guide", 
                    duration_minutes=20.0, 
                    is_free=True,
                    video_url=SAMPLE_VIDEO # <--- اصلاح شد
                )
                db.add(lesson)
                await db.commit()
                print(f"Created: {course.title}")

        # --- 5. Grammar ---
        gram_courses = [{"title": "Chinese Sentence Structure", "desc": "Word order."}]
        for data in gram_courses:
            res = await db.execute(select(Course).where(Course.title == data["title"]))
            if not res.scalars().first():
                course = Course(
                    subcategory_id=subs_learning["grammar"].id,
                    title=data["title"],
                    description=data["desc"],
                    cover_image_url="/static/grammar.jpg",
                    level="Intermediate"
                )
                db.add(course)
                await db.commit()
                await db.refresh(course)
                
                section = CourseSection(course_id=course.id, title="Main", order_index=1)
                db.add(section)
                await db.commit()
                await db.refresh(section)
                
                lesson = Lesson(
                    course_id=course.id, 
                    section_id=section.id, 
                    title="Lesson 1", 
                    duration_minutes=15.0, 
                    is_free=True,
                    video_url=SAMPLE_VIDEO # <--- اصلاح شد
                )
                db.add(lesson)
                await db.commit()
                print(f"Created: {course.title}")

        # --- 6. Movies ---
        movies = [{"title": "The Untamed", "desc": "Fantasy drama."}]
        for data in movies:
            res = await db.execute(select(Course).where(Course.title == data["title"]))
            if not res.scalars().first():
                course = Course(
                    subcategory_id=subs_ent["movies"].id,
                    title=data["title"],
                    description=data["desc"],
                    cover_image_url="/static/movies.jpg",
                    level="All Levels"
                )
                db.add(course)
                await db.commit()
                await db.refresh(course)
                
                section = CourseSection(course_id=course.id, title="Movie", order_index=1)
                db.add(section)
                await db.commit()
                await db.refresh(section)
                
                lesson = Lesson(
                    course_id=course.id, 
                    section_id=section.id, 
                    title="Full Movie", 
                    duration_minutes=120.0, 
                    is_free=True,
                    video_url=SAMPLE_VIDEO # <--- اصلاح شد
                )
                db.add(lesson)
                await db.commit()
                print(f"Created: {course.title}")

        # --- 7. Cooking ---
        cooking = [{"title": "Mapo Tofu", "desc": "Sichuan dish."}]
        for data in cooking:
            res = await db.execute(select(Course).where(Course.title == data["title"]))
            if not res.scalars().first():
                course = Course(
                    subcategory_id=subs_ent["cooking"].id,
                    title=data["title"],
                    description=data["desc"],
                    cover_image_url="/static/cooking.jpg",
                    level="All Levels"
                )
                db.add(course)
                await db.commit()
                await db.refresh(course)
                
                section = CourseSection(course_id=course.id, title="Recipe", order_index=1)
                db.add(section)
                await db.commit()
                await db.refresh(section)
                
                lesson = Lesson(
                    course_id=course.id, 
                    section_id=section.id, 
                    title="Cooking Process", 
                    duration_minutes=10.0, 
                    is_free=True,
                    video_url=SAMPLE_VIDEO # <--- اصلاح شد
                )
                db.add(lesson)
                await db.commit()
                print(f"Created: {course.title}")

        # --- 8. Reality ---
        reality = [{"title": "Keep Running", "desc": "Variety show."}]
        for data in reality:
            res = await db.execute(select(Course).where(Course.title == data["title"]))
            if not res.scalars().first():
                course = Course(
                    subcategory_id=subs_ent["reality"].id,
                    title=data["title"],
                    description=data["desc"],
                    cover_image_url="/static/reality.jpg",
                    level="All Levels"
                )
                db.add(course)
                await db.commit()
                await db.refresh(course)
                
                section = CourseSection(course_id=course.id, title="Ep 1", order_index=1)
                db.add(section)
                await db.commit()
                await db.refresh(section)
                
                lesson = Lesson(
                    course_id=course.id, 
                    section_id=section.id, 
                    title="Ep 1", 
                    duration_minutes=60.0, 
                    is_free=True,
                    video_url=SAMPLE_VIDEO # <--- اصلاح شد
                )
                db.add(lesson)
                await db.commit()
                print(f"Created: {course.title}")

        print("✅ LMS seeding complete!")

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_lms_data())