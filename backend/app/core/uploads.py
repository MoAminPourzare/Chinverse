from pathlib import Path

from fastapi import UploadFile

from app.api.errors import bad_request
from app.core.storage import StoredFile, persist_stored_file, store_upload_file
from app.core.config import settings


JPEG_OUTPUT_EXTENSIONS = {
    "jpg",
    "jpeg",
    "jfif",
    "heic",
    "heif",
    "bmp",
    "tif",
    "tiff",
}

VIDEO_CONTENT_TYPES_BY_EXTENSION = {
    "mp4": {"video/mp4"},
    "m4v": {"video/mp4", "video/x-m4v"},
    "mov": {"video/quicktime"},
    "webm": {"video/webm"},
}


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
    stored = sanitize_stored_image(
        stored,
        destination_dir=destination_dir,
        public_url_prefix=public_url_prefix,
    )
    stored = await persist_stored_file(stored, destination_dir=destination_dir)
    return stored.public_url


def sanitize_stored_image(
    stored: StoredFile,
    *,
    destination_dir: Path,
    public_url_prefix: str,
) -> StoredFile:
    source_path = destination_dir / stored.filename
    output_extension = "jpg" if stored.extension in JPEG_OUTPUT_EXTENSIONS else "webp"
    output_filename = f"{Path(stored.filename).stem}-sanitized.{output_extension}"
    output_path = destination_dir / output_filename

    try:
        from PIL import Image, ImageOps

        register_image_openers()

        with Image.open(source_path) as image:
            image = ImageOps.exif_transpose(image)
            if getattr(image, "is_animated", False):
                image.seek(0)

            if output_extension == "jpg":
                if image.mode in ("RGBA", "LA") or (
                    image.mode == "P" and "transparency" in image.info
                ):
                    rgba_image = image.convert("RGBA")
                    background = Image.new("RGB", image.size, (255, 255, 255))
                    background.paste(rgba_image, mask=rgba_image.getchannel("A"))
                    image = background
                else:
                    image = image.convert("RGB")

                image.save(output_path, "JPEG", quality=92, optimize=True)
            else:
                image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
                image.save(output_path, "WEBP", quality=92, method=6)

            if output_path.stat().st_size > settings.MAX_IMAGE_UPLOAD_SIZE_BYTES:
                raise ValueError("Sanitized image is too large")
    except Exception as exc:
        source_path.unlink(missing_ok=True)
        output_path.unlink(missing_ok=True)
        raise bad_request("این فرمت تصویر قابل پردازش نیست. لطفا یک تصویر دیگر انتخاب کن.") from exc

    source_path.unlink(missing_ok=True)
    public_url = f"{public_url_prefix.rstrip('/')}/{output_filename}"
    return StoredFile(
        public_url=public_url,
        storage_key=public_url.lstrip("/"),
        filename=output_filename,
        content_type=("image/jpeg" if output_extension == "jpg" else "image/webp"),
        size_bytes=output_path.stat().st_size,
        extension=output_extension,
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
    validate_stored_video(stored, destination_dir=destination_dir)
    return await persist_stored_file(stored, destination_dir=destination_dir)


def validate_stored_video(stored: StoredFile, *, destination_dir: Path) -> None:
    source_path = destination_dir / stored.filename
    expected_content_types = VIDEO_CONTENT_TYPES_BY_EXTENSION.get(stored.extension, set())
    try:
        if stored.content_type not in expected_content_types:
            raise ValueError("Video extension and content type do not match")
        if stored.extension == "webm":
            _validate_webm(source_path)
        else:
            _validate_iso_base_media(source_path)
    except Exception as exc:
        source_path.unlink(missing_ok=True)
        raise bad_request("این فایل یک ویدیوی معتبر و قابل پردازش نیست.") from exc


def _validate_webm(path: Path) -> None:
    with path.open("rb") as source:
        header = source.read(4096)
    if not header.startswith(b"\x1a\x45\xdf\xa3"):
        raise ValueError("Missing EBML header")
    if b"\x18\x53\x80\x67" not in header or b"webm" not in header.lower():
        raise ValueError("Missing WebM document markers")


def _validate_iso_base_media(path: Path) -> None:
    file_size = path.stat().st_size
    offset = 0
    box_types: set[bytes] = set()
    with path.open("rb") as source:
        for _ in range(100_000):
            if offset == file_size:
                break
            if offset + 8 > file_size:
                raise ValueError("Truncated media box")

            source.seek(offset)
            header = source.read(8)
            box_size = int.from_bytes(header[:4], "big")
            box_type = header[4:8]
            header_size = 8
            if box_size == 1:
                extended_size = source.read(8)
                if len(extended_size) != 8:
                    raise ValueError("Truncated extended media box")
                box_size = int.from_bytes(extended_size, "big")
                header_size = 16
            elif box_size == 0:
                box_size = file_size - offset

            if box_size < header_size or offset + box_size > file_size:
                raise ValueError("Invalid media box size")
            box_types.add(box_type)
            offset += box_size
        else:
            raise ValueError("Too many media boxes")

    if not {b"ftyp", b"moov", b"mdat"}.issubset(box_types):
        raise ValueError("Required media boxes are missing")


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
    stored = sanitize_stored_image(
        stored,
        destination_dir=destination_dir,
        public_url_prefix=public_url_prefix,
    )
    return await persist_stored_file(stored, destination_dir=destination_dir)
