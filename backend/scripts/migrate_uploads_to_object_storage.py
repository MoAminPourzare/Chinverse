from __future__ import annotations

import argparse
import asyncio
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import hashlib
import json
import mimetypes
from pathlib import Path, PurePosixPath
import sys
import tempfile
from urllib.parse import unquote, urljoin, urlsplit

import asyncpg
import httpx


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402
from app.core.storage import (  # noqa: E402
    CACHE_CONTROL_IMMUTABLE,
    get_object_storage_client,
)


@dataclass(frozen=True)
class UrlColumn:
    table: str
    primary_key: str
    column: str


@dataclass(frozen=True)
class Reference:
    source: UrlColumn
    row_id: int
    old_url: str


URL_COLUMNS = (
    UrlColumn("user_profiles", "user_id", "avatar_url"),
    UrlColumn("user_gallery_items", "id", "image_url"),
    UrlColumn("user_services", "id", "banner_url"),
    UrlColumn("media_assets", "id", "file_url"),
    UrlColumn("media_assets", "id", "thumbnail_url"),
    UrlColumn("lessons", "id", "video_url"),
    UrlColumn("lessons", "id", "thumbnail_url"),
)

# These columns can identify paid or otherwise protected course material.  They
# must never be copied to the public asset bucket, even when their legacy URL
# happened to be publicly reachable.
PRIVATE_MEDIA_COLUMNS = frozenset(
    {
        UrlColumn("media_assets", "id", "file_url"),
        UrlColumn("media_assets", "id", "thumbnail_url"),
        UrlColumn("lessons", "id", "video_url"),
        UrlColumn("lessons", "id", "thumbnail_url"),
    }
)


def validate_url_column(source: UrlColumn) -> None:
    if source not in URL_COLUMNS:
        raise ValueError("Unsupported upload URL column")


def is_private_media_reference(reference: Reference) -> bool:
    validate_url_column(reference.source)
    return reference.source in PRIVATE_MEDIA_COLUMNS
MIGRATABLE_PREFIXES = (
    "uploads/avatars/",
    "uploads/gallery/",
    "uploads/services/",
    "uploads/thumbnails/",
    "uploads/videos/",
    "static/uploads/gallery/",
    "static/uploads/services/",
)


def normalized_database_url() -> str:
    return settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)


def source_path_for_url(url: str, source_base_url: str) -> str | None:
    parsed = urlsplit(url)
    if parsed.scheme or parsed.netloc:
        source_base = urlsplit(source_base_url)
        if parsed.scheme not in {"http", "https"} or parsed.netloc != source_base.netloc:
            return None
        path = unquote(parsed.path).lstrip("/")
    else:
        path = unquote(url).lstrip("/")

    normalized = PurePosixPath(path)
    if normalized.is_absolute() or ".." in normalized.parts:
        return None
    value = normalized.as_posix()
    if not value.startswith(MIGRATABLE_PREFIXES):
        return None
    return value.removeprefix("static/")


def public_object_key_for_url(url: str) -> str | None:
    """Recognize only an exact object inside the configured public base URL."""
    public_base = settings.OBJECT_STORAGE_PUBLIC_BASE_URL.strip().rstrip("/")
    if not public_base:
        return None
    parsed = urlsplit(url)
    expected = urlsplit(public_base)
    if (
        parsed.scheme.lower() != expected.scheme.lower()
        or parsed.netloc.lower() != expected.netloc.lower()
        or parsed.query
        or parsed.fragment
    ):
        return None
    expected_path = expected.path.rstrip("/")
    path = unquote(parsed.path)
    if expected_path:
        if not path.startswith(f"{expected_path}/"):
            return None
        path = path[len(expected_path) + 1 :]
    else:
        path = path.lstrip("/")
    normalized = PurePosixPath(path)
    if normalized.is_absolute() or ".." in normalized.parts:
        return None
    key = normalized.as_posix()
    if not key.startswith(tuple(prefix.removeprefix("static/") for prefix in MIGRATABLE_PREFIXES)):
        return None
    return key


async def collect_references(connection: asyncpg.Connection) -> list[Reference]:
    references = []
    for source in URL_COLUMNS:
        validate_url_column(source)
        # SQL parameters cannot represent identifiers; every identifier is selected
        # from the immutable URL_COLUMNS allowlist above.
        rows = await connection.fetch(
            f'SELECT "{source.primary_key}" AS row_id, "{source.column}" AS old_url '  # nosec B608
            f'FROM "{source.table}" WHERE "{source.column}" IS NOT NULL'
        )
        references.extend(
            Reference(source=source, row_id=int(row["row_id"]), old_url=row["old_url"])
            for row in rows
            if row["old_url"]
        )
    return references


