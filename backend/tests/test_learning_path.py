from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.services import daily_activity, learning_path
from app.api.v1.endpoints import daily_activity as activity_api
from app.models.course import Course, Lesson
from app.models.media import MediaAsset
from app.schemas.learning_path import LearningPathResponse


def lesson(id, *, course_id=1, domain="hsk", level=1, section_order=0, lesson_index=None, slug=None):
    return {
        "lesson_id": id, "course_id": course_id, "course_title": "Learning course", "domain": domain,
        "slug": slug or f"hsk-{level}", "title": f"Lesson {id}", "duration_minutes": 2,
        "section_id": section_order + 1, "section_order": section_order,
        "course_metadata": {"hsk_level": level}, "lesson_metadata": {"lesson_index": lesson_index or id},
        "cover_media_id": None,
    }


def test_path_is_sequential_and_does_not_skip_incomplete_steps():
    result = learning_path.build_learning_path([lesson(3), lesson(1), lesson(2)], {1, 3})
    assert [step["lesson_id"] for step in result["steps"]] == [1, 2, 3]
    assert [step["state"] for step in result["steps"]] == ["completed", "current", "locked"]
    assert result["completed_count"] == 1
    assert result["next_lesson_id"] == 2
    LearningPathResponse.model_validate(result)


def test_recommendations_alternate_and_respect_language_level():
    rows = [lesson(1), lesson(2), lesson(10, course_id=2, domain="podcasts"),
            lesson(11, course_id=3, domain="movies", level=5)]
    path = learning_path.build_learning_path(rows, {1})
    assert [(s["lesson_id"], s["kind"]) for s in path["steps"]] == [(1, "lesson"), (10, "explore"), (2, "lesson")]
    assert path["next_lesson_id"] == 10


def test_hsk_course_volumes_and_section_order_are_respected():
    rows = [lesson(2, course_id=10, level=4, slug="hsk-4-xia"),
            lesson(3, course_id=20, level=4, slug="hsk-4-shang", section_order=1),
            lesson(1, course_id=20, level=4, slug="hsk-4-shang")]
    assert [s["lesson_id"] for s in learning_path.build_learning_path(rows, set())["steps"]] == [1, 3, 2]


def test_empty_catalog_and_other_educational_subjects_do_not_invent_lessons():
    assert learning_path.build_learning_path([], set()) == {
        "steps": [], "total_count": 0, "completed_count": 0, "next_lesson_id": None,
    }
    assert learning_path.build_learning_path([lesson(1, domain="movies")], set())["steps"] == []
    result = learning_path.build_learning_path([lesson(1, domain="pronunciation")], {1})
    assert result["completed_count"] == result["total_count"] == 1
    assert result["next_lesson_id"] is None


def test_unlabelled_advanced_courses_do_not_enter_a_beginner_path():
    advanced = lesson(2, domain="movies", course_id=2)
    advanced["course_metadata"] = {}
    advanced["course_level"] = "advanced"
    advanced["slug"] = "advanced-film"
    assert learning_path.build_learning_path([lesson(1), advanced], set())["total_count"] == 1


@pytest.mark.asyncio
async def test_locked_path_cannot_issue_a_playback_url(monkeypatch):
    from app.api.v1.endpoints import media

    access = AsyncMock(side_effect=HTTPException(status_code=409))
    load_media = AsyncMock()
    monkeypatch.setattr(media, "require_learning_path_access", access)
    monkeypatch.setattr(media, "_load_published_lesson_media", load_media)
    with pytest.raises(HTTPException) as locked:
        await media.lesson_playback(2, learning_path=True, db=object(), current_user=SimpleNamespace(id=7))
    assert locked.value.status_code == 409
    load_media.assert_not_awaited()


