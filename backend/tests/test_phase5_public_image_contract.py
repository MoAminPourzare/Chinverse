from types import SimpleNamespace

from app.api.v1.endpoints.courses import _course_to_response, _raw_course_to_response
from app.core.config import settings
from app.models.media import MediaLicenseStatus, MediaPlaybackType, MediaPublicationStatus


def _licensed_cover(media_id: int = 41) -> SimpleNamespace:
    return SimpleNamespace(
        id=media_id,
        media_type="image",
        playback_type=MediaPlaybackType.PROGRESSIVE,
        storage_provider="mounted",
        storage_key="courses/demo/cover.webp",
        mime_type="image/webp",
        checksum_sha256="a" * 64,
        source_name="phase5-contract",
        rights_holder="ChinVerse test fixture",
        license_type="test-only",
        license_status=MediaLicenseStatus.APPROVED,
        status=MediaPublicationStatus.PUBLISHED,
    )


def _course(cover: SimpleNamespace) -> SimpleNamespace:
    return SimpleNamespace(
        id=7,
        subcategory_id=3,
        subcategory=SimpleNamespace(slug="pronunciation"),
        title="Stable public image contract",
        slug="stable-public-image-contract",
        description="No expiring image URL in a long-lived course DTO.",
        cover_media_id=cover.id,
        cover_media=cover,
        level="beginner",
        metadata_json={},
        status="published",
        revision=1,
        published_at=None,
        sections=[],
    )


def test_public_course_cover_is_opaque_and_stable_across_signed_ttl_changes(monkeypatch):
    course = _course(_licensed_cover())

    monkeypatch.setattr(settings, "MEDIA_SIGNED_URL_TTL_SECONDS", 1)
    first = _course_to_response(course, {})
    monkeypatch.setattr(settings, "MEDIA_SIGNED_URL_TTL_SECONDS", 900)
    later = _course_to_response(course, {})

    expected = "/api/v1/media/public-images/41"
    assert first["cover_url"] == expected
    assert first["cover_image_url"] == expected
    assert later["cover_url"] == expected
    assert later["cover_image_url"] == expected
    assert "?" not in expected
    assert "signature" not in expected
    assert "provider" not in expected


def test_saved_course_projection_uses_the_same_stable_gateway_contract():
    row = {
        "id": 7,
        "subcategory_id": 3,
        "subcategory_slug": "pronunciation",
        "title": "Stable public image contract",
        "slug": "stable-public-image-contract",
        "description": "Saved list contract.",
        "cover_media_id": 41,
        "level": "beginner",
        "metadata_json": {},
        "status": "published",
        "revision": 1,
        "published_at": None,
        "sections": [],
    }

    response = _raw_course_to_response(row, {})

    assert response["cover_url"] == "/api/v1/media/public-images/41"
    assert response["cover_image_url"] == response["cover_url"]


def test_unlicensed_cover_is_not_advertised_by_hydrated_course_dto():
    cover = _licensed_cover()
    cover.license_status = MediaLicenseStatus.PENDING

    response = _course_to_response(_course(cover), {})

    assert response["cover_url"] is None
    assert response["cover_image_url"] is None
