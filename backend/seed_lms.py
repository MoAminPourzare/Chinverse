import asyncio
import os
import re
import sys
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.course import Category, Course, CourseSection, Lesson, Subcategory


SAMPLE_VIDEO = "https://www.w3schools.com/html/mov_bbb.mp4"


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "item"


async def get_or_create_category(db: AsyncSession, name: str, slug: str) -> Category:
    result = await db.execute(select(Category).where(Category.slug == slug))
    category = result.scalars().first()

    if not category:
        category = Category(name=name, slug=slug)
        db.add(category)
        await db.commit()
        await db.refresh(category)
        print(f"Created category: {name}")
    elif category.name != name:
        category.name = name
        await db.commit()
        await db.refresh(category)

    return category


async def get_or_create_subcategory(
    db: AsyncSession,
    *,
    name: str,
    slug: str,
    category_id: int,
) -> Subcategory:
    result = await db.execute(select(Subcategory).where(Subcategory.slug == slug))
    subcategory = result.scalars().first()

    if not subcategory:
        subcategory = Subcategory(name=name, slug=slug, category_id=category_id)
        db.add(subcategory)
        await db.commit()
        await db.refresh(subcategory)
        print(f"Created subcategory: {name}")
    else:
        changed = False
        if subcategory.name != name:
            subcategory.name = name
            changed = True
        if subcategory.category_id != category_id:
            subcategory.category_id = category_id
            changed = True
        if changed:
            await db.commit()
            await db.refresh(subcategory)

    return subcategory


async def get_or_create_course(
    db: AsyncSession,
    *,
    subcategory_id: int,
    title: str,
    description: str,
    cover_image_url: str,
    level: str,
    metadata_json: dict[str, Any] | None = None,
) -> Course:
    slug = slugify(title)
    result = await db.execute(select(Course).where(Course.slug == slug))
    course = result.scalars().first()

    if not course:
        result = await db.execute(select(Course).where(Course.title == title))
        course = result.scalars().first()

    if not course:
        course = Course(
            subcategory_id=subcategory_id,
            title=title,
            slug=slug,
            description=description,
            cover_image_url=cover_image_url,
            level=level,
            metadata_json=metadata_json or {},
        )
        db.add(course)
        await db.commit()
        await db.refresh(course)
        print(f"Created course: {title}")
    else:
        course.subcategory_id = subcategory_id
        course.title = title
        course.slug = slug
        course.description = description
        course.cover_image_url = cover_image_url
        course.level = level
        course.metadata_json = metadata_json or {}
        await db.commit()
        await db.refresh(course)

    return course


async def get_or_create_section(
    db: AsyncSession,
    *,
    course_id: int,
    title: str,
    order_index: int,
) -> CourseSection:
    result = await db.execute(
        select(CourseSection).where(
            CourseSection.course_id == course_id,
            CourseSection.title == title,
        )
    )
    section = result.scalars().first()

    if not section:
        section = CourseSection(course_id=course_id, title=title, order_index=order_index)
        db.add(section)
        await db.commit()
        await db.refresh(section)
    elif section.order_index != order_index:
        section.order_index = order_index
        await db.commit()
        await db.refresh(section)

    return section


async def get_or_create_lesson(
    db: AsyncSession,
    *,
    course_id: int,
    section_id: int,
    title: str,
    duration_minutes: float,
    is_free: bool,
    video_url: str = SAMPLE_VIDEO,
) -> Lesson:
    result = await db.execute(
        select(Lesson).where(
            Lesson.course_id == course_id,
            Lesson.section_id == section_id,
            Lesson.title == title,
        )
    )
    lesson = result.scalars().first()

    if not lesson:
        lesson = Lesson(
            course_id=course_id,
            section_id=section_id,
            title=title,
            duration_minutes=duration_minutes,
            is_free=is_free,
            video_url=video_url,
        )
        db.add(lesson)
        await db.commit()
        await db.refresh(lesson)
    else:
        lesson.duration_minutes = duration_minutes
        lesson.is_free = is_free
        lesson.video_url = video_url
        await db.commit()
        await db.refresh(lesson)

    return lesson


def make_lessons(prefix: str, count: int, duration: float) -> list[dict[str, Any]]:
    return [
        {
            "title": f"{prefix} {index}",
            "duration_minutes": duration,
            "is_free": index == 1,
        }
        for index in range(1, count + 1)
    ]


