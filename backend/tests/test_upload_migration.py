from argparse import Namespace
from contextlib import asynccontextmanager
from types import SimpleNamespace
import pytest

from app.core.config import settings
from scripts import migrate_uploads_to_object_storage as migration
from scripts.migrate_uploads_to_object_storage import (
    Reference,
    UrlColumn,
    apply_database_updates,
    is_private_media_reference,
    migrate_url,
    public_object_key_for_url,
    run,
    source_path_for_url,
)


SOURCE_BASE_URL = "https://api.example.test"


def test_upload_migration_accepts_only_known_source_paths():
    assert (
        source_path_for_url("/uploads/avatars/avatar.png", SOURCE_BASE_URL)
        == "uploads/avatars/avatar.png"
    )
    assert (
        source_path_for_url(
            "https://api.example.test/static/uploads/gallery/photo.jpg",
            SOURCE_BASE_URL,
        )
        == "uploads/gallery/photo.jpg"
    )

    assert (
        source_path_for_url(
            "https://cdn.example.test/uploads/avatars/avatar.png",
            SOURCE_BASE_URL,
        )
        is None
    )
    assert source_path_for_url("/images/course-cover.jpg", SOURCE_BASE_URL) is None
    assert source_path_for_url("/uploads/avatars/../secret", SOURCE_BASE_URL) is None


def test_course_media_columns_are_always_private():
    protected = [
        Reference(UrlColumn("media_assets", "id", "file_url"), 1, "/uploads/videos/a.mp4"),
        Reference(UrlColumn("media_assets", "id", "thumbnail_url"), 1, "/uploads/thumbnails/a.jpg"),
        Reference(UrlColumn("lessons", "id", "video_url"), 2, "/uploads/videos/a.mp4"),
        Reference(UrlColumn("lessons", "id", "thumbnail_url"), 2, "/uploads/thumbnails/a.jpg"),
    ]
    assert all(is_private_media_reference(reference) for reference in protected)
    assert not is_private_media_reference(
        Reference(UrlColumn("user_profiles", "user_id", "avatar_url"), 3, "/uploads/avatars/a.jpg")
    )


def test_public_object_recognition_is_exact_and_confined(monkeypatch):
    monkeypatch.setattr(
        settings,
        "OBJECT_STORAGE_PUBLIC_BASE_URL",
        "https://assets.example.test/chinverse",
    )
    assert public_object_key_for_url(
        "https://assets.example.test/chinverse/uploads/videos/course/master.m3u8"
    ) == "uploads/videos/course/master.m3u8"
    assert public_object_key_for_url(
        "https://assets.example.test.evil/chinverse/uploads/videos/course/master.m3u8"
    ) is None
    assert public_object_key_for_url(
        "https://assets.example.test/chinverse/uploads/videos/../secret"
    ) is None
    assert public_object_key_for_url(
        "https://assets.example.test/chinverse/uploads/videos/a.mp4?token=secret"
    ) is None


@pytest.mark.asyncio
async def test_private_migration_uses_private_bucket_and_internal_locator(monkeypatch):
    source = SimpleNamespace(unlink=lambda **_kwargs: None)
    monkeypatch.setattr(settings, "OBJECT_STORAGE_BUCKET_NAME", "public-assets")
    monkeypatch.setattr(settings, "MEDIA_OBJECT_STORAGE_BUCKET_NAME", "private-media")
    monkeypatch.setattr(settings, "OBJECT_STORAGE_PUBLIC_BASE_URL", "https://assets.example.test")

    async def fake_download(*_args, **_kwargs):
        return source, "video/mp4", len(b"protected-media"), "a" * 64

    uploads = []

    def fake_upload(path, key, content_type, size_bytes, bucket_name):
        uploads.append((path, key, content_type, size_bytes, bucket_name))

    monkeypatch.setattr(migration, "download_to_temp", fake_download)
    monkeypatch.setattr(migration, "upload_and_verify", fake_upload)

    result = await migrate_url(
        object(),
        "/uploads/videos/lesson.mp4",
        "uploads/videos/lesson.mp4",
        SOURCE_BASE_URL,
        private_media=True,
    )

    assert result["new_url"] == "/_private-media/uploads/videos/lesson.mp4"
    assert result["visibility"] == "private"
    assert uploads[0][-1] == "private-media"


class _FakeConnection:
    def __init__(self):
        self.executions = []
        self.closed = False

    @asynccontextmanager
    async def transaction(self):
        yield

    async def execute(self, query, *values):
        self.executions.append((query, values))
        return "UPDATE 1"

    async def close(self):
        self.closed = True


@pytest.mark.asyncio
async def test_database_updates_choose_visibility_per_reference():
    old_url = "/uploads/videos/shared.mp4"
    private = Reference(UrlColumn("lessons", "id", "video_url"), 1, old_url)
    public = Reference(UrlColumn("user_gallery_items", "id", "image_url"), 2, old_url)
    migrated = {
        (old_url, True): {
            "new_url": "/_private-media/uploads/videos/shared.mp4",
            "storage_key": "uploads/videos/shared.mp4",
        },
        (old_url, False): {
            "new_url": "https://assets.example.test/uploads/videos/shared.mp4",
            "storage_key": "uploads/videos/shared.mp4",
        },
    }
    connection = _FakeConnection()

    await apply_database_updates(connection, [private, public], migrated)

    values = [execution[1][0] for execution in connection.executions]
    assert values == [
        "/_private-media/uploads/videos/shared.mp4",
        "https://assets.example.test/uploads/videos/shared.mp4",
    ]


