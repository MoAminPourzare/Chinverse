from pathlib import Path

from fastapi import UploadFile

from app.api.errors import bad_request
from app.core.storage import StoredFile, persist_stored_file, store_upload_file
from app.core.config import settings


CONVERT_TO_JPEG_EXTENSIONS = {"heic", "heif", "bmp", "tif", "tiff"}


def register_image_openers() -> None:
    try:
        from pillow_heif import register_heif_opener

        register_heif_opener()
    except ImportError:
        pass


def validate_stored_image(stored: StoredFile, *, destination_dir: Path) -> None:
    source_path = destination_dir / stored.filename

    try:
        from PIL import Image

        register_image_openers()
        with Image.open(source_path) as image:
            if image.width * image.height > settings.MAX_IMAGE_PIXEL_COUNT:
                raise ValueError("Image dimensions are too large")
            image.verify()
    except Exception as exc:
        source_path.unlink(missing_ok=True)
        raise bad_request("این فایل یک تصویر معتبر و قابل پردازش نیست.") from exc


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
    validate_stored_image(stored, destination_dir=destination_dir)
    if stored.extension in CONVERT_TO_JPEG_EXTENSIONS:
        stored = convert_stored_image_to_jpeg(
            stored,
            destination_dir=destination_dir,
            public_url_prefix=public_url_prefix,
        )
    stored = await persist_stored_file(stored, destination_dir=destination_dir)
    return stored.public_url


def convert_stored_image_to_jpeg(
    stored: StoredFile,
    *,
    destination_dir: Path,
    public_url_prefix: str,
) -> StoredFile:
    source_path = destination_dir / stored.filename
    jpeg_filename = f"{Path(stored.filename).stem}.jpg"
    jpeg_path = destination_dir / jpeg_filename

    try:
        from PIL import Image, ImageOps

        register_image_openers()

        with Image.open(source_path) as image:
            image = ImageOps.exif_transpose(image)
            if getattr(image, "is_animated", False):
                image.seek(0)

            if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
                background = Image.new("RGB", image.size, (255, 255, 255))
                alpha = image.convert("RGBA").getchannel("A")
                background.paste(image.convert("RGBA"), mask=alpha)
                image = background
            else:
                image = image.convert("RGB")

            image.save(jpeg_path, "JPEG", quality=92, optimize=True)
    except Exception as exc:
        source_path.unlink(missing_ok=True)
        jpeg_path.unlink(missing_ok=True)
        raise bad_request("این فرمت تصویر قابل پردازش نیست. لطفا یک تصویر دیگر انتخاب کن.") from exc

    source_path.unlink(missing_ok=True)
    public_url = f"{public_url_prefix.rstrip('/')}/{jpeg_filename}"
    return StoredFile(
        public_url=public_url,
        storage_key=public_url.lstrip("/"),
        filename=jpeg_filename,
        content_type="image/jpeg",
        size_bytes=jpeg_path.stat().st_size,
        extension="jpg",
    )


async def save_video_upload(
    file: UploadFile,
    *,
    destination_dir: Path,
    public_url_prefix: str,
) -> StoredFile:
    stored = await store_upload_file(
        file,
        destination_dir=destination_dir,
        public_url_prefix=public_url_prefix,
        allowed_extensions=settings.VIDEO_EXTENSIONS,
        allowed_content_types=settings.VIDEO_CONTENT_TYPES,
        max_size_bytes=settings.MAX_VIDEO_UPLOAD_SIZE_BYTES,
    )
    return await persist_stored_file(stored, destination_dir=destination_dir)


async def save_thumbnail_upload(
    file: UploadFile,
    *,
    destination_dir: Path,
    public_url_prefix: str,
) -> StoredFile:
    stored = await store_upload_file(
        file,
        destination_dir=destination_dir,
        public_url_prefix=public_url_prefix,
        allowed_extensions=settings.IMAGE_EXTENSIONS,
        allowed_content_types=settings.IMAGE_CONTENT_TYPES,
        max_size_bytes=settings.MAX_IMAGE_UPLOAD_SIZE_BYTES,
    )
    validate_stored_image(stored, destination_dir=destination_dir)
    if stored.extension in CONVERT_TO_JPEG_EXTENSIONS:
        stored = convert_stored_image_to_jpeg(
            stored,
            destination_dir=destination_dir,
            public_url_prefix=public_url_prefix,
        )
    return await persist_stored_file(stored, destination_dir=destination_dir)
