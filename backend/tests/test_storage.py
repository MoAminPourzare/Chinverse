from io import BytesIO
from pathlib import Path

import pytest
from fastapi import HTTPException, UploadFile
from PIL import Image
from starlette.datastructures import Headers

from app.core.paths import resolve_backend_file_url
from app.core.config import settings
from app.core import storage
from app.core.storage import (
    delete_public_file,
    object_storage_key_from_url,
    store_upload_file,
)
from app.core.uploads import save_image_upload, save_video_upload


def make_upload(filename: str, content: bytes, content_type: str) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(content),
        headers=Headers({"content-type": content_type}),
    )


def media_box(box_type: bytes, payload: bytes = b"") -> bytes:
    return (8 + len(payload)).to_bytes(4, "big") + box_type + payload


@pytest.mark.asyncio
async def test_store_upload_enforces_type_size_and_empty_file(tmp_path):
    stored = await store_upload_file(
        make_upload("avatar.png", b"valid-bytes", "image/png"),
        destination_dir=tmp_path,
        public_url_prefix="/uploads/test",
        allowed_extensions=["png"],
        allowed_content_types=["image/png"],
        max_size_bytes=100,
    )
    assert stored.extension == "png"
    assert stored.size_bytes == len(b"valid-bytes")
    assert (tmp_path / stored.filename).read_bytes() == b"valid-bytes"

    with pytest.raises(HTTPException, match="File size is too large"):
        await store_upload_file(
            make_upload("large.png", b"x" * 101, "image/png"),
            destination_dir=tmp_path,
            public_url_prefix="/uploads/test",
            allowed_extensions=["png"],
            allowed_content_types=["image/png"],
            max_size_bytes=100,
        )

    with pytest.raises(HTTPException, match="Uploaded file is empty"):
        await store_upload_file(
            make_upload("empty.png", b"", "image/png"),
            destination_dir=tmp_path,
            public_url_prefix="/uploads/test",
            allowed_extensions=["png"],
            allowed_content_types=["image/png"],
            max_size_bytes=100,
        )


@pytest.mark.asyncio
async def test_bmp_upload_is_converted_to_browser_friendly_jpeg(tmp_path):
    source = BytesIO()
    Image.new("RGBA", (8, 8), (255, 0, 0, 128)).save(source, format="BMP")

    public_url = await save_image_upload(
        make_upload("camera.bmp", source.getvalue(), "image/bmp"),
        destination_dir=tmp_path,
        public_url_prefix="/uploads/test",
    )

    assert public_url.endswith(".jpg")
    output_path = tmp_path / public_url.rsplit("/", 1)[-1]
    assert output_path.exists()
    assert not list(tmp_path.glob("*.bmp"))
    with Image.open(output_path) as converted:
        assert converted.format == "JPEG"
        assert converted.mode == "RGB"


@pytest.mark.asyncio
async def test_jpeg_upload_is_reencoded_without_exif(tmp_path):
    source = BytesIO()
    exif = Image.Exif()
    exif[0x010E] = "private metadata"
    Image.new("RGB", (8, 8), (20, 40, 60)).save(
        source,
        format="JPEG",
        exif=exif,
    )

    public_url = await save_image_upload(
        make_upload("avatar.jpg", source.getvalue(), "image/jpeg"),
        destination_dir=tmp_path,
        public_url_prefix="/uploads/test",
    )

    output_path = tmp_path / public_url.rsplit("/", 1)[-1]
    with Image.open(output_path) as sanitized:
        assert sanitized.format == "JPEG"
        assert not sanitized.getexif()


@pytest.mark.asyncio
async def test_image_upload_rejects_spoofed_content_and_removes_it(tmp_path):
    with pytest.raises(HTTPException, match="تصویر معتبر"):
        await save_image_upload(
            make_upload("spoofed.jpg", b"<script>not an image</script>", "application/octet-stream"),
            destination_dir=tmp_path,
            public_url_prefix="/uploads/test",
        )

    assert not list(tmp_path.iterdir())