@pytest.mark.asyncio
async def test_playback_access_is_checked_against_server_progress(monkeypatch):
    path = learning_path.build_learning_path([lesson(1), lesson(2)], set())
    loader = AsyncMock(return_value=path)
    monkeypatch.setattr(learning_path, "get_learning_path", loader)
    db = object()
    await learning_path.require_learning_path_access(db, user_id=7, lesson_id=1)
    with pytest.raises(HTTPException) as locked:
        await learning_path.require_learning_path_access(db, user_id=7, lesson_id=2)
    assert locked.value.status_code == 409
    with pytest.raises(HTTPException) as missing:
        await learning_path.require_learning_path_access(db, user_id=7, lesson_id=999)
    assert missing.value.status_code == 404
    loader.assert_awaited_with(db, user_id=7)


@pytest.mark.parametrize("watched,position,duration,expected", [
    (1, 120, 120, False), (107, 120, 120, False), (108, 108, 120, True),
    (108, 20, 120, False), (120, 120, 0, False), (1, 1, 1, True),
])
def test_seek_to_end_alone_cannot_complete_a_video(watched, position, duration, expected):
    assert daily_activity.video_watch_is_complete(
        watched_seconds=watched, position_seconds=position, duration_seconds=duration,
    ) is expected


@pytest.mark.asyncio
async def test_progress_uses_server_media_duration_and_checks_publication(monkeypatch):
    objects = {
        Lesson: SimpleNamespace(course_id=3, media_id=5, status="published", duration_minutes=2),
        Course: SimpleNamespace(status="published"),
        MediaAsset: SimpleNamespace(status="published", license_status="approved", media_type="video", duration_seconds=120),
    }
    db = SimpleNamespace(get=AsyncMock(side_effect=lambda model, id: objects.get(model)))
    writer = AsyncMock(return_value={"lesson_completed": False})
    monkeypatch.setattr(activity_api, "lesson_entitlement", AsyncMock(return_value=(False, True, "free", 7)))
    monkeypatch.setattr(activity_api, "record_video_watch", writer)
    payload = activity_api.VideoProgressRequest(lesson_id=1, seconds_delta=1, position_seconds=120, duration_seconds=1)
    await activity_api.video_progress(payload, db, SimpleNamespace(id=7))
    assert writer.await_args.kwargs["duration_seconds"] == 120
    objects[Lesson].status = "draft"
    writer.reset_mock()
    with pytest.raises(HTTPException) as missing:
        await activity_api.video_progress(payload, db, SimpleNamespace(id=7))
    assert missing.value.status_code == 404
    writer.assert_not_awaited()


@pytest.mark.asyncio
@pytest.mark.parametrize("media_seconds,study_seconds,expected_study", [(0, None, 0), (20, 10, 10)])
async def test_cumulative_watch_across_days_keeps_real_study_time(monkeypatch, media_seconds, study_seconds, expected_study):
    class DB:
        def __init__(self):
            self.statements = []
            self.commit = AsyncMock()

        async def execute(self, statement, params=None):
            self.statements.append((str(statement), params))
            row = {"watched_seconds": 108, "position_seconds": 120, "completed": False}
            return SimpleNamespace(mappings=lambda: SimpleNamespace(one=lambda: row))

    db = DB()
    increment = AsyncMock()
    monkeypatch.setattr(daily_activity, "_increment_study_session", increment)
    monkeypatch.setattr(daily_activity, "get_today_activity", AsyncMock(return_value={"minutes": 0}))
    monkeypatch.setattr(daily_activity, "refresh_user_streak", AsyncMock())
    result = await daily_activity.record_video_watch(
        db, user_id=7, lesson_id=1, seconds_delta=media_seconds, study_seconds_delta=study_seconds,
        position_seconds=120, duration_seconds=120,
    )
    assert result["lesson_completed"] is True
    assert any("SET completed = true" in sql for sql, _ in db.statements)
    assert all(params["user_id"] == 7 for _, params in db.statements)
    if expected_study:
        assert increment.await_args.kwargs["watched_seconds_delta"] == expected_study
    else:
        increment.assert_not_awaited()
    db.commit.assert_awaited_once()
