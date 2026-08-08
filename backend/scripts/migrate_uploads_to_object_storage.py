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


def validate_url_column(source: UrlColumn) -> None:
    if source not in URL_COLUMNS:
        raise ValueError("Unsupported upload URL column")
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


def upload_and_verify(path: Path, key: str, content_type: str, size_bytes: int) -> None:
    client = get_object_storage_client()
    client.upload_file(
        str(path),
        settings.OBJECT_STORAGE_BUCKET_NAME,
        key,
        ExtraArgs={
            "ContentType": content_type,
            "CacheControl": CACHE_CONTROL_IMMUTABLE,
        },
    )
    metadata = client.head_object(
        Bucket=settings.OBJECT_STORAGE_BUCKET_NAME,
        Key=key,
    )
    if int(metadata["ContentLength"]) != size_bytes:
        raise RuntimeError(f"Object storage size verification failed for {key}")


async def migrate_url(
    client: httpx.AsyncClient,
    old_url: str,
    key: str,
    source_base_url: str,
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
        await asyncio.to_thread(
            upload_and_verify,
            path,
            key,
            content_type,
            size_bytes,
        )
    finally:
        path.unlink(missing_ok=True)

    return {
        "old_url": old_url,
        "new_url": f"{settings.OBJECT_STORAGE_PUBLIC_BASE_URL.rstrip('/')}/{key}",
        "storage_key": key,
        "content_type": content_type,
        "size_bytes": size_bytes,
        "sha256": sha256,
    }


async def apply_database_updates(
    connection: asyncpg.Connection,
    references: list[Reference],
    migrated: dict[str, dict[str, object]],
) -> None:
    async with connection.transaction():
        for reference in references:
            item = migrated.get(reference.old_url)
            if not item:
                continue
            source = reference.source
            validate_url_column(source)
            # Identifiers are constrained to URL_COLUMNS; values remain parameterized.
            await connection.execute(
                f'UPDATE "{source.table}" SET "{source.column}" = $1 '  # nosec B608
                f'WHERE "{source.primary_key}" = $2 AND "{source.column}" = $3',
                item["new_url"],
                reference.row_id,
                reference.old_url,
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


async def run(args: argparse.Namespace) -> dict[str, object]:
    if settings.FILE_STORAGE_MODE != "s3":
        raise RuntimeError("FILE_STORAGE_MODE must be s3")
    if not args.source_base_url.startswith("https://"):
        raise RuntimeError("--source-base-url must use HTTPS")

    connection = await asyncpg.connect(normalized_database_url())
    try:
        references = await collect_references(connection)
        candidates = {}
        for reference in references:
            key = source_path_for_url(reference.old_url, args.source_base_url)
            if key:
                candidates.setdefault(reference.old_url, key)

        result = {
            "mode": "apply" if args.apply else "dry-run",
            "references_scanned": len(references),
            "unique_objects": len(candidates),
            "migrated": [],
        }
        if not args.apply:
            return result

        migrated = {}
        async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
            for old_url, key in candidates.items():
                migrated[old_url] = await migrate_url(
                    client,
                    old_url,
                    key,
                    args.source_base_url,
                )

        await apply_database_updates(connection, references, migrated)
        remaining = [
            reference.old_url
            for reference in await collect_references(connection)
            if source_path_for_url(reference.old_url, args.source_base_url)
        ]
        if remaining:
            raise RuntimeError(
                f"Database still contains {len(remaining)} legacy upload references"
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
