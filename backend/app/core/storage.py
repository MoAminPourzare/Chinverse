from dataclasses import dataclass, replace
from functools import lru_cache
import hashlib
import logging
from pathlib import Path, PurePosixPath
from typing import Any, Iterator
from urllib.parse import unquote, urlsplit
from uuid import uuid4

from anyio import to_thread
from fastapi import HTTPException, UploadFile, status

from app.api.errors import bad_request
from app.core.config import settings
from app.core.paths import UPLOADS_DIR


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


@dataclass(frozen=True)
class ObjectStorageStream:
    body: Any
    content_type: str | None
    content_length: int | None
    content_range: str | None
    etag: str | None


@dataclass(frozen=True)
class ObjectStorageDigest:
    checksum_sha256: str
    size_bytes: int


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
            connect_timeout=settings.STORAGE_CONNECT_TIMEOUT_SECONDS,
            read_timeout=settings.STORAGE_READ_TIMEOUT_SECONDS,
            retries={"max_attempts": 4, "mode": "standard"},
            s3={"addressing_style": settings.OBJECT_STORAGE_ADDRESSING_STYLE},
            request_checksum_calculation="when_required",
            response_checksum_validation="when_required",
        ),
    )


@lru_cache(maxsize=1)
def get_object_storage_health_client():
    import boto3
    from botocore.config import Config

    # put/get/delete are three separate calls. A single health invocation must
    # finish its underlying worker shortly after the outer readiness deadline,
    # not merely abandon a thread that keeps retrying for minutes.
    per_operation_timeout = max(0.1, settings.HEALTHCHECK_TIMEOUT_SECONDS / 8)
    return boto3.client(
        service_name="s3",
        endpoint_url=settings.OBJECT_STORAGE_ENDPOINT_URL,
        aws_access_key_id=settings.OBJECT_STORAGE_ACCESS_KEY_ID,
        aws_secret_access_key=settings.OBJECT_STORAGE_SECRET_ACCESS_KEY,
        region_name=settings.OBJECT_STORAGE_REGION,
        config=Config(
            signature_version="s3v4",
            connect_timeout=min(
                settings.STORAGE_CONNECT_TIMEOUT_SECONDS,
                per_operation_timeout,
            ),
            read_timeout=min(
                settings.STORAGE_READ_TIMEOUT_SECONDS,
                per_operation_timeout,
            ),
            retries={"total_max_attempts": 1, "mode": "standard"},
            s3={"addressing_style": settings.OBJECT_STORAGE_ADDRESSING_STYLE},
            request_checksum_calculation="when_required",
            response_checksum_validation="when_required",
        ),
    )


def reset_storage_client_cache() -> None:
    get_object_storage_client.cache_clear()
    get_object_storage_health_client.cache_clear()


def _probe_object_storage() -> None:
    client = get_object_storage_health_client()
    buckets = {
        settings.OBJECT_STORAGE_BUCKET_NAME.strip(),
        settings.MEDIA_OBJECT_STORAGE_BUCKET_NAME.strip(),
    }
    for bucket_name in sorted(bucket for bucket in buckets if bucket):
        storage_key = f"_health/chinverse-{uuid4().hex}.txt"
        object_created = False
        probe_succeeded = False
        body = None
        try:
            client.put_object(
                Bucket=bucket_name,
                Key=storage_key,
                Body=b"ok",
                ContentType="text/plain",
                CacheControl="no-store",
            )
            object_created = True
            response = client.get_object(Bucket=bucket_name, Key=storage_key)
            body = response["Body"]
            if body.read(3) != b"ok":
                raise OSError("Object storage health probe could not be read back")
            probe_succeeded = True
        finally:
            if body is not None:
                body.close()
            if object_created:
                try:
                    client.delete_object(Bucket=bucket_name, Key=storage_key)
                except Exception:
                    if probe_succeeded:
                        raise
                    logger.exception(
                        "Could not clean up a failed object storage health probe"
                    )


def _probe_filesystem_storage() -> None:
    if not UPLOADS_DIR.is_dir():
        raise OSError("Upload storage root does not exist")

    probe_path = UPLOADS_DIR / f".chinverse-health-{uuid4().hex}"
    try:
        with probe_path.open("xb") as probe:
            probe.write(b"ok")
            probe.flush()
        if probe_path.read_bytes() != b"ok":
            raise OSError("Upload storage health probe could not be read back")
    finally:
        probe_path.unlink(missing_ok=True)


async def probe_storage() -> None:
    """Verify that the configured durable storage is reachable and writable."""
    probe = _probe_object_storage if settings.USES_OBJECT_STORAGE else _probe_filesystem_storage
    await to_thread.run_sync(probe)


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


def _upload_file_to_object_storage(
    file_path: Path,
    stored: StoredFile,
    bucket_name: str,
) -> None:
    get_object_storage_client().upload_file(
        str(file_path),
        bucket_name,
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
    private_object: bool = False,
) -> StoredFile:
    if settings.FILE_STORAGE_MODE in {"local", "mounted"}:
        return stored

    file_path = destination_dir / stored.filename
    bucket_name = (
        settings.MEDIA_OBJECT_STORAGE_BUCKET_NAME
        if private_object
        else settings.OBJECT_STORAGE_BUCKET_NAME
    )
    try:
        await to_thread.run_sync(
            _upload_file_to_object_storage,
            file_path,
            stored,
            bucket_name,
        )
    except Exception as exc:
        file_path.unlink(missing_ok=True)
        logger.exception("Object storage upload failed for key %s", stored.storage_key)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage is temporarily unavailable",
        ) from exc

    file_path.unlink(missing_ok=True)
    if private_object:
        # This is an internal locator, not a routable or provider URL. Protected
        # media is readable only through the signed application gateway.
        return replace(stored, public_url=f"/_private-media/{stored.storage_key}")
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


