from pathlib import Path

from fastapi import UploadFile

from app.core.storage import StoredFile, store_upload_file
from app.core.config import settings


async def save_image_upload(
    file: UploadFile,
    *,
    destination_dir: Path,
    public_url_prefix: str,
) -> str:
    stored = await store_upload_file(
        file,
        destination_dir=destination_dir,
        public_url_prefix=public_url_prefix,
        allowed_extensions=settings.IMAGE_EXTENSIONS,
        allowed_content_types=settings.IMAGE_CONTENT_TYPES,
        max_size_bytes=settings.MAX_IMAGE_UPLOAD_SIZE_BYTES,
    )
    return stored.public_url


async def save_video_upload(
    file: UploadFile,
    *,
    destination_dir: Path,
    public_url_prefix: str,
) -> StoredFile:
    return await store_upload_file(
        file,
        destination_dir=destination_dir,
        public_url_prefix=public_url_prefix,
        allowed_extensions=settings.VIDEO_EXTENSIONS,
        allowed_content_types=settings.VIDEO_CONTENT_TYPES,
        max_size_bytes=settings.MAX_VIDEO_UPLOAD_SIZE_BYTES,
    )


async def save_thumbnail_upload(
    file: UploadFile,
    *,
    destination_dir: Path,
    public_url_prefix: str,
) -> StoredFile:
    return await store_upload_file(
        file,
        destination_dir=destination_dir,
        public_url_prefix=public_url_prefix,
        allowed_extensions=settings.IMAGE_EXTENSIONS,
        allowed_content_types=settings.IMAGE_CONTENT_TYPES,
        max_size_bytes=settings.MAX_IMAGE_UPLOAD_SIZE_BYTES,
    )
