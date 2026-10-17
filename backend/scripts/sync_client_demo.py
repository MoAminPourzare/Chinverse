"""Install the owner-requested example ONLY on the pinned existing staging DB."""
import asyncio
import json
import logging
from pathlib import Path

from sqlalchemy import func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import database_url_matches_neon_endpoint, settings
from app.db.session import SessionLocal
from app.models.course import Course, Lesson, SubtitleCue, SubtitleTrack
from app.models.media import MediaAsset
from app.services.media_workflow import (
    apply_subtitle_validation, assess_subtitle_cues, subtitle_checksum,
    utc_now, validate_media_asset, validate_subtitle_track,
)


FIXTURE_PATH = Path(__file__).resolve().parents[1] / "data/fixtures/client_demo_first_video.json"
STAGING_ENDPOINT = "ep-wild-band-atse2yoq"
logger = logging.getLogger(__name__)


def demo_target_allowed(tier: str, database_url: str) -> bool:
    return tier == "staging" and database_url_matches_neon_endpoint(database_url, STAGING_ENDPOINT)


def read_fixture(path: Path = FIXTURE_PATH) -> dict:
    fixture = json.loads(path.read_text("utf-8"))
    if (fixture["course_id"], fixture["lesson_id"], fixture["original_media_id"]) != (70, 206, 4) or len(fixture["cues"]) != 120:
        raise ValueError("Unexpected client demo target or subtitle count")
    if subtitle_checksum(fixture["cues"]) != fixture["subtitle_checksum_sha256"]:
        raise ValueError("Client demo subtitle checksum mismatch")
    quality = assess_subtitle_cues(fixture["cues"], duration_seconds=fixture["media"]["duration_seconds"])
    if not quality.valid:
        raise ValueError("Client demo subtitles failed timing validation")
    return fixture


async def install_demo(db: AsyncSession, fixture: dict) -> bool:
    from app.api.v1.endpoints.media import _verify_media_storage_for_publish

    await db.execute(text("SELECT pg_advisory_xact_lock(741025321)"))
    course = await db.get(Course, fixture["course_id"])
    lesson = await db.get(Lesson, fixture["lesson_id"])
    if not course or not lesson or lesson.course_id != course.id or not lesson.is_free:
        raise ValueError("The original free owner-review lesson is missing")
    original = await db.get(MediaAsset, lesson.media_id)
    source = fixture["source_name"]
    current = await db.scalar(select(SubtitleTrack).where(
        SubtitleTrack.lesson_id == lesson.id, SubtitleTrack.language == "fa",
        SubtitleTrack.status == "published",
    ).options(selectinload(SubtitleTrack.cues)))
    if (
        lesson.metadata_json.get("client_demo_source") == source
        and original and original.metadata_json.get("client_demo_source") == source
        and original.checksum_sha256 == fixture["media"]["checksum_sha256"]
        and current and current.source_name == source
        and current.checksum_sha256 == fixture["subtitle_checksum_sha256"]
        and len(current.cues) == len(fixture["cues"])
    ):
        return False
    if (
        course.slug != fixture["original_course_slug"] or lesson.media_id != fixture["original_media_id"]
        or not original or original.duration_seconds != 4
        or course.status != "published" or lesson.status != "published"
        or not current or current.source_name != "owner-review-leitner-20260928.json"
    ):
        raise ValueError("Owner-review content changed; refusing to overwrite it")
    conflict = await db.scalar(select(Course.id).where(Course.slug == fixture["course_slug"], Course.id != course.id))
    if conflict:
        raise ValueError("The chosen catalog slot is already owned by another course")

    media = fixture["media"]
    now = utc_now()
    asset = MediaAsset(
        user_id=original.user_id, media_type="video", file_url=media["url"],
        storage_provider="arvan_vod", storage_key=media["storage_key"],
        mime_type="application/vnd.apple.mpegurl", playback_type="hls",
        file_size_bytes=media["file_size_bytes"], duration_seconds=media["duration_seconds"],
        checksum_sha256=media["checksum_sha256"], source_name=source, source_url=media["url"],
        rights_holder="Original rights holder unverified; project owner authorized this staging demonstration",
        license_type="owner_authorized_staging_demo", license_status="approved",
        license_notes="Owner request on 2026-10-05: demonstrate the supplied Arvan video in the existing beta. No production publication approval.",
        license_reviewed_at=now, supersedes_id=original.id, revision=original.revision + 1,
        metadata_json={"client_demo_source": source, **fixture["provenance"]}, status="draft",
    )
    if not validate_media_asset(asset).valid:
        raise ValueError("Client demo media did not pass validation")
    await _verify_media_storage_for_publish(asset)
    db.add(asset)
    await db.flush()
    revision = await db.scalar(select(func.max(SubtitleTrack.revision)).where(
        SubtitleTrack.lesson_id == lesson.id, SubtitleTrack.language == "fa",
    ))
    track = SubtitleTrack(
        lesson_id=lesson.id, language="fa", format="json", revision=int(revision or 0) + 1,
        supersedes_id=current.id, source_name=source, status="draft",
        cues=[SubtitleCue(**cue) for cue in fixture["cues"]],
    )
    quality = validate_subtitle_track(track, duration_seconds=media["duration_seconds"])
    if not quality.valid:
        raise ValueError("Client demo subtitle track did not pass validation")
    apply_subtitle_validation(track, quality)
    db.add(track)
    await db.flush()
    # Preserve the earlier video and all subtitle revisions; only change the
    # active references. Existing study cards and dictionary IDs are untouched.
    await db.execute(update(SubtitleTrack).where(SubtitleTrack.id == current.id).values(status="archived"))
    track.status = "published"
    track.published_at = now
    asset.status = "published"
    asset.published_at = now
    course.metadata_json = {**course.metadata_json, "client_demo_source": source,
                            "demo_previous_slug": course.slug, "demo_previous_title": course.title}
    course.slug = fixture["course_slug"]
    course.title = fixture["course_title"]
    course.description = "نمونهٔ آزمایشی برای بررسی پخش ویدیو، زیرنویس چینی و فارسی، دیکشنری و لایتنر. این ویدیو نمونهٔ عملکرد اپ است."
    lesson.metadata_json = {**lesson.metadata_json, "client_demo_source": source, "lesson_index": 1}
    lesson.media_id = asset.id
    lesson.title = fixture["lesson_title"]
    lesson.duration_minutes = media["duration_seconds"] / 60
    lesson.revision += 1
    return True


async def run_background_import() -> None:
    if not demo_target_allowed(settings.DEPLOYMENT_TIER, settings.DATABASE_URL):
        return
    fixture = read_fixture()
    for attempt in range(4):
        try:
            async with SessionLocal.begin() as db:
                installed = await install_demo(db, fixture)
            logger.info("Client demo video %s: lesson 206; 120 bilingual cues", "installed" if installed else "already installed")
            return
        except Exception as error:
            logger.warning("Client demo import attempt %s failed (%s)", attempt + 1, type(error).__name__)
            if attempt == 3:
                return
            await asyncio.sleep(30 * (attempt + 1))
