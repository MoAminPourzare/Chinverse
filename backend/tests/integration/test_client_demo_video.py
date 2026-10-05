from copy import deepcopy
from uuid import uuid4
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import select

from app.api.v1.endpoints import media
from app.db.session import SessionLocal
from app.models.course import Category, Course, CourseSection, Lesson, Subcategory, SubtitleCue, SubtitleTrack
from app.models.media import MediaAsset
from app.models.user import User
from scripts.sync_client_demo import install_demo, read_fixture


pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_demo_install_is_atomic_resumable_and_preserves_previous_media(monkeypatch):
    fixture = deepcopy(read_fixture())
    suffix = uuid4().hex
    monkeypatch.setattr(media, "_verify_media_storage_for_publish", AsyncMock())
    async with SessionLocal.begin() as db:
        user = User(email=f"demo-{suffix}@example.com", phone=f"demo-{suffix}",
                    password_hash="isolated-demo-test", role="admin")
        db.add(user)
        await db.flush()
        category = Category(name="Demo", slug=f"demo-{suffix}")
        db.add(category)
        await db.flush()
        subcategory = Subcategory(category_id=category.id, name="Demo", slug=f"demo-sub-{suffix}")
        db.add(subcategory)
        await db.flush()
        original = MediaAsset(user_id=user.id, media_type="video", file_url="/uploads/demo.mp4",
                              storage_key=f"demo/{suffix}/old.mp4", duration_seconds=4,
                              revision=1, status="published", license_status="approved", metadata_json={})
        db.add(original)
        await db.flush()
        course = Course(subcategory_id=subcategory.id, title="Original example", slug=f"old-demo-{suffix}",
                        description="Original", cover_image_url="/uploads/demo.png", level="beginner",
                        status="published", metadata_json={})
        db.add(course)
        await db.flush()
        section = CourseSection(course_id=course.id, title="Example")
        db.add(section)
        await db.flush()
        lesson = Lesson(course_id=course.id, section_id=section.id, title="Old", video_url="",
                        media_id=original.id, is_free=True, status="published", metadata_json={})
        db.add(lesson)
        await db.flush()
        previous = SubtitleTrack(lesson_id=lesson.id, language="fa", revision=1, status="published",
                                 quality_status="valid", source_name="owner-review-leitner-20260928.json",
                                 cues=[SubtitleCue(cue_index=0, timestamp_start=0.5, timestamp_end=2,
                                                   zh_text="你好", pinyin="nǐ hǎo", target_text="سلام")])
        db.add(previous)
        await db.flush()
        fixture.update(course_id=course.id, lesson_id=lesson.id, original_media_id=original.id,
                       original_course_slug=course.slug, course_slug=f"new-demo-{suffix}")
        identifiers = (lesson.id, original.id, previous.id)
        assert await install_demo(db, fixture)
    async with SessionLocal.begin() as db:
        assert not await install_demo(db, fixture)
        lesson = await db.get(Lesson, identifiers[0])
        assert lesson.media_id != identifiers[1]
        assert (await db.get(MediaAsset, identifiers[1])).status == "published"
        assert (await db.get(SubtitleTrack, identifiers[2])).status == "archived"
        active = await db.scalar(select(SubtitleTrack).where(SubtitleTrack.lesson_id == lesson.id,
                                                           SubtitleTrack.status == "published"))
        assert active.checksum_sha256 == fixture["subtitle_checksum_sha256"]
        active.source_name = "later-editorial-change.json"
    async with SessionLocal.begin() as db:
        with pytest.raises(ValueError, match="refusing to overwrite"):
            await install_demo(db, fixture)