async def download_to_temp(
    client: httpx.AsyncClient,
    source_url: str,
    *,
    max_size_bytes: int,
) -> tuple[Path, str, int, str]:
    suffix = Path(urlsplit(source_url).path).suffix
    handle = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    temp_path = Path(handle.name)
    size_bytes = 0
    digest = hashlib.sha256()
    try:
        async with client.stream("GET", source_url) as response:
            response.raise_for_status()
            content_type = response.headers.get("content-type", "").split(";", 1)[0]
            async for chunk in response.aiter_bytes():
                size_bytes += len(chunk)
                if size_bytes > max_size_bytes:
                    raise RuntimeError(f"Source upload is too large: {source_url}")
                handle.write(chunk)
                digest.update(chunk)
        handle.close()
        if size_bytes == 0:
            raise RuntimeError(f"Source upload is empty: {source_url}")
        return (
            temp_path,
            content_type
            or mimetypes.guess_type(source_url)[0]
            or "application/octet-stream",
            size_bytes,
            digest.hexdigest(),
        )
    except Exception:
        handle.close()
        temp_path.unlink(missing_ok=True)
        raise


def upload_and_verify(
    path: Path,
    key: str,
    content_type: str,
    size_bytes: int,
    bucket_name: str,
) -> None:
    client = get_object_storage_client()
    client.upload_file(
        str(path),
        bucket_name,
        key,
        ExtraArgs={
            "ContentType": content_type,
            "CacheControl": CACHE_CONTROL_IMMUTABLE,
        },
    )
    metadata = client.head_object(
        Bucket=bucket_name,
        Key=key,
    )
    if int(metadata["ContentLength"]) != size_bytes:
        raise RuntimeError(f"Object storage size verification failed for {key}")


async def migrate_url(
    client: httpx.AsyncClient,
    old_url: str,
    key: str,
    source_base_url: str,
    *,
    private_media: bool,
) -> dict[str, object]:
    source_url = urljoin(f"{source_base_url.rstrip('/')}/", old_url.lstrip("/"))
    max_size = max(
        settings.MAX_IMAGE_UPLOAD_SIZE_BYTES,
        settings.MAX_VIDEO_UPLOAD_SIZE_BYTES,
    )
    path, content_type, size_bytes, sha256 = await download_to_temp(
        client,
        source_url,
        max_size_bytes=max_size,
    )
    try:
        bucket_name = (
            settings.MEDIA_OBJECT_STORAGE_BUCKET_NAME
            if private_media
            else settings.OBJECT_STORAGE_BUCKET_NAME
        )
        await asyncio.to_thread(
            upload_and_verify,
            path,
            key,
            content_type,
            size_bytes,
            bucket_name,
        )
    finally:
        path.unlink(missing_ok=True)

    return {
        "old_url": old_url,
        "new_url": (
            f"/_private-media/{key}"
            if private_media
            else f"{settings.OBJECT_STORAGE_PUBLIC_BASE_URL.rstrip('/')}/{key}"
        ),
        "storage_key": key,
        "visibility": "private" if private_media else "public",
        "content_type": content_type,
        "size_bytes": size_bytes,
        "sha256": sha256,
    }


async def apply_database_updates(
    connection: asyncpg.Connection,
    references: list[Reference],
    migrated: dict[tuple[str, bool], dict[str, object]],
) -> None:
    async with connection.transaction():
        for reference in references:
            item = migrated.get(
                (reference.old_url, is_private_media_reference(reference))
            )
            if not item:
                continue
            source = reference.source
            validate_url_column(source)
            # Identifiers are constrained to URL_COLUMNS; values remain parameterized.
            update_result = await connection.execute(
                f'UPDATE "{source.table}" SET "{source.column}" = $1 '  # nosec B608
                f'WHERE "{source.primary_key}" = $2 AND "{source.column}" = $3',
                item["new_url"],
                reference.row_id,
                reference.old_url,
            )
            if update_result != "UPDATE 1":
                raise RuntimeError(
                    f"Concurrent database change detected for {source.table}.{source.column}"
                )
            if source.table == "media_assets" and source.column == "file_url":
                await connection.execute(
                    """
                    UPDATE media_assets
                    SET storage_provider = 's3', storage_key = $1
                    WHERE id = $2
                    """,
                    item["storage_key"],
                    reference.row_id,
                )


def delete_public_objects(keys: list[str]) -> list[str]:
    """Delete exact, verified legacy keys from the public bucket."""
    storage = get_object_storage_client()
    deleted: list[str] = []
    for key in keys:
        storage.delete_object(
            Bucket=settings.OBJECT_STORAGE_BUCKET_NAME,
            Key=key,
        )
        deleted.append(key)
    return deleted


