from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.api.errors import bad_request


CHUNK_SIZE_BYTES = 1024 * 1024


@dataclass(frozen=True)
class StoredFile:
    public_url: str
    storage_key: str
    filename: str
    content_type: str
    size_bytes: int
    extension: str


async def store_upload_file(
    file: UploadFile,
    *,
    destination_dir: Path,
    public_url_prefix: str,
    allowed_extensions: list[str],
    allowed_content_types: list[str],
    max_size_bytes: int,
) -> StoredFile:
    if not file.filename:
        raise bad_request("File is required")

    extension = Path(file.filename).suffix.lower().lstrip(".")
    if extension not in allowed_extensions:
        allowed = ", ".join(allowed_extensions)
        raise bad_request(f"File format must be one of: {allowed}")

    content_type = (file.content_type or "").lower()
    if allowed_content_types and content_type not in allowed_content_types:
        raise bad_request("File type is not allowed")

    destination_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4()}.{extension}"
    file_path = destination_dir / filename
    bytes_written = 0

    try:
        with file_path.open("wb") as buffer:
            while True:
                chunk = await file.read(CHUNK_SIZE_BYTES)
                if not chunk:
                    break

                bytes_written += len(chunk)
                if bytes_written > max_size_bytes:
                    raise bad_request("File size is too large")

                buffer.write(chunk)
    except Exception:
        file_path.unlink(missing_ok=True)
        raise
    finally:
        await file.close()

    if bytes_written == 0:
        file_path.unlink(missing_ok=True)
        raise bad_request("Uploaded file is empty")

    public_url = f"{public_url_prefix.rstrip('/')}/{filename}"
    return StoredFile(
        public_url=public_url,
        storage_key=public_url.lstrip("/"),
        filename=filename,
        content_type=content_type,
        size_bytes=bytes_written,
        extension=extension,
    )


def resolve_public_storage_path(public_url: str | None) -> Path | None:
    if not public_url:
        return None

    from app.core.paths import resolve_backend_file_url

    return resolve_backend_file_url(public_url)


def delete_public_file(public_url: str | None) -> None:
    path = resolve_public_storage_path(public_url)
    if path and path.exists() and path.is_file():
        try:
            path.unlink()
        except OSError:
            pass
