import pytest
import hashlib
from datetime import datetime, UTC
from pathlib import Path
from uuid import uuid4
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.db.session import SessionLocal
from app.main import app
from app.models.course import Category, Course, PublicationStatus, Subcategory
from app.models.media import MediaAsset, MediaLicenseStatus, MediaPublicationStatus
from app.models.user import User, UserRole, UserStatus


pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_unknown_public_image_is_opaque_404_without_provider_details():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        response = await client.get("/api/v1/media/public-images/9223372036854775807")

    assert response.status_code == 404
    assert "provider" not in response.text.lower()
    assert "storage" not in response.text.lower()
    assert "file_url" not in response.text.lower()


@pytest.mark.asyncio
async def test_public_image_rejects_unsafe_same_origin_content_type():
    suffix = uuid4().hex
    payload = b"<html><script>alert(1)</script></html>"
    relative = Path("phase5") / suffix / "unsafe.html"
    path = Path(settings.MOUNTED_STORAGE_ROOT) / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)

    async with SessionLocal() as db:
        owner = User(
            email=f"phase5-unsafe-{suffix}@example.com",
            phone=f"+988{suffix[:9]}",
            password_hash="test-only",
            is_verified=True,
            status=UserStatus.ACTIVE,
            role=UserRole.ADMIN,
        )
        db.add(owner)
        await db.flush()
        asset = MediaAsset(
            user_id=owner.id,
            media_type="image",
            file_url=f"/uploads/{relative.as_posix()}",
            storage_provider="mounted",
            storage_key=relative.as_posix(),
            mime_type="text/html",
            file_size_bytes=len(payload),
            playback_type="progressive",
            checksum_sha256=hashlib.sha256(payload).hexdigest(),
            source_name="phase5-test",
            rights_holder="ChinVerse test fixture",
            license_type="test-only",
            license_status=MediaLicenseStatus.APPROVED,
            status=MediaPublicationStatus.PUBLISHED,
        )
        db.add(asset)
        await db.flush()
        category = Category(name=f"Unsafe {suffix}", slug=f"unsafe-{suffix}")
        db.add(category)
        await db.flush()
        subcategory = Subcategory(category_id=category.id, name="Unsafe", slug=f"unsafe-cover-{suffix}")
        db.add(subcategory)
        await db.flush()
        db.add(Course(
            subcategory_id=subcategory.id,
            title="Unsafe cover",
            slug=f"unsafe-course-{suffix}",
            description="Unsafe MIME must never be served.",
            cover_image_url=asset.file_url,
            cover_media_id=asset.id,
            level="beginner",
            status=PublicationStatus.PUBLISHED,
        ))
        await db.commit()
        media_id = int(asset.id)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        response = await client.get(f"/api/v1/media/public-images/{media_id}")
    assert response.status_code == 404
    assert payload not in response.content


@pytest.mark.asyncio
async def test_public_image_streams_then_revocation_becomes_opaque_404():
    suffix = uuid4().hex
    payload = b"phase5-public-image-bytes"
    relative = Path("phase5") / suffix / "cover.webp"
    path = Path(settings.MOUNTED_STORAGE_ROOT) / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)

    async with SessionLocal() as db:
        owner = User(
            email=f"phase5-image-{suffix}@example.com",
            phone=f"+989{suffix[:9]}",
            password_hash="test-only",
            is_verified=True,
            status=UserStatus.ACTIVE,
            role=UserRole.ADMIN,
        )
        db.add(owner)
        await db.flush()
        asset = MediaAsset(
            user_id=owner.id,
            media_type="image",
            file_url=f"/uploads/{relative.as_posix()}",
            storage_provider="mounted",
            storage_key=relative.as_posix(),
            mime_type="image/webp",
            file_size_bytes=len(payload),
            playback_type="progressive",
            checksum_sha256=hashlib.sha256(payload).hexdigest(),
            source_name="phase5-test",
            rights_holder="ChinVerse test fixture",
            license_type="test-only",
            license_status=MediaLicenseStatus.APPROVED,
            status=MediaPublicationStatus.PUBLISHED,
            published_at=datetime.now(UTC),
        )
        db.add(asset)
        await db.flush()
        category = Category(name=f"Phase5 image {suffix}", slug=f"phase5-image-{suffix}")
        db.add(category)
        await db.flush()
        subcategory = Subcategory(category_id=category.id, name="Cover", slug=f"cover-{suffix}")
        db.add(subcategory)
        await db.flush()
        course = Course(
            subcategory_id=subcategory.id,
            title="Public cover",
            slug=f"public-cover-{suffix}",
            description="Public licensed image gateway test.",
            cover_image_url=asset.file_url,
            cover_media_id=asset.id,
            level="beginner",
            status=PublicationStatus.PUBLISHED,
        )
        db.add(course)
        await db.commit()
        media_id = int(asset.id)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        served = await client.get(f"/api/v1/media/public-images/{media_id}")
        assert served.status_code == 200
        assert served.content == payload
        assert served.headers["content-type"].startswith("image/webp")
        # API middleware deliberately strengthens route caching to no-store.
        assert "no-store" in served.headers["cache-control"]

        async with SessionLocal() as db:
            stored = await db.get(MediaAsset, media_id)
            assert stored is not None
            stored.license_status = MediaLicenseStatus.REJECTED
            await db.commit()

        revoked = await client.get(f"/api/v1/media/public-images/{media_id}")
        assert revoked.status_code == 404
        assert "storage" not in revoked.text.lower()