@pytest.mark.asyncio
async def test_dry_run_is_non_mutating_and_reports_private_cleanup(monkeypatch):
    old_url = "https://assets.example.test/uploads/videos/paid.mp4"
    references = [
        Reference(UrlColumn("lessons", "id", "video_url"), 1, old_url),
    ]
    connection = _FakeConnection()

    monkeypatch.setattr(settings, "FILE_STORAGE_MODE", "s3")
    monkeypatch.setattr(settings, "OBJECT_STORAGE_BUCKET_NAME", "public-assets")
    monkeypatch.setattr(settings, "MEDIA_OBJECT_STORAGE_BUCKET_NAME", "private-media")
    monkeypatch.setattr(settings, "OBJECT_STORAGE_PUBLIC_BASE_URL", "https://assets.example.test")

    async def fake_connect(_url):
        return connection

    async def fake_collect(_connection):
        return references

    monkeypatch.setattr(migration.asyncpg, "connect", fake_connect)
    monkeypatch.setattr(migration, "collect_references", fake_collect)

    result = await run(Namespace(source_base_url=SOURCE_BASE_URL, apply=False))

    assert result["mode"] == "dry-run"
    assert result["private_objects"] == 1
    assert result["public_objects"] == 0
    assert result["legacy_public_objects_to_delete"] == ["uploads/videos/paid.mp4"]
    assert result["shared_public_object_conflicts"] == []
    assert result["migrated"] == []
    assert connection.executions == []
    assert connection.closed is True


@pytest.mark.asyncio
async def test_apply_requires_explicit_verified_public_object_cleanup(monkeypatch):
    old_url = "https://assets.example.test/uploads/videos/paid.mp4"
    references = [Reference(UrlColumn("lessons", "id", "video_url"), 1, old_url)]
    connection = _FakeConnection()

    monkeypatch.setattr(settings, "FILE_STORAGE_MODE", "s3")
    monkeypatch.setattr(settings, "OBJECT_STORAGE_BUCKET_NAME", "public-assets")
    monkeypatch.setattr(settings, "MEDIA_OBJECT_STORAGE_BUCKET_NAME", "private-media")
    monkeypatch.setattr(settings, "OBJECT_STORAGE_PUBLIC_BASE_URL", "https://assets.example.test")

    async def fake_connect(_url):
        return connection

    async def fake_collect(_connection):
        return references

    monkeypatch.setattr(migration.asyncpg, "connect", fake_connect)
    monkeypatch.setattr(migration, "collect_references", fake_collect)

    with pytest.raises(RuntimeError, match="--delete-old-public-objects"):
        await run(Namespace(source_base_url=SOURCE_BASE_URL, apply=True))

    assert connection.executions == []
    assert connection.closed is True


@pytest.mark.asyncio
async def test_apply_fails_closed_when_protected_object_has_public_reference(monkeypatch):
    old_url = "https://assets.example.test/uploads/videos/shared.mp4"
    references = [
        Reference(UrlColumn("lessons", "id", "video_url"), 1, old_url),
        Reference(UrlColumn("user_gallery_items", "id", "image_url"), 2, old_url),
    ]
    connection = _FakeConnection()

    monkeypatch.setattr(settings, "FILE_STORAGE_MODE", "s3")
    monkeypatch.setattr(settings, "OBJECT_STORAGE_BUCKET_NAME", "public-assets")
    monkeypatch.setattr(settings, "MEDIA_OBJECT_STORAGE_BUCKET_NAME", "private-media")
    monkeypatch.setattr(settings, "OBJECT_STORAGE_PUBLIC_BASE_URL", "https://assets.example.test")

    async def fake_connect(_url):
        return connection

    async def fake_collect(_connection):
        return references

    monkeypatch.setattr(migration.asyncpg, "connect", fake_connect)
    monkeypatch.setattr(migration, "collect_references", fake_collect)

    with pytest.raises(RuntimeError, match="shares a public object"):
        await run(
            Namespace(
                source_base_url=SOURCE_BASE_URL,
                apply=True,
                delete_old_public_objects=True,
            )
        )

    assert connection.executions == []
    assert connection.closed is True


@pytest.mark.asyncio
async def test_run_fails_closed_when_private_bucket_is_missing(monkeypatch):
    monkeypatch.setattr(settings, "FILE_STORAGE_MODE", "s3")
    monkeypatch.setattr(settings, "OBJECT_STORAGE_BUCKET_NAME", "public-assets")
    monkeypatch.setattr(settings, "MEDIA_OBJECT_STORAGE_BUCKET_NAME", "")

    with pytest.raises(RuntimeError, match="MEDIA_OBJECT_STORAGE_BUCKET_NAME is required"):
        await run(Namespace(source_base_url=SOURCE_BASE_URL, apply=False))