async def run(args: argparse.Namespace) -> dict[str, object]:
    if settings.FILE_STORAGE_MODE != "s3":
        raise RuntimeError("FILE_STORAGE_MODE must be s3")
    public_bucket = settings.OBJECT_STORAGE_BUCKET_NAME.strip()
    private_bucket = settings.MEDIA_OBJECT_STORAGE_BUCKET_NAME.strip()
    if not private_bucket:
        raise RuntimeError("MEDIA_OBJECT_STORAGE_BUCKET_NAME is required")
    if not public_bucket:
        raise RuntimeError("OBJECT_STORAGE_BUCKET_NAME is required")
    if private_bucket == public_bucket:
        raise RuntimeError(
            "MEDIA_OBJECT_STORAGE_BUCKET_NAME must be a separate private bucket"
        )
    if not args.source_base_url.startswith("https://"):
        raise RuntimeError("--source-base-url must use HTTPS")

    connection = await asyncpg.connect(normalized_database_url())
    try:
        references = await collect_references(connection)
        candidates: dict[tuple[str, bool], str] = {}
        for reference in references:
            private_media = is_private_media_reference(reference)
            key = source_path_for_url(reference.old_url, args.source_base_url)
            # An object already in the public bucket is a migration candidate
            # only when a protected reference must be moved out of it.
            if key is None and private_media:
                key = public_object_key_for_url(reference.old_url)
            if key:
                candidates.setdefault(
                    (reference.old_url, private_media),
                    key,
                )

        private_candidates = {
            candidate: key
            for candidate, key in candidates.items()
            if candidate[1]
        }
        public_candidates = {
            candidate: key
            for candidate, key in candidates.items()
            if not candidate[1]
        }
        public_reference_urls = {
            reference.old_url
            for reference in references
            if not is_private_media_reference(reference)
        }
        legacy_public_cleanup = sorted(
            {
                key
                for (old_url, _private), key in private_candidates.items()
                if public_object_key_for_url(old_url) == key
                and old_url not in public_reference_urls
            }
        )
        shared_public_objects = sorted(
            {
                key
                for (old_url, _private), key in private_candidates.items()
                if public_object_key_for_url(old_url) == key
                and old_url in public_reference_urls
            }
        )

        result = {
            "mode": "apply" if args.apply else "dry-run",
            "references_scanned": len(references),
            "unique_objects": len(candidates),
            "private_objects": len(private_candidates),
            "public_objects": len(public_candidates),
            "legacy_public_objects_to_delete": legacy_public_cleanup,
            "shared_public_object_conflicts": shared_public_objects,
            "deleted_legacy_public_objects": [],
            "migrated": [],
        }
        if not args.apply:
            return result
        if shared_public_objects:
            raise RuntimeError(
                "Protected media shares a public object with a public reference; "
                "separate or remove the public reference before apply"
            )
        if legacy_public_cleanup and not getattr(
            args,
            "delete_old_public_objects",
            False,
        ):
            raise RuntimeError(
                "Protected media still exists in the public bucket; rerun with "
                "--delete-old-public-objects after reviewing the dry-run manifest"
            )

        migrated: dict[tuple[str, bool], dict[str, object]] = {}
        async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
            for (old_url, private_media), key in candidates.items():
                migrated[(old_url, private_media)] = await migrate_url(
                    client,
                    old_url,
                    key,
                    args.source_base_url,
                    private_media=private_media,
                )

        await apply_database_updates(connection, references, migrated)
        remaining_references = await collect_references(connection)
        remaining = [
            reference.old_url
            for reference in remaining_references
            if (
                reference.old_url,
                is_private_media_reference(reference),
            )
            in candidates
        ]
        if remaining:
            raise RuntimeError(
                f"Database still contains {len(remaining)} legacy upload references"
            )

        # External object deletion happens only after the transaction committed
        # and after a fresh DB scan proved no URL column still references it.
        if legacy_public_cleanup:
            result["deleted_legacy_public_objects"] = await asyncio.to_thread(
                delete_public_objects,
                legacy_public_cleanup,
            )

        result["migrated"] = list(migrated.values())
        return result
    finally:
        await connection.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Copy legacy runtime uploads to object storage and update database URLs."
        )
    )
    parser.add_argument("--source-base-url", required=True)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument(
        "--delete-old-public-objects",
        action="store_true",
        help=(
            "After verified private copies and DB updates, delete exact protected "
            "legacy objects that have no remaining public DB reference."
        ),
    )
    parser.add_argument(
        "--manifest",
        default=str(
            Path(__file__).resolve().parents[2]
            / ".migration-state"
            / "object-storage-upload-migration.json"
        ),
    )
    args = parser.parse_args()

    result = asyncio.run(run(args))
    result["created_at_utc"] = datetime.now(timezone.utc).isoformat()
    result["columns"] = [asdict(source) for source in URL_COLUMNS]
    manifest = Path(args.manifest).resolve()
    manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest.write_text(
        json.dumps(result, indent=2, ensure_ascii=True),
        encoding="utf-8",
    )
    summary = {
        "mode": result["mode"],
        "references_scanned": result["references_scanned"],
        "unique_objects": result["unique_objects"],
        "manifest": str(manifest),
    }
    print(json.dumps(summary, ensure_ascii=True))


if __name__ == "__main__":
    main()
