"""HTTP-level Phase 5 media gateway coverage.

The fixture deliberately uses a free, published HLS lesson so the test can
exercise the browser-compatible signed URL contract without seeding a real
account or a provider credential.  All bytes live under the disposable test
storage root configured by ``tests/conftest.py``.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
import hashlib
from pathlib import Path
from urllib.parse import urljoin
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select

from app.core.config import settings
from app.db.session import SessionLocal
from app.main import app
from app.models.course import Category, Course, CourseSection, Lesson, PublicationStatus, Subcategory
from app.models.media import (
    MediaAccessAuditEvent,
    MediaAsset,
    MediaLicenseStatus,
    MediaPlaybackType,
    MediaPublicationStatus,
)
from app.models.subscription import SubscriptionPlan, SubscriptionStatus, UserSubscription
from app.models.user import User, UserRole, UserStatus


pytestmark = pytest.mark.integration

PASSWORD = "Secure phase five media passphrase 123!"
LEGAL_ACCEPTANCE = {
    "accept_terms": True,
    "accept_privacy": True,
    "accept_community_guidelines": True,
}


async def _create_verified_user(client: AsyncClient, label: str) -> tuple[int, dict[str, str]]:
    suffix = str(uuid4().int)[-9:]
    email = f"phase5-{label}-{uuid4().hex[:10]}@example.com"
    signup = await client.post(
        "/api/v1/signup",
        json={
            "email": email,
            "phone": f"09{suffix}",
            "password": PASSWORD,
            "display_name": "کاربر رسانه فاز پنج",
            **LEGAL_ACCEPTANCE,
        },
    )
    assert signup.status_code == 200, signup.text
    user_id = int(signup.json()["id"])

    async with SessionLocal() as db:
        user = await db.get(User, user_id)
        assert user is not None
        now = datetime.now(UTC)
        user.email_verified_at = now
        user.phone_verified_at = now
        user.is_verified = True
        await db.commit()

    login = await client.post(
        "/api/v1/login/access-token",
        data={"username": email, "password": PASSWORD},
    )
    assert login.status_code == 200, login.text
    return user_id, {"Authorization": f"Bearer {login.json()['access_token']}"}


async def _create_media_fixture(
    *,
    is_free: bool = True,
    lesson_status: PublicationStatus = PublicationStatus.PUBLISHED,
    media_status: MediaPublicationStatus = MediaPublicationStatus.PUBLISHED,
    license_status: MediaLicenseStatus = MediaLicenseStatus.APPROVED,
    playback_type: MediaPlaybackType = MediaPlaybackType.HLS,
) -> tuple[int, int, Path, bytes]:
    suffix = uuid4().hex
    relative_root = Path("phase5") / suffix
    storage_root = Path(settings.MOUNTED_STORAGE_ROOT) / relative_root
    storage_root.mkdir(parents=True, exist_ok=True)
    if playback_type == MediaPlaybackType.HLS:
        media_bytes = b"#EXTM3U\n#EXTINF:1,\nsegments/one.ts\n"
        filename = "master.m3u8"
        mime_type = "application/vnd.apple.mpegurl"
        (storage_root / filename).write_bytes(media_bytes)
        (storage_root / "segments").mkdir()
        (storage_root / "segments" / "one.ts").write_bytes(b"phase5-segment-bytes")
    else:
        media_bytes = b"0123456789-phase5-progressive-media"
        filename = "lesson.mp4"
        mime_type = "video/mp4"
        (storage_root / filename).write_bytes(media_bytes)

    relative_file = relative_root / filename

    async with SessionLocal() as db:
        user = User(
            email=f"phase5-media-{suffix}@example.com",
            phone=f"+989{suffix[:9]}",
            password_hash="phase5-test-only",
            is_verified=True,
            status=UserStatus.ACTIVE,
            role=UserRole.ADMIN,
        )
        db.add(user)
        await db.flush()

        category = Category(name=f"Phase 5 {suffix}", slug=f"phase5-{suffix}")
        db.add(category)
        await db.flush()
        subcategory = Subcategory(
            category_id=category.id,
            name=f"Phase 5 media {suffix}",
            slug=f"phase5-media-{suffix}",
        )
        db.add(subcategory)
        await db.flush()
        course = Course(
            subcategory_id=subcategory.id,
            title=f"Phase 5 media course {suffix}",
            slug=f"phase5-media-course-{suffix}",
            description="Disposable HLS gateway fixture.",
            cover_image_url="",
            level="beginner",
            metadata_json={},
            status=PublicationStatus.PUBLISHED,
        )
        db.add(course)
        await db.flush()
        section = CourseSection(
            course_id=course.id,
            title="Media section",
            order_index=0,
            metadata_json={},
        )
        db.add(section)
        await db.flush()
        checksum = hashlib.sha256(media_bytes).hexdigest()
        asset = MediaAsset(
            user_id=user.id,
            media_type="video",
            file_url=f"/uploads/{relative_file.as_posix()}",
            storage_provider="mounted",
            storage_key=relative_file.as_posix(),
            mime_type=mime_type,
            file_size_bytes=len(media_bytes),
            duration_seconds=1,
            metadata_json={},
            status=media_status,
            playback_type=playback_type,
            checksum_sha256=checksum,
            source_name="phase5-http-fixture",
            rights_holder="ChinVerse test fixture",
            license_type="test-only",
            license_status=license_status,
        )
        db.add(asset)
        await db.flush()
        lesson = Lesson(
            course_id=course.id,
            section_id=section.id,
            title="Signed HLS lesson",
            video_url="",
            duration_minutes=1 / 60,
            media_id=asset.id,
            is_free=is_free,
            metadata_json={},
            status=lesson_status,
        )
        db.add(lesson)
        await db.commit()
        return int(lesson.id), int(asset.id), storage_root, media_bytes


@pytest.mark.asyncio
async def test_free_hls_playback_rewrites_and_binds_every_resource():
    lesson_id, media_id, storage_root, _media_bytes = await _create_media_fixture()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        direct_root = storage_root.relative_to(Path(settings.MOUNTED_STORAGE_ROOT)).as_posix()
        assert (await client.get(f"/uploads/{direct_root}/master.m3u8")).status_code == 404
        assert (await client.get(f"/uploads/{direct_root}/segments/one.ts")).status_code == 404

        playback = await client.get(f"/api/v1/courses/lessons/{lesson_id}/playback")
        assert playback.status_code == 200, playback.text
        payload = playback.json()
        assert payload["entitlement"] == {
            "required": False,
            "granted": True,
            "reason": "free_lesson",
        }
        signed_url = payload["media"]["playback_url"]
        assert signed_url.startswith(f"/api/v1/media/assets/{media_id}/content?")
        assert "provider" not in signed_url

        manifest = await client.get(signed_url)
        assert manifest.status_code == 200, manifest.text
        assert "#EXTM3U" in manifest.text
        assert "resource=segments%2Fone.ts" in manifest.text
        assert "https://" not in manifest.text

        segment_url = next(line for line in manifest.text.splitlines() if "resource=segments%2Fone.ts" in line)
        segment = await client.get(urljoin(f"https://test{signed_url}", segment_url))
        assert segment.status_code == 200
        assert segment.content == b"phase5-segment-bytes"
        # The application security middleware deliberately strengthens the
        # gateway's private/no-store header to ``no-store`` for all API paths.
        assert "no-store" in segment.headers["cache-control"]

        tampered = signed_url.replace("signature=", "signature=x")
        assert (await client.get(tampered)).status_code == 403
        traversal = signed_url + "&resource=..%2Fsecret.ts"
        assert (await client.get(traversal)).status_code == 403


@pytest.mark.asyncio
async def test_public_course_dto_exposes_display_metadata_only():
    lesson_id, _media_id, _storage_root, _media_bytes = await _create_media_fixture()
    async with SessionLocal() as db:
        lesson = await db.get(Lesson, lesson_id)
        assert lesson is not None
        course = await db.get(Course, lesson.course_id)
        section = await db.get(CourseSection, lesson.section_id)
        assert course is not None and section is not None
        course.metadata_json = {
            "content_kind": "course",
            "rating": 4.8,
            "provider_url": "https://provider.invalid/private",
        }
        section.metadata_json = {"summary": "Visible section", "storage_key": "private/master.m3u8"}
        lesson.metadata_json = {
            "summary": "Visible lesson",
            "duration_label": "1 minute",
            "storage_key": "private/master.m3u8",
            "video_url": "/uploads/private/master.m3u8",
        }
        course_id = int(course.id)
        await db.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        response = await client.get(f"/api/v1/courses/{course_id}")
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["metadata_json"] == {"content_kind": "course", "rating": 4.8}
    assert payload["sections"][0]["metadata_json"] == {"summary": "Visible section"}
    assert payload["sections"][0]["lessons"][0]["metadata_json"] == {
        "duration_label": "1 minute",
        "summary": "Visible lesson",
    }


@pytest.mark.asyncio
async def test_paid_playback_enforces_subscription_revocation_and_audits_every_decision():
    lesson_id, media_id, _storage_root, _media_bytes = await _create_media_fixture(is_free=False)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        anonymous = await client.get(f"/api/v1/courses/lessons/{lesson_id}/playback")
        assert anonymous.status_code == 401, anonymous.text

        user_id, headers = await _create_verified_user(client, "entitlement")
        without_subscription = await client.get(
            f"/api/v1/courses/lessons/{lesson_id}/playback",
            headers=headers,
        )
        assert without_subscription.status_code == 403, without_subscription.text

        today = date.today()
        async with SessionLocal() as db:
            plan = SubscriptionPlan(
                name=f"Phase 5 integration {uuid4().hex}",
                duration_months=1,
                price=0,
                is_active=True,
            )
            db.add(plan)
            await db.flush()
            subscription = UserSubscription(
                user_id=user_id,
                plan_id=plan.id,
                start_date=today - timedelta(days=30),
                end_date=today - timedelta(days=1),
                # Keep the row nominally active to prove the date boundary is
                # enforced independently of the lifecycle status.
                status=SubscriptionStatus.ACTIVE,
            )
            db.add(subscription)
            await db.commit()
            subscription_id = int(subscription.id)

        expired = await client.get(
            f"/api/v1/courses/lessons/{lesson_id}/playback",
            headers=headers,
        )
        assert expired.status_code == 403, expired.text

        async with SessionLocal() as db:
            subscription = await db.get(UserSubscription, subscription_id)
            assert subscription is not None
            subscription.start_date = today - timedelta(days=1)
            subscription.end_date = today + timedelta(days=30)
            subscription.status = SubscriptionStatus.ACTIVE
            await db.commit()

        active = await client.get(
            f"/api/v1/courses/lessons/{lesson_id}/playback",
            headers=headers,
        )
        assert active.status_code == 200, active.text
        assert active.json()["entitlement"] == {
            "required": True,
            "granted": True,
            "reason": "active_subscription",
        }
        signed_url = active.json()["media"]["playback_url"]
        assert signed_url.startswith(f"/api/v1/media/assets/{media_id}/content?")

        async with SessionLocal() as db:
            subscription = await db.get(UserSubscription, subscription_id)
            assert subscription is not None
            subscription.status = SubscriptionStatus.EXPIRED
            await db.commit()

        revoked = await client.get(signed_url)
        assert revoked.status_code == 403, revoked.text

    async with SessionLocal() as db:
        events = list(
            (
                await db.execute(
                    select(MediaAccessAuditEvent)
                    .where(MediaAccessAuditEvent.lesson_id == lesson_id)
                    .order_by(MediaAccessAuditEvent.id)
                )
            )
            .scalars()
            .all()
        )

    assert [(event.action, event.outcome, event.reason, event.user_id) for event in events] == [
        ("issue", "denied", "active_subscription_required", user_id),
        ("issue", "denied", "active_subscription_required", user_id),
        ("issue", "granted", "active_subscription", user_id),
        ("resolve", "denied", "active_subscription_required", user_id),
    ]
    assert events[2].token_expires_at is not None


@pytest.mark.parametrize(
    ("lesson_status", "media_status", "license_status"),
    [
        (
            PublicationStatus.DRAFT,
            MediaPublicationStatus.PUBLISHED,
            MediaLicenseStatus.APPROVED,
        ),
        (
            PublicationStatus.PUBLISHED,
            MediaPublicationStatus.DRAFT,
            MediaLicenseStatus.APPROVED,
        ),
        (
            PublicationStatus.PUBLISHED,
            MediaPublicationStatus.PUBLISHED,
            MediaLicenseStatus.PENDING,
        ),
    ],
    ids=["draft-lesson", "draft-media", "unlicensed-media"],
)
@pytest.mark.asyncio
async def test_draft_or_unlicensed_media_is_indistinguishable_from_missing(
    lesson_status: PublicationStatus,
    media_status: MediaPublicationStatus,
    license_status: MediaLicenseStatus,
):
    lesson_id, _media_id, _storage_root, _media_bytes = await _create_media_fixture(
        lesson_status=lesson_status,
        media_status=media_status,
        license_status=license_status,
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        response = await client.get(f"/api/v1/courses/lessons/{lesson_id}/playback")
    assert response.status_code == 404, response.text

    # Untrusted missing IDs are intentionally not persisted: otherwise this
    # public GET becomes an unbounded database write-amplification vector.
    async with SessionLocal() as db:
        count = await db.scalar(
            select(func.count(MediaAccessAuditEvent.id)).where(
                MediaAccessAuditEvent.reason == "not_published",
            )
        )
    assert int(count or 0) == 0


@pytest.mark.asyncio
async def test_progressive_local_playback_honors_single_byte_range():
    lesson_id, media_id, _storage_root, media_bytes = await _create_media_fixture(
        playback_type=MediaPlaybackType.PROGRESSIVE,
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        playback = await client.get(f"/api/v1/courses/lessons/{lesson_id}/playback")
        assert playback.status_code == 200, playback.text
        signed_url = playback.json()["media"]["playback_url"]
        assert signed_url.startswith(f"/api/v1/media/assets/{media_id}/content?")

        ranged = await client.get(signed_url, headers={"Range": "bytes=2-7"})
        assert ranged.status_code == 206, ranged.text
        assert ranged.content == media_bytes[2:8]
        assert ranged.headers["accept-ranges"] == "bytes"
        assert ranged.headers["content-range"] == f"bytes 2-7/{len(media_bytes)}"