@pytest.mark.asyncio
async def test_video_upload_validates_container_and_mime_pair(tmp_path):
    minimal_mp4 = (
        media_box(b"ftyp", b"isom")
        + media_box(b"moov")
        + media_box(b"mdat")
    )
    stored = await save_video_upload(
        make_upload("lesson.mp4", minimal_mp4, "video/mp4"),
        destination_dir=tmp_path,
        public_url_prefix="/uploads/videos",
    )
    assert stored.extension == "mp4"
    assert (tmp_path / stored.filename).exists()

    with pytest.raises(HTTPException, match="ویدیوی معتبر"):
        await save_video_upload(
            make_upload("spoofed.mp4", b"not-a-video", "video/mp4"),
            destination_dir=tmp_path,
            public_url_prefix="/uploads/videos",
        )
    with pytest.raises(HTTPException, match="ویدیوی معتبر"):
        await save_video_upload(
            make_upload("mismatch.mov", minimal_mp4, "video/mp4"),
            destination_dir=tmp_path,
            public_url_prefix="/uploads/videos",
        )
    assert not list(tmp_path.glob("*spoofed*"))
    assert not list(tmp_path.glob("*mismatch*"))


def test_storage_path_resolution_rejects_traversal_and_external_urls():
    assert resolve_backend_file_url("/uploads/avatars/avatar.jpg") is not None
    assert resolve_backend_file_url("/uploads/avatars/../../.env") is None
    assert resolve_backend_file_url("https://example.com/avatar.jpg") is None


class FakeObjectStorageClient:
    def __init__(self):
        self.objects = {}
        self.deleted = []

    def upload_file(self, path, bucket, key, ExtraArgs):
        self.objects[(bucket, key)] = {
            "body": Path(path).read_bytes(),
            "metadata": ExtraArgs,
        }

    def delete_object(self, *, Bucket, Key):
        self.deleted.append((Bucket, Key))
        self.objects.pop((Bucket, Key), None)


@pytest.mark.asyncio
async def test_object_upload_survives_local_staging_cleanup_and_can_be_deleted(
    tmp_path,
    monkeypatch,
):
    fake_client = FakeObjectStorageClient()
    monkeypatch.setattr(settings, "FILE_STORAGE_MODE", "s3")
    monkeypatch.setattr(settings, "OBJECT_STORAGE_BUCKET_NAME", "chinverse-test")
    monkeypatch.setattr(
        settings,
        "OBJECT_STORAGE_PUBLIC_BASE_URL",
        "https://assets.example.test",
    )
    monkeypatch.setattr(storage, "get_object_storage_client", lambda: fake_client)

    source = BytesIO()
    Image.new("RGB", (8, 8), (20, 40, 60)).save(source, format="PNG")
    public_url = await save_image_upload(
        make_upload("avatar.png", source.getvalue(), "image/png"),
        destination_dir=tmp_path,
        public_url_prefix="/uploads/avatars",
    )

    storage_key = object_storage_key_from_url(public_url)
    assert storage_key is not None
    stored = fake_client.objects[("chinverse-test", storage_key)]
    with Image.open(BytesIO(stored["body"])) as sanitized:
        assert sanitized.format == "WEBP"
        assert not sanitized.getexif()
    assert stored["metadata"]["ContentType"] == "image/webp"
    assert stored["metadata"]["CacheControl"].endswith("immutable")
    assert not list(tmp_path.iterdir())

    assert await delete_public_file(public_url) is True
    assert fake_client.deleted == [("chinverse-test", storage_key)]
    assert not fake_client.objects


def test_object_url_parser_rejects_foreign_hosts_and_traversal(monkeypatch):
    monkeypatch.setattr(
        settings,
        "OBJECT_STORAGE_PUBLIC_BASE_URL",
        "https://assets.example.test/media",
    )

    assert (
        object_storage_key_from_url(
            "https://assets.example.test/media/uploads/avatars/avatar.png"
        )
        == "uploads/avatars/avatar.png"
    )
    assert (
        object_storage_key_from_url(
            "https://assets.example.test.evil/media/file"
        )
        is None
    )
    assert (
        object_storage_key_from_url(
            "https://assets.example.test/media/../secret"
        )
        is None
    )
