from io import BytesIO

import pytest
from fastapi import HTTPException, UploadFile
from PIL import Image
from starlette.datastructures import Headers

from app.core.paths import resolve_backend_file_url
from app.core.storage import store_upload_file
from app.core.uploads import save_image_upload


def make_upload(filename: str, content: bytes, content_type: str) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(content),
        headers=Headers({"content-type": content_type}),
    )


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
async def test_image_upload_rejects_spoofed_content_and_removes_it(tmp_path):
    with pytest.raises(HTTPException, match="تصویر معتبر"):
        await save_image_upload(
            make_upload("spoofed.jpg", b"<script>not an image</script>", "application/octet-stream"),
            destination_dir=tmp_path,
            public_url_prefix="/uploads/test",
        )

    assert not list(tmp_path.iterdir())


def test_storage_path_resolution_rejects_traversal_and_external_urls():
    assert resolve_backend_file_url("/uploads/avatars/avatar.jpg") is not None
    assert resolve_backend_file_url("/uploads/avatars/../../.env") is None
    assert resolve_backend_file_url("https://example.com/avatar.jpg") is None