COURSE_CATALOG: dict[str, list[dict[str, Any]]] = {
    "hsk": [
        {
            "title": f"HSK {level} Standard Course",
            "description": f"Structured HSK {level} course for Persian-speaking learners.",
            "cover_image_url": f"/static/hsk{level}.jpg",
            "level": str(level),
            "metadata_json": {"content_kind": "course", "hsk_level": str(level)},
            "section_title": "Standard Course Lessons",
            "lessons": make_lessons("Lesson", 3, 45.0),
        }
        for level in range(1, 7)
    ],
    "pronunciation": [
        {
            "title": "Grace Mandarin",
            "description": "Chinese pronunciation, tones, and pinyin practice with Grace Mandarin.",
            "cover_image_url": "https://randomuser.me/api/portraits/women/44.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 12},
            "section_title": "Pronunciation Lessons",
            "lessons": make_lessons("Pronunciation Lesson", 3, 20.0),
        },
        {
            "title": "Yoyo Chinese",
            "description": "Pinyin and pronunciation fundamentals for new learners.",
            "cover_image_url": "https://randomuser.me/api/portraits/women/68.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 10},
            "section_title": "Pinyin Lessons",
            "lessons": make_lessons("Pinyin Lesson", 3, 18.0),
        },
        {
            "title": "Yang Yang",
            "description": "Tone drills and sound practice for Mandarin learners.",
            "cover_image_url": "https://randomuser.me/api/portraits/women/32.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 8},
            "section_title": "Tone Lessons",
            "lessons": make_lessons("Tone Lesson", 3, 16.0),
        },
    ],
    "characters": [
        {
            "title": "Mandarin Blueprint",
            "description": "Learn Chinese characters through visual memory and structure.",
            "cover_image_url": "https://randomuser.me/api/portraits/men/32.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 15},
            "section_title": "Character Foundations",
            "lessons": make_lessons("Character Lesson", 3, 22.0),
        },
        {
            "title": "Hanzi Hero",
            "description": "Character building blocks, radicals, and writing logic.",
            "cover_image_url": "https://randomuser.me/api/portraits/men/45.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 12},
            "section_title": "Hanzi Lessons",
            "lessons": make_lessons("Hanzi Lesson", 3, 20.0),
        },
        {
            "title": "Grace Mandarin - Hanzi",
            "description": "Chinese writing and character recognition with Grace Mandarin.",
            "cover_image_url": "https://randomuser.me/api/portraits/women/44.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 10},
            "section_title": "Writing Lessons",
            "lessons": make_lessons("Writing Lesson", 3, 18.0),
        },
    ],
    "grammar": [
        {
            "title": "HSK Grammar",
            "description": "Core grammar patterns for HSK learners.",
            "cover_image_url": "https://randomuser.me/api/portraits/men/52.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 24},
            "section_title": "Grammar Patterns",
            "lessons": make_lessons("Grammar Pattern", 3, 18.0),
        },
        {
            "title": "Chinese Grammar Wiki",
            "description": "Practical Mandarin grammar explanations with examples.",
            "cover_image_url": "https://randomuser.me/api/portraits/women/55.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 36},
            "section_title": "Grammar Lessons",
            "lessons": make_lessons("Grammar Lesson", 3, 18.0),
        },
        {
            "title": "Grammar Patterns A2-B1",
            "description": "Intermediate grammar structures for daily Chinese.",
            "cover_image_url": "https://randomuser.me/api/portraits/men/33.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 18},
            "section_title": "A2-B1 Patterns",
            "lessons": make_lessons("Pattern", 3, 18.0),
        },
    ],
    "idioms": [
        {
            "title": "Everyday Chengyu",
            "description": "Common Chinese idioms used in daily conversation.",
            "cover_image_url": "https://randomuser.me/api/portraits/women/40.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 20},
            "section_title": "Daily Idioms",
            "lessons": make_lessons("Chengyu", 3, 14.0),
        },
        {
            "title": "Historical Idioms",
            "description": "Story-based Chinese idioms and their cultural background.",
            "cover_image_url": "https://randomuser.me/api/portraits/men/45.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 15},
            "section_title": "Historical Stories",
            "lessons": make_lessons("Story", 3, 15.0),
        },
        {
            "title": "HSK Chengyu Collection",
            "description": "Useful chengyu and fixed expressions for HSK learners.",
            "cover_image_url": "https://randomuser.me/api/portraits/women/28.jpg",
            "level": "Advanced",
            "metadata_json": {"content_kind": "course", "lesson_count": 25},
            "section_title": "HSK Chengyu",
            "lessons": make_lessons("HSK Chengyu", 3, 15.0),
        },
    ],
    "culture-texts": [
        {
            "title": "Classical Texts for Learners",
            "description": "Educational classical passages explained in a learner-friendly way.",
            "cover_image_url": "/static/classical-texts-learners.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 16},
            "section_title": "Classical Texts",
            "lessons": make_lessons("Classical Text", 3, 18.0),
        },
    ],
    "historical-stories": [
        {
            "title": "Historical Stories of China",
            "description": "Historical stories and cultural context for Mandarin learners.",
            "cover_image_url": "/static/historical-stories-china.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 14},
            "section_title": "History Stories",
            "lessons": make_lessons("History Story", 3, 18.0),
        },
    ],
    "classical-poetry": [
        {
            "title": "Classical Poetry and Literature",
            "description": "Poetry, prose, and classic literature with simple explanations.",
            "cover_image_url": "/static/classical-poetry-literature.jpg",
            "level": "Advanced",
            "metadata_json": {"content_kind": "course", "lesson_count": 12},
            "section_title": "Poetry Lessons",
            "lessons": make_lessons("Poetry Lesson", 3, 20.0),
        },
    ],
    "festivals-customs": [
        {
            "title": "Festivals and Customs",
            "description": "Chinese rituals, festivals, and cultural traditions in Mandarin.",
            "cover_image_url": "/static/festivals-customs.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 15},
            "section_title": "Festivals",
            "lessons": make_lessons("Festival Lesson", 3, 16.0),
        },
    ],
    "arts-cooking": [
        {
            "title": "Chinese Cooking Studio",
            "description": "Practical cooking lessons with kitchen vocabulary and clear instructions.",
            "cover_image_url": "/static/chinese-cooking-studio.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 18},
            "section_title": "Cooking Lessons",
            "lessons": make_lessons("Cooking Lesson", 3, 15.0),
        },
        {
            "title": "Home Kitchen Mandarin",
            "description": "Learn Mandarin through home-style recipes and daily cooking verbs.",
            "cover_image_url": "/static/home-kitchen-mandarin.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 14},
            "section_title": "Kitchen Lessons",
            "lessons": make_lessons("Kitchen Lesson", 3, 14.0),
        },
        {
            "title": "Street Food Cooking",
            "description": "Fast-paced food preparation content for practical listening practice.",
            "cover_image_url": "/static/street-food-cooking.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 16},
            "section_title": "Street Food Lessons",
            "lessons": make_lessons("Street Food Lesson", 3, 16.0),
        },
    ],
    "martial-arts": [
        {
            "title": "Wushu Basics",
            "description": "Chinese martial arts basics with movement names and training vocabulary.",
            "cover_image_url": "/static/wushu-basics.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 12},
            "section_title": "Basics",
            "lessons": make_lessons("Wushu Lesson", 3, 18.0),
        },
        {
            "title": "Tai Chi Flow",
            "description": "Gentle martial arts and movement practice for learning calm Mandarin.",
            "cover_image_url": "/static/tai-chi-flow.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 10},
            "section_title": "Flow Sessions",
            "lessons": make_lessons("Tai Chi Session", 3, 20.0),
        },
        {
            "title": "Kung Fu Stories",
            "description": "Martial arts storytelling videos with action vocabulary and culture.",
            "cover_image_url": "/static/kung-fu-stories.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 15},
            "section_title": "Stories",
            "lessons": make_lessons("Kung Fu Story", 3, 17.0),
        },
    ],
    "energy-health": [
        {
            "title": "Qi Gong for Beginners",
            "description": "Breathing and energy exercises with simple instruction phrases.",
            "cover_image_url": "/static/qi-gong-beginners.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 12},
            "section_title": "Qi Gong Lessons",
            "lessons": make_lessons("Qi Gong Lesson", 3, 15.0),
        },
        {
            "title": "Healthy Living Mandarin",
            "description": "Health and wellness content for practical everyday vocabulary.",
            "cover_image_url": "/static/healthy-living-mandarin.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 14},
            "section_title": "Wellness Lessons",
            "lessons": make_lessons("Wellness Lesson", 3, 14.0),
        },
        {
            "title": "Breathing and Balance",
            "description": "Longer practice videos for balance, breath, and body awareness.",
            "cover_image_url": "/static/breathing-balance.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 16},
            "section_title": "Balance Lessons",
            "lessons": make_lessons("Balance Lesson", 3, 18.0),
        },
    ],
    "calligraphy": [
        {
            "title": "Calligraphy Basics",
            "description": "Brush strokes, line order, and character structure in Chinese calligraphy.",
            "cover_image_url": "/static/calligraphy-basics.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 12},
            "section_title": "Brush Basics",
            "lessons": make_lessons("Calligraphy Lesson", 3, 16.0),
        },
        {
            "title": "Hanzi Brush Practice",
            "description": "Practice writing Chinese characters with clear hand motion examples.",
            "cover_image_url": "/static/hanzi-brush-practice.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 10},
            "section_title": "Practice Sessions",
            "lessons": make_lessons("Brush Practice", 3, 15.0),
        },
        {
            "title": "Elegant Script",
            "description": "Advanced calligraphy videos focused on style, rhythm, and spacing.",
            "cover_image_url": "/static/elegant-script.jpg",
            "level": "Advanced",
            "metadata_json": {"content_kind": "course", "lesson_count": 15},
            "section_title": "Script Sessions",
            "lessons": make_lessons("Script Lesson", 3, 18.0),
        },
    ],
    "tea-culture": [
        {
            "title": "Tea Ceremony Basics",
            "description": "Tea ceremony language, tools, and presentation in simple Mandarin.",
            "cover_image_url": "/static/tea-ceremony-basics.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 12},
            "section_title": "Tea Basics",
            "lessons": make_lessons("Tea Lesson", 3, 15.0),
        },
        {
            "title": "Chinese Tea Houses",
            "description": "Tea house culture and conversational Mandarin in calm settings.",
            "cover_image_url": "/static/chinese-tea-houses.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 10},
            "section_title": "Tea House Sessions",
            "lessons": make_lessons("Tea House Lesson", 3, 16.0),
        },
        {
            "title": "Tea Culture Stories",
            "description": "Stories and explanations about tea customs, regions, and etiquette.",
            "cover_image_url": "/static/tea-culture-stories.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 14},
            "section_title": "Tea Stories",
            "lessons": make_lessons("Tea Story", 3, 17.0),
        },
    ],
    "practical": [
        {
            "title": "Daily Practical Chinese",
            "description": "Useful Mandarin phrases for everyday situations, errands, and short conversations.",
            "cover_image_url": "/static/practical-chinese.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 18},
            "section_title": "Daily Situations",
            "lessons": make_lessons("Situation", 3, 16.0),
        },
        {
            "title": "Travel Chinese Essentials",
            "description": "Practical Chinese for hotels, transportation, restaurants, and shopping.",
            "cover_image_url": "/static/travel-chinese.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 14},
            "section_title": "Travel Lessons",
            "lessons": make_lessons("Travel Lesson", 3, 17.0),
        },
        {
            "title": "Workplace Chinese",
            "description": "Useful Mandarin for work messages, meetings, and polite professional speech.",
            "cover_image_url": "/static/workplace-chinese.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 16},
            "section_title": "Workplace Lessons",
            "lessons": make_lessons("Workplace Lesson", 3, 19.0),
        },
    ],
    "vlogs": [
        {
            "title": "Daily Vlog Mandarin",
            "description": "Learn natural everyday Chinese through simple daily vlog scenes.",
            "cover_image_url": "/static/daily-vlog-mandarin.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "course", "lesson_count": 12},
            "section_title": "Vlog Scenes",
            "lessons": make_lessons("Vlog Scene", 3, 15.0),
        },
        {
            "title": "Campus Vlog Chinese",
            "description": "Student-life vlog lessons with casual Mandarin expressions.",
            "cover_image_url": "/static/campus-vlog-chinese.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 10},
            "section_title": "Campus Episodes",
            "lessons": make_lessons("Campus Episode", 3, 18.0),
        },
        {
            "title": "City Life Vlogs",
            "description": "Street, food, and city-life Chinese from vlog-style content.",
            "cover_image_url": "/static/city-life-vlogs.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 15},
            "section_title": "City Vlogs",
            "lessons": make_lessons("City Vlog", 3, 18.0),
        },
    ],
    "synonyms": [
        {
            "title": "Common Synonym Pairs",
            "description": "Compare similar Chinese words and learn when each one sounds natural.",
            "cover_image_url": "/static/synonym-pairs.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 20},
            "section_title": "Word Comparisons",
            "lessons": make_lessons("Word Pair", 3, 14.0),
        },
        {
            "title": "HSK Synonym Builder",
            "description": "Build stronger vocabulary by comparing HSK words with close meanings.",
            "cover_image_url": "/static/hsk-synonyms.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "course", "lesson_count": 18},
            "section_title": "HSK Comparisons",
            "lessons": make_lessons("HSK Synonym", 3, 14.0),
        },
        {
            "title": "Advanced Word Nuance",
            "description": "Advanced synonym differences for writing, reading, and formal speech.",
            "cover_image_url": "/static/advanced-word-nuance.jpg",
            "level": "Advanced",
            "metadata_json": {"content_kind": "course", "lesson_count": 16},
            "section_title": "Nuance Lessons",
            "lessons": make_lessons("Nuance Lesson", 3, 16.0),
        },
    ],
    "classical": [
        {
            "title": "Classical Chinese Foundations",
            "description": "Introductory classical Chinese grammar, particles, and short readings.",
            "cover_image_url": "/static/classical-foundations.jpg",
            "level": "Advanced",
            "metadata_json": {"content_kind": "course", "lesson_count": 12},
            "section_title": "Foundations",
            "lessons": make_lessons("Classical Lesson", 3, 20.0),
        },
        {
            "title": "Classical Chinese Stories",
            "description": "Short classical Chinese texts explained through modern Mandarin and Persian-friendly structure.",
            "cover_image_url": "/static/classical-stories.jpg",
            "level": "Advanced",
            "metadata_json": {"content_kind": "course", "lesson_count": 10},
            "section_title": "Short Texts",
            "lessons": make_lessons("Classical Text", 3, 22.0),
        },
        {
            "title": "Classical Idioms and Sources",
            "description": "Learn how classical texts shaped modern Chinese idioms and expressions.",
            "cover_image_url": "/static/classical-idioms.jpg",
            "level": "Advanced",
            "metadata_json": {"content_kind": "course", "lesson_count": 14},
            "section_title": "Classical Sources",
            "lessons": make_lessons("Source Lesson", 3, 18.0),
        },
    ],
    "series": [
        {
            "title": "Reset / Kai Duan",
            "description": "A suspense drama series for listening and vocabulary practice.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Reset_2022_Poster.jpg/220px-Reset_2022_Poster.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "series", "episodes_count": 15, "rating": 4.8, "year": 2022},
            "section_title": "Season 1",
            "lessons": make_lessons("Episode", 3, 45.0),
        },
        {
            "title": "The Untamed / Chen Qing Ling",
            "description": "Fantasy drama episodes for contextual Chinese learning.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/5/52/The_Untamed_web_series_poster.jpg/220px-The_Untamed_web_series_poster.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "series", "episodes_count": 50, "rating": 4.9, "year": 2019},
            "section_title": "Season 1",
            "lessons": make_lessons("Episode", 3, 45.0),
        },
        {
            "title": "Go Ahead / Yi Jia Ren Zhi Ming",
            "description": "Family drama for everyday Mandarin listening practice.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Go_Ahead_TV_series_poster.jpg/220px-Go_Ahead_TV_series_poster.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "series", "episodes_count": 40, "rating": 4.7, "year": 2020},
            "section_title": "Season 1",
            "lessons": make_lessons("Episode", 3, 45.0),
        },
        {
            "title": "Love O2O / Wei Wei Yi Xiao Hen Qing Cheng",
            "description": "Modern romance drama for natural dialogue practice.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/6/66/Love_O2O_poster.jpg/220px-Love_O2O_poster.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "series", "episodes_count": 30, "rating": 4.6, "year": 2016},
            "section_title": "Season 1",
            "lessons": make_lessons("Episode", 3, 45.0),
        },
    ],
    "movies": [
        {
            "title": "Dying to Survive / Wo Bu Shi Yao Shen",
            "description": "Feature film for advanced listening and discussion.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/4/44/Dying_to_Survive_poster.jpg/220px-Dying_to_Survive_poster.jpg",
            "level": "Advanced",
            "metadata_json": {"content_kind": "movie", "episodes_count": 1, "rating": 4.9, "year": 2018},
            "section_title": "Movie Parts",
            "lessons": make_lessons("Part", 3, 35.0),
        },
        {
            "title": "The Wandering Earth / Liu Lang Di Qiu",
            "description": "Science-fiction film for vocabulary and listening practice.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a6/The_Wandering_Earth_poster.png/220px-The_Wandering_Earth_poster.png",
            "level": "Advanced",
            "metadata_json": {"content_kind": "movie", "episodes_count": 1, "rating": 4.5, "year": 2019},
            "section_title": "Movie Parts",
            "lessons": make_lessons("Part", 3, 35.0),
        },
        {
            "title": "Better Days / Shao Nian De Ni",
            "description": "Drama film for emotional dialogue and vocabulary.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/7/74/Better_Days_film_poster.png/220px-Better_Days_film_poster.png",
            "level": "Advanced",
            "metadata_json": {"content_kind": "movie", "episodes_count": 1, "rating": 4.8, "year": 2019},
            "section_title": "Movie Parts",
            "lessons": make_lessons("Part", 3, 35.0),
        },
    ],
    "cartoons": [
        {
            "title": "Ne Zha",
            "description": "Animated film for story-based vocabulary learning.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/Ne_Zha_%282019_film%29_poster.png/220px-Ne_Zha_%282019_film%29_poster.png",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "cartoon", "episodes_count": 1, "rating": 4.8, "year": 2019},
            "section_title": "Movie Parts",
            "lessons": make_lessons("Part", 3, 30.0),
        },
        {
            "title": "White Snake",
            "description": "Animated fantasy for listening and cultural context.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/d/de/White_Snake_%28film%29_poster.jpg/220px-White_Snake_%28film%29_poster.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "cartoon", "episodes_count": 1, "rating": 4.6, "year": 2019},
            "section_title": "Movie Parts",
            "lessons": make_lessons("Part", 3, 30.0),
        },
        {
            "title": "Big Fish & Begonia",
            "description": "Animated feature for poetic vocabulary and listening practice.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Big_Fish_%26_Begonia_poster.jpg/220px-Big_Fish_%26_Begonia_poster.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "cartoon", "episodes_count": 1, "rating": 4.5, "year": 2016},
            "section_title": "Movie Parts",
            "lessons": make_lessons("Part", 3, 30.0),
        },
    ],
    "cooking": [
        {
            "title": "Chef Wang",
            "description": "Chinese cooking videos for practical food vocabulary.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Chinese_cuisine_montage.png/220px-Chinese_cuisine_montage.png",
            "level": "All Levels",
            "metadata_json": {"content_kind": "cooking", "episodes_count": 120, "rating": 4.9, "year": 2017},
            "section_title": "Recipes",
            "lessons": make_lessons("Recipe", 3, 12.0),
        },
        {
            "title": "A Bite of China",
            "description": "Documentary-style cooking and culture videos.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/A_Bite_of_China.jpg/220px-A_Bite_of_China.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "cooking", "episodes_count": 21, "rating": 4.8, "year": 2012},
            "section_title": "Episodes",
            "lessons": make_lessons("Episode", 3, 45.0),
        },
        {
            "title": "Li Ziqi",
            "description": "Calm food and rural life videos for immersive listening.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Chinese_food.jpg/220px-Chinese_food.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "cooking", "episodes_count": 80, "rating": 4.7, "year": 2016},
            "section_title": "Episodes",
            "lessons": make_lessons("Episode", 3, 18.0),
        },
    ],
    "podcasts": [
        {
            "title": "ChinesePod",
            "description": "Podcast episodes for Mandarin listening practice.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Podcast_microphone.jpg/220px-Podcast_microphone.jpg",
            "level": "All Levels",
            "metadata_json": {"content_kind": "podcast", "episodes_count": 50, "rating": 4.8, "year": 2005},
            "section_title": "Episodes",
            "lessons": make_lessons("Episode", 3, 15.0),
        },
        {
            "title": "Mandarin Bean",
            "description": "Short listening practice episodes for Mandarin learners.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/220px-Good_Food_Display_-_NCI_Visuals_Online.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "podcast", "episodes_count": 30, "rating": 4.6, "year": 2018},
            "section_title": "Episodes",
            "lessons": make_lessons("Episode", 3, 12.0),
        },
        {
            "title": "Slow Chinese / Man Su Zhong Wen",
            "description": "Slow Mandarin audio for careful listening practice.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Podcast_microphone.jpg/220px-Podcast_microphone.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "podcast", "episodes_count": 45, "rating": 4.7, "year": 2010},
            "section_title": "Episodes",
            "lessons": make_lessons("Episode", 3, 12.0),
        },
    ],
    "music": [
        {
            "title": "Jay Chou",
            "description": "Songs and lyrics for Chinese listening practice.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Jay_Chou_2019.jpg/220px-Jay_Chou_2019.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "music", "tracks_count": 12, "rating": 4.9, "year": 2000},
            "section_title": "Songs",
            "lessons": make_lessons("Song", 3, 5.0),
        },
        {
            "title": "G.E.M.",
            "description": "Mandarin pop songs for pronunciation and listening practice.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/G.E.M._at_Madame_Tussauds_Hong_Kong.jpg/220px-G.E.M._at_Madame_Tussauds_Hong_Kong.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "music", "tracks_count": 10, "rating": 4.7, "year": 2012},
            "section_title": "Songs",
            "lessons": make_lessons("Song", 3, 5.0),
        },
        {
            "title": "Eason Chan",
            "description": "Mandarin and Cantonese songs for listening exposure.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Eason_Chan_2009.jpg/220px-Eason_Chan_2009.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "music", "tracks_count": 15, "rating": 4.8, "year": 1996},
            "section_title": "Songs",
            "lessons": make_lessons("Song", 3, 5.0),
        },
    ],
    "reality": [
        {
            "title": "Keep Running",
            "description": "Reality show episodes for conversational Chinese listening.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Keep_Running_%28Chinese_TV_series%29.jpg/220px-Keep_Running_%28Chinese_TV_series%29.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "reality", "episodes_count": 72, "rating": 4.5, "year": 2014},
            "section_title": "Episodes",
            "lessons": make_lessons("Episode", 3, 60.0),
        },
        {
            "title": "Go Fighting!",
            "description": "Variety show clips for informal Mandarin and slang.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/0/06/Go_Fighting%21_Season_1.jpg/220px-Go_Fighting%21_Season_1.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "reality", "episodes_count": 60, "rating": 4.6, "year": 2015},
            "section_title": "Episodes",
            "lessons": make_lessons("Episode", 3, 60.0),
        },
        {
            "title": "Day Day Up",
            "description": "Talk and variety show episodes for natural speech.",
            "cover_image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Day_Day_Up.jpg/220px-Day_Day_Up.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "reality", "episodes_count": 200, "rating": 4.4, "year": 2008},
            "section_title": "Episodes",
            "lessons": make_lessons("Episode", 3, 60.0),
        },
    ],
    "topic-talks": [
        {
            "title": "Daily Topic Talks",
            "description": "Short topic-based talks for focused listening and speaking practice.",
            "cover_image_url": "/static/daily-topic-talks.jpg",
            "level": "Beginner",
            "metadata_json": {"content_kind": "talk", "episodes_count": 24, "rating": 4.5},
            "section_title": "Talks",
            "lessons": make_lessons("Topic Talk", 3, 12.0),
        },
        {
            "title": "Culture Topic Talks",
            "description": "Topic-based Chinese talks about culture, habits, food, and daily life.",
            "cover_image_url": "/static/culture-topic-talks.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "talk", "episodes_count": 20, "rating": 4.6},
            "section_title": "Culture Talks",
            "lessons": make_lessons("Culture Talk", 3, 15.0),
        },
        {
            "title": "Opinion Topic Talks",
            "description": "Intermediate talks for learning how to explain opinions in Mandarin.",
            "cover_image_url": "/static/opinion-topic-talks.jpg",
            "level": "Intermediate",
            "metadata_json": {"content_kind": "talk", "episodes_count": 18, "rating": 4.4},
            "section_title": "Opinion Talks",
            "lessons": make_lessons("Opinion Talk", 3, 16.0),
        },
    ],
}