def _delete_object(storage_key: str, bucket_name: str) -> None:
    get_object_storage_client().delete_object(
        Bucket=bucket_name,
        Key=storage_key,
    )


def _validated_object_key(storage_key: str) -> str:
    raw = str(storage_key or "")
    normalized = PurePosixPath(raw)
    if not raw or normalized.is_absolute() or ".." in normalized.parts or "\\" in raw:
        raise ValueError("Invalid object storage key")
    return normalized.as_posix()


def _open_object_storage_stream(
    storage_key: str,
    byte_range: str | None,
    bucket_name: str,
) -> ObjectStorageStream:
    params: dict[str, Any] = {
        "Bucket": bucket_name,
        "Key": _validated_object_key(storage_key),
    }
    if byte_range:
        params["Range"] = byte_range
    response = get_object_storage_client().get_object(**params)
    return ObjectStorageStream(
        body=response["Body"],
        content_type=response.get("ContentType"),
        content_length=response.get("ContentLength"),
        content_range=response.get("ContentRange"),
        etag=response.get("ETag"),
    )


async def open_object_storage_stream(
    storage_key: str,
    *,
    byte_range: str | None = None,
    bucket_name: str | None = None,
) -> ObjectStorageStream:
    """Open an authorized private object without revealing a provider URL."""
    try:
        return await to_thread.run_sync(
            _open_object_storage_stream,
            storage_key,
            byte_range,
            bucket_name or settings.OBJECT_STORAGE_BUCKET_NAME,
        )
    except Exception as exc:
        logger.exception("Object storage read failed for key %s", storage_key)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage is temporarily unavailable",
        ) from exc


def iter_object_storage_body(body: Any) -> Iterator[bytes]:
    """Yield a blocking SDK body safely; Starlette runs sync iterators off-loop."""
    try:
        while chunk := body.read(CHUNK_SIZE_BYTES):
            yield chunk
    finally:
        body.close()


def _read_object_storage_bytes(
    storage_key: str,
    max_bytes: int,
    bucket_name: str,
) -> bytes:
    stream = _open_object_storage_stream(storage_key, None, bucket_name)
    try:
        chunks: list[bytes] = []
        remaining = max_bytes + 1
        while remaining > 0:
            chunk = stream.body.read(min(CHUNK_SIZE_BYTES, remaining))
            if not chunk:
                break
            chunks.append(chunk)
            remaining -= len(chunk)
        value = b"".join(chunks)
    finally:
        stream.body.close()
    if len(value) > max_bytes:
        raise ValueError("Object exceeds maximum allowed size")
    return value


async def read_object_storage_bytes(
    storage_key: str,
    *,
    max_bytes: int,
    bucket_name: str | None = None,
) -> bytes:
    """Read a small private object such as an HLS manifest with a hard cap."""
    try:
        return await to_thread.run_sync(
            _read_object_storage_bytes,
            storage_key,
            max_bytes,
            bucket_name or settings.OBJECT_STORAGE_BUCKET_NAME,
        )
    except ValueError:
        raise
    except Exception as exc:
        logger.exception("Object storage read failed for key %s", storage_key)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage is temporarily unavailable",
        ) from exc


def _object_storage_digest(storage_key: str, bucket_name: str) -> ObjectStorageDigest:
    stream = _open_object_storage_stream(storage_key, None, bucket_name)
    digest = hashlib.sha256()
    size_bytes = 0
    try:
        while chunk := stream.body.read(CHUNK_SIZE_BYTES):
            digest.update(chunk)
            size_bytes += len(chunk)
    finally:
        stream.body.close()
    return ObjectStorageDigest(
        checksum_sha256=digest.hexdigest(),
        size_bytes=size_bytes,
    )


async def object_storage_digest(
    storage_key: str,
    *,
    bucket_name: str | None = None,
) -> ObjectStorageDigest:
    """Hash the stored object bytes without buffering a media file in memory."""
    try:
        return await to_thread.run_sync(
            _object_storage_digest,
            storage_key,
            bucket_name or settings.OBJECT_STORAGE_BUCKET_NAME,
        )
    except Exception as exc:
        logger.exception("Object storage integrity check failed for key %s", storage_key)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage is temporarily unavailable",
        ) from exc


async def delete_public_file(public_url: str | None) -> bool:
    path = resolve_public_storage_path(public_url)
    if path and path.exists() and path.is_file():
        try:
            path.unlink()
            return True
        except OSError:
            logger.warning("Could not delete local upload %s", path)
            return False

    private_prefix = "/_private-media/"
    private_key = None
    if public_url and public_url.startswith(private_prefix):
        try:
            private_key = _validated_object_key(public_url[len(private_prefix) :])
        except ValueError:
            return False

    storage_key = private_key or object_storage_key_from_url(public_url)
    if not storage_key or settings.FILE_STORAGE_MODE != "s3":
        return False

    try:
        bucket_name = (
            settings.MEDIA_OBJECT_STORAGE_BUCKET_NAME
            if private_key
            else settings.OBJECT_STORAGE_BUCKET_NAME
        )
        await to_thread.run_sync(_delete_object, storage_key, bucket_name)
        return True
    except Exception:
        logger.exception("Could not delete object storage key %s", storage_key)
        return False
