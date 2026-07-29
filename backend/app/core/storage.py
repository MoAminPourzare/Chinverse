from dataclasses import dataclass, replace
from functools import lru_cache
import logging
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit
from uuid import uuid4

from anyio import to_thread
from fastapi import HTTPException, UploadFile, status

from app.api.errors import bad_request
from app.core.config import settings


CHUNK_SIZE_BYTES = 1024 * 1024
CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable"
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class StoredFile:
    public_url: str
    storage_key: str
    filename: str
    content_type: str
    size_bytes: int
    extension: str


def _storage_key(public_url_prefix: str, filename: str) -> str:
    key = f"{public_url_prefix.strip('/')}/{filename}"
    normalized = PurePosixPath(key)
    if not key or normalized.is_absolute() or ".." in normalized.parts:
        raise ValueError("Invalid object storage key")
    return normalized.as_posix()


def _object_public_url(storage_key: str) -> str:
    return f"{settings.OBJECT_STORAGE_PUBLIC_BASE_URL.rstrip('/')}/{storage_key}"


@lru_cache(maxsize=1)
def get_object_storage_client():
    import boto3
    from botocore.config import Config

    return boto3.client(
        service_name="s3",
        endpoint_url=settings.OBJECT_STORAGE_ENDPOINT_URL,
        aws_access_key_id=settings.OBJECT_STORAGE_ACCESS_KEY_ID,
        aws_secret_access_key=settings.OBJECT_STORAGE_SECRET_ACCESS_KEY,
        region_name=settings.OBJECT_STORAGE_REGION,
        config=Config(
            signature_version="s3v4",
            retries={"max_attempts": 4, "mode": "standard"},
            s3={"addressing_style": settings.OBJECT_STORAGE_ADDRESSING_STYLE},
            request_checksum_calculation="when_required",
            response_checksum_validation="when_required",
        ),
    )


def reset_storage_client_cache() -> None:
    get_object_storage_client.cache_clear()


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

    storage_key = _storage_key(public_url_prefix, filename)
    return StoredFile(
        public_url=f"/{storage_key}",
        storage_key=storage_key,
        filename=filename,
        content_type=content_type,
        size_bytes=bytes_written,
        extension=extension,
    )


def _upload_file_to_object_storage(file_path: Path, stored: StoredFile) -> None:
    get_object_storage_client().upload_file(
        str(file_path),
        settings.OBJECT_STORAGE_BUCKET_NAME,
        stored.storage_key,
        ExtraArgs={
            "ContentType": stored.content_type or "application/octet-stream",
            "CacheControl": CACHE_CONTROL_IMMUTABLE,
        },
    )


async def persist_stored_file(
    stored: StoredFile,
    *,
    destination_dir: Path,
) -> StoredFile:
    if settings.FILE_STORAGE_MODE == "local":
        return stored

    file_path = destination_dir / stored.filename
    try:
        await to_thread.run_sync(_upload_file_to_object_storage, file_path, stored)
    except Exception as exc:
        file_path.unlink(missing_ok=True)
        logger.exception("Object storage upload failed for key %s", stored.storage_key)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage is temporarily unavailable",
        ) from exc

    file_path.unlink(missing_ok=True)
    return replace(stored, public_url=_object_public_url(stored.storage_key))


def resolve_public_storage_path(public_url: str | None) -> Path | None:
    if not public_url:
        return None

    from app.core.paths import resolve_backend_file_url

    return resolve_backend_file_url(public_url)


def object_storage_key_from_url(public_url: str | None) -> str | None:
    if not public_url or not settings.OBJECT_STORAGE_PUBLIC_BASE_URL:
        return None

    expected = urlsplit(settings.OBJECT_STORAGE_PUBLIC_BASE_URL.rstrip("/"))
    candidate = urlsplit(public_url)
    if (
        candidate.scheme.lower() != expected.scheme.lower()
        or candidate.netloc.lower() != expected.netloc.lower()
    ):
        return None

    expected_path = expected.path.rstrip("/")
    candidate_path = unquote(candidate.path)
    if expected_path and not candidate_path.startswith(f"{expected_path}/"):
        return None

    key = candidate_path[len(expected_path) :].lstrip("/")
    normalized = PurePosixPath(key)
    if not key or normalized.is_absolute() or ".." in normalized.parts:
        return None
    return normalized.as_posix()


def _delete_object(storage_key: str) -> None:
    get_object_storage_client().delete_object(
        Bucket=settings.OBJECT_STORAGE_BUCKET_NAME,
        Key=storage_key,
    )


async def delete_public_file(public_url: str | None) -> bool:
    path = resolve_public_storage_path(public_url)
    if path and path.exists() and path.is_file():
        try:
            path.unlink()
            return True
        except OSError:
            logger.warning("Could not delete local upload %s", path)
            return False

    storage_key = object_storage_key_from_url(public_url)
    if not storage_key or settings.FILE_STORAGE_MODE != "s3":
        return False

    try:
        await to_thread.run_sync(_delete_object, storage_key)
        return True
    except Exception:
        logger.exception("Could not delete object storage key %s", storage_key)
        return False