SUBCATEGORIES = {
    "culture_and_thought": [
        {"name": "Educational Classical Texts", "slug": "culture-texts"},
        {"name": "Historical Stories", "slug": "historical-stories"},
        {"name": "Classical Poetry", "slug": "classical-poetry"},
        {"name": "Festivals and Customs", "slug": "festivals-customs"},
    ],
    "art_and_skills": [
        {"name": "Cooking", "slug": "arts-cooking"},
        {"name": "Martial Arts", "slug": "martial-arts"},
        {"name": "Energy & Health", "slug": "energy-health"},
        {"name": "Calligraphy", "slug": "calligraphy"},
        {"name": "Tea Culture", "slug": "tea-culture"},
    ],
    "learning": [
        {"name": "HSK", "slug": "hsk"},
        {"name": "Pronunciation", "slug": "pronunciation"},
        {"name": "Characters", "slug": "characters"},
        {"name": "Grammar", "slug": "grammar"},
        {"name": "Idioms", "slug": "idioms"},
        {"name": "Practical Chinese", "slug": "practical"},
        {"name": "Learning with Vlogs", "slug": "vlogs"},
        {"name": "Synonym Vocabulary", "slug": "synonyms"},
        {"name": "Classical Chinese", "slug": "classical"},
    ],
    "entertainment": [
        {"name": "Series", "slug": "series"},
        {"name": "Movies", "slug": "movies"},
        {"name": "Cartoons & Animation", "slug": "cartoons"},
        {"name": "Cooking", "slug": "cooking"},
        {"name": "Podcasts", "slug": "podcasts"},
        {"name": "Music", "slug": "music"},
        {"name": "Reality Shows", "slug": "reality"},
        {"name": "Topic Talks", "slug": "topic-talks"},
    ],
}


