from pathlib import Path
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints.courses import (
    _PUBLIC_LESSON_METADATA,
    _public_metadata,
)
from app.core.paths import AVATARS_DIR, THUMBNAILS_DIR, VIDEOS_DIR
from app.main import app
from app.api.v1.endpoints.media import _local_media_path
from app.models.media import MediaAsset
from app.schemas.course import CourseCreate, LessonCreate


@pytest.mark.asyncio
async def test_course_media_and_thumbnails_are_not_public_static_routes():
    filename = f"phase5-private-{uuid4().hex}.bin"
    avatar_name = f"phase5-public-{uuid4().hex}.bin"
    video = Path(VIDEOS_DIR) / filename
    thumbnail = Path(THUMBNAILS_DIR) / filename
    avatar = Path(AVATARS_DIR) / avatar_name
    video.write_bytes(b"private-video")
    thumbnail.write_bytes(b"private-thumbnail")
    avatar.write_bytes(b"public-avatar")

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
            assert (await client.get(f"/uploads/videos/{filename}")).status_code == 404
            assert (await client.get(f"/uploads/thumbnails/{filename}")).status_code == 404
            public_response = await client.get(f"/uploads/avatars/{avatar_name}")
            assert public_response.status_code == 200
            assert public_response.content == b"public-avatar"
    finally:
        video.unlink(missing_ok=True)
        thumbnail.unlink(missing_ok=True)
        avatar.unlink(missing_ok=True)


def test_public_lesson_metadata_is_allowlisted():
    assert _public_metadata(
        {
            "summary": "Visible",
            "key_points": ["one", "two"],
            "storage_key": "uploads/videos/private.mp4",
            "provider_url": "https://provider.invalid/private",
        },
        _PUBLIC_LESSON_METADATA,
    ) == {"summary": "Visible", "key_points": ["one", "two"]}


def test_admin_create_contracts_reject_raw_media_url_fallbacks():
    with pytest.raises(ValueError, match="media_id"):
        LessonCreate(
            title="Raw URL lesson",
            video_url="https://provider.invalid/video.mp4",
        )


def test_local_media_resolution_uses_canonical_storage_key_not_file_url():
    asset = MediaAsset(
        user_id=1,
        media_type="video",
        file_url="/uploads/videos/different-file.mp4",
        storage_provider="mounted",
        storage_key="uploads/videos/canonical-file.mp4",
        playback_type="progressive",
    )

    assert _local_media_path(asset, "") == (Path(VIDEOS_DIR) / "canonical-file.mp4").resolve()
    with pytest.raises(ValueError, match="cover_media_id"):
        CourseCreate(
            subcategory_id=1,
            title="Raw URL course",
            slug="raw-url-course",
            description="A raw cover URL must never replace a registered media asset.",
            cover_image_url="https://provider.invalid/cover.jpg",
            level="beginner",
        )
