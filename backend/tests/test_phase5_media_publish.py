from hashlib import sha256
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.api.v1.endpoints import media
from app.core import storage
from app.core.config import settings
from app.models.media import MediaPlaybackType


@pytest.mark.asyncio
@pytest.mark.parametrize("operation", ["publish_course", "archive_course"])
async def test_course_transition_returns_eager_loaded_response(monkeypatch, operation):
    course = SimpleNamespace(id=69, cover_media_id=2)
    loaded = object()
    db = SimpleNamespace(get=AsyncMock(return_value=course), commit=AsyncMock())
    load = AsyncMock(return_value=loaded)
    monkeypatch.setattr(media, "_load_course", load)
    monkeypatch.setattr(media, "_get_media", AsyncMock(return_value=SimpleNamespace(
        media_type="image", status="published",
    )))
    monkeypatch.setattr(media, "validate_media_asset", lambda _: SimpleNamespace(valid=True))
    kwargs = {"course_id": 69, "db": db}
    kwargs["current_user" if operation == "publish_course" else "_current_user"] = SimpleNamespace(id=10)

    result = await getattr(media, operation)(**kwargs)

    assert result is loaded
    db.commit.assert_awaited_once()
    load.assert_awaited_once_with(db, 69)


def _asset(payload: bytes, **overrides):
    values = {
        "file_url": "/uploads/videos/publish-check.bin",
        "storage_key": "uploads/videos/publish-check.bin",
        "storage_provider": "mounted",
        "playback_type": MediaPlaybackType.PROGRESSIVE,
        "checksum_sha256": sha256(payload).hexdigest(),
        "file_size_bytes": len(payload),
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def _write_mounted_asset(payload: bytes, filename: str = "publish-check.bin") -> Path:
    path = Path(settings.MOUNTED_STORAGE_ROOT) / "videos" / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)
    return path


@pytest.mark.asyncio
async def test_publish_verification_accepts_matching_mounted_bytes():
    payload = b"verified-media-bytes"
    _write_mounted_asset(payload)

    await media._verify_media_storage_for_publish(_asset(payload))


@pytest.mark.asyncio
async def test_publish_verification_rejects_missing_or_changed_mounted_bytes():
    payload = b"registered-media-bytes"
    path = _write_mounted_asset(b"tampered-media-bytes")

    with pytest.raises(HTTPException, match="checksum does not match") as mismatch:
        await media._verify_media_storage_for_publish(_asset(payload))
    assert mismatch.value.status_code == 400

    path.unlink()
    with pytest.raises(HTTPException, match="storage object is missing") as missing:
        await media._verify_media_storage_for_publish(_asset(payload))
    assert missing.value.status_code == 400


@pytest.mark.asyncio
async def test_publish_verification_rejects_malformed_hls_manifest():
    manifest = b"#EXTM3U\n#EXT-X-VERSION:3\n"
    _write_mounted_asset(manifest, "publish-check.m3u8")

    with pytest.raises(HTTPException, match="HLS manifest graph is invalid") as invalid:
        await media._verify_media_storage_for_publish(
            _asset(
                manifest,
                playback_type=MediaPlaybackType.HLS,
                storage_key="uploads/videos/publish-check.m3u8",
                file_url="/uploads/videos/publish-check.m3u8",
            )
        )
    assert invalid.value.status_code == 400


@pytest.mark.asyncio
async def test_publish_verification_walks_all_local_hls_dependencies():
    root_manifest = b"#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000\n720/index.m3u8\n"
    child_manifest = (
        b'#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="../keys/key.bin"\n'
        b'#EXT-X-MAP:URI="init.mp4"\n#EXTINF:6,\nsegment-1.ts\n'
    )
    root = _write_mounted_asset(root_manifest, "publish-check.m3u8")
    (root.parent / "720").mkdir(exist_ok=True)
    (root.parent / "keys").mkdir(exist_ok=True)
    (root.parent / "720" / "index.m3u8").write_bytes(child_manifest)
    (root.parent / "keys" / "key.bin").write_bytes(b"key")
    (root.parent / "720" / "init.mp4").write_bytes(b"init")
    segment = root.parent / "720" / "segment-1.ts"
    segment.write_bytes(b"segment")
    asset = _asset(
        root_manifest,
        playback_type=MediaPlaybackType.HLS,
        storage_key="uploads/videos/publish-check.m3u8",
        file_url="/uploads/videos/publish-check.m3u8",
    )

    await media._verify_media_storage_for_publish(asset)

    segment.unlink()
    with pytest.raises(HTTPException, match="dependency is missing or empty"):
        await media._verify_media_storage_for_publish(asset)


class _ObjectStorageClient:
    def __init__(self, payload: bytes | None = None, *, objects: dict[str, bytes] | None = None):
        self.objects = objects or {"uploads/videos/private.mp4": payload or b""}
        self.request = None

    def get_object(self, **params):
        self.request = params
        payload = self.objects[params["Key"]]
        if params.get("Range") == "bytes=0-0":
            payload = payload[:1]
        return {
            "Body": BytesIO(payload),
            "ContentLength": len(payload),
        }


@pytest.mark.asyncio
async def test_s3_digest_streams_private_object_and_reports_real_size(monkeypatch):
    payload = b"private-object-bytes"
    client = _ObjectStorageClient(payload)
    monkeypatch.setattr(storage, "get_object_storage_client", lambda: client)

    result = await storage.object_storage_digest(
        "uploads/videos/private.mp4",
        bucket_name="chinverse-private-media",
    )

    assert result.checksum_sha256 == sha256(payload).hexdigest()
    assert result.size_bytes == len(payload)
    assert client.request == {
        "Bucket": "chinverse-private-media",
        "Key": "uploads/videos/private.mp4",
    }


@pytest.mark.asyncio
async def test_publish_verification_checks_s3_hls_graph_in_private_bucket(monkeypatch):
    root_manifest = b"#EXTM3U\n#EXTINF:6,\nsegments/one.ts\n"
    client = _ObjectStorageClient(
        objects={
            "uploads/videos/course/master.m3u8": root_manifest,
            "uploads/videos/course/segments/one.ts": b"segment",
        }
    )
    monkeypatch.setattr(storage, "get_object_storage_client", lambda: client)
    monkeypatch.setattr(settings, "MEDIA_OBJECT_STORAGE_BUCKET_NAME", "chinverse-private-media")
    asset = _asset(
        root_manifest,
        file_url="/_private-media/uploads/videos/course/master.m3u8",
        storage_key="uploads/videos/course/master.m3u8",
        storage_provider="s3",
        playback_type=MediaPlaybackType.HLS,
    )

    await media._verify_media_storage_for_publish(asset)

    assert client.request["Bucket"] == "chinverse-private-media"
    assert client.request["Key"] == "uploads/videos/course/segments/one.ts"
    assert client.request["Range"] == "bytes=0-0"