async def seed_lms_data() -> None:
    async with SessionLocal() as db:
        print("Seeding LMS data...")

        learning_category = await get_or_create_category(db, "Chinese Learning", "chinese-learning")
        entertainment_category = await get_or_create_category(
            db,
            "Chinese Entertainment",
            "chinese-entertainment",
        )
        culture_thought_category = await get_or_create_category(
            db,
            "Chinese Culture & Thought",
            "chinese-culture-thought",
        )
        art_skills_category = await get_or_create_category(
            db,
            "Chinese Arts & Skills",
            "chinese-arts-skills",
        )

        subcategories: dict[str, Subcategory] = {}
        for item in SUBCATEGORIES["learning"]:
            subcategories[item["slug"]] = await get_or_create_subcategory(
                db,
                name=item["name"],
                slug=item["slug"],
                category_id=learning_category.id,
            )
        for item in SUBCATEGORIES["entertainment"]:
            subcategories[item["slug"]] = await get_or_create_subcategory(
                db,
                name=item["name"],
                slug=item["slug"],
                category_id=entertainment_category.id,
            )
        for item in SUBCATEGORIES["culture_and_thought"]:
            subcategories[item["slug"]] = await get_or_create_subcategory(
                db,
                name=item["name"],
                slug=item["slug"],
                category_id=culture_thought_category.id,
            )
        for item in SUBCATEGORIES["art_and_skills"]:
            subcategories[item["slug"]] = await get_or_create_subcategory(
                db,
                name=item["name"],
                slug=item["slug"],
                category_id=art_skills_category.id,
            )

        for subcategory_slug, courses in COURSE_CATALOG.items():
            subcategory = subcategories[subcategory_slug]
            for course_data in courses:
                course = await get_or_create_course(
                    db,
                    subcategory_id=subcategory.id,
                    title=course_data["title"],
                    description=course_data["description"],
                    cover_image_url=course_data["cover_image_url"],
                    level=course_data["level"],
                    metadata_json=course_data["metadata_json"],
                )
                section = await get_or_create_section(
                    db,
                    course_id=course.id,
                    title=course_data["section_title"],
                    order_index=1,
                )
                for lesson_data in course_data["lessons"]:
                    await get_or_create_lesson(
                        db,
                        course_id=course.id,
                        section_id=section.id,
                        **lesson_data,
                    )

        print("LMS seeding complete.")


if __name__ == "__main__":
    if os.name == "nt":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_lms_data())
