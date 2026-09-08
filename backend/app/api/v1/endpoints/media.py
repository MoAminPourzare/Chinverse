"""Phase 5 education/media APIs.

Public routes never serialize provider URLs.  They mint an application-signed
gateway URL only after publication, license and entitlement checks.  Admin
routes own the draft/validate/publish/archive lifecycle for media, lessons,
courses and versioned subtitle tracks.
"""

from __future__ import annotations

from datetime import datetime
import hashlib
import hmac
import mimetypes
from pathlib import Path, PurePosixPath
import re
from typing import Any

from anyio import to_thread
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import FileResponse, Response, StreamingResponse
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.v1.endpoints.course_admin import _load_course
from app.api.errors import bad_request, forbidden, not_found, unauthorized
from app.api.rate_limit import write_rate_limit
from app.core.config import settings
from app.core.paths import UPLOADS_DIR
from app.core.storage import (
    iter_object_storage_body,
    object_storage_digest,
    open_object_storage_stream,
    read_object_storage_bytes,
)
from app.models.course import (
    Course,
    Lesson,
    PublicationStatus,
    SubtitleCue,
    SubtitleQualityStatus,
    SubtitleTrack,
)
from app.models.media import (
    MediaAccessAuditEvent,
    MediaAsset,
    MediaLicenseStatus,
    MediaPlaybackType,
    MediaPublicationStatus,
)
from app.schemas import course as course_schemas
from app.schemas import media as media_schemas
from app.services.media_workflow import (
    MediaResourceError,
    PlaybackTokenError,
    apply_subtitle_validation,
    hls_manifest_references,
    lesson_entitlement,
    media_resource_storage_key,
    normalize_media_resource,
    parse_srt_or_vtt,
    rewrite_hls_manifest,
    signed_playback_url,
    utc_now,
    validate_media_asset,
    validate_subtitle_track,
    verify_playback_signature,
)


router = APIRouter(tags=["education-media"])
MAX_HLS_MANIFEST_BYTES = 2 * 1024 * 1024
MAX_HLS_GRAPH_MANIFEST_BYTES = 8 * 1024 * 1024
MAX_HLS_GRAPH_MANIFESTS = 64
MAX_HLS_GRAPH_DEPTH = 8
MAX_HLS_GRAPH_RESOURCES = 4096
_SINGLE_BYTE_RANGE_RE = re.compile(r"bytes=(?:\d+-\d*|-\d+)")
_SAFE_PUBLIC_IMAGE_MIME_TYPES = {
    "image/avif",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
}


def _value(value: Any) -> str:
    return str(getattr(value, "value", value))


def _local_media_path(asset: MediaAsset, resource: str) -> Path | None:
    try:
        storage_key = media_resource_storage_key(asset.storage_key, resource)
    except MediaResourceError:
        return None
    parts = PurePosixPath(storage_key).parts
    if parts and parts[0] == "uploads":
        parts = parts[1:]
    candidate = Path(UPLOADS_DIR).joinpath(*parts).resolve()
    try:
        candidate.relative_to(Path(UPLOADS_DIR).resolve())
    except ValueError:
        return None
    return candidate


def _read_limited_file(path: Path, max_bytes: int) -> bytes:
    with path.open("rb") as handle:
        value = handle.read(max_bytes + 1)
    if len(value) > max_bytes:
        raise ValueError("File exceeds maximum allowed size")
    return value


def _local_file_digest(path: Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    size_bytes = 0
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
            size_bytes += len(chunk)
    return digest.hexdigest(), size_bytes


def _private_media_bucket() -> str:
    bucket = settings.MEDIA_OBJECT_STORAGE_BUCKET_NAME.strip()
    if not bucket:
        raise RuntimeError("Private media object storage is not configured")
    return bucket


async def _read_hls_manifest_resource(
    asset: MediaAsset,
    *,
    provider: str,
    resource: str,
) -> bytes:
    if provider == "s3":
        object_key = media_resource_storage_key(asset.storage_key, resource)
        try:
            value = await read_object_storage_bytes(
                object_key,
                max_bytes=MAX_HLS_MANIFEST_BYTES,
                bucket_name=_private_media_bucket(),
            )
        except ValueError as exc:
            raise bad_request("HLS manifest exceeds the allowed size") from exc
    else:
        path = _local_media_path(asset, resource)
        if not path or not path.exists() or not path.is_file():
            raise bad_request("HLS manifest dependency is missing")
        try:
            value = await to_thread.run_sync(
                _read_limited_file,
                path,
                MAX_HLS_MANIFEST_BYTES,
            )
        except (OSError, ValueError) as exc:
            raise bad_request("HLS manifest dependency cannot be verified") from exc
    if not value:
        raise bad_request("HLS manifest dependency is empty")
    return value


async def _verify_hls_resource_has_bytes(
    asset: MediaAsset,
    *,
    provider: str,
    resource: str,
) -> None:
    if provider == "s3":
        object_key = media_resource_storage_key(asset.storage_key, resource)
        stream = await open_object_storage_stream(
            object_key,
            byte_range="bytes=0-0",
            bucket_name=_private_media_bucket(),
        )
        try:
            first_byte = await to_thread.run_sync(stream.body.read, 1)
        finally:
            await to_thread.run_sync(stream.body.close)
        if not first_byte:
            raise bad_request("HLS media dependency is empty")
        return

    path = _local_media_path(asset, resource)
    try:
        exists_with_bytes = bool(path and path.is_file() and path.stat().st_size > 0)
    except OSError as exc:
        raise bad_request("HLS media dependency cannot be verified") from exc
    if not exists_with_bytes:
        raise bad_request("HLS media dependency is missing or empty")


async def _verify_hls_graph(
    asset: MediaAsset,
    *,
    provider: str,
    root_manifest: bytes,
) -> None:
    """Walk a bounded playlist graph and prove every referenced object exists."""
    queue: list[tuple[str, bytes, int]] = [("", root_manifest, 0)]
    checked_resources: set[str] = set()
    checked_manifests: set[str] = {""}
    manifest_count = 1
    total_manifest_bytes = len(root_manifest)

    while queue:
        current_resource, manifest_bytes, depth = queue.pop(0)
        try:
            manifest = manifest_bytes.decode("utf-8-sig")
            references = hls_manifest_references(
                manifest,
                current_resource=current_resource,
            )
        except (UnicodeDecodeError, MediaResourceError) as exc:
            raise bad_request("HLS manifest graph is invalid") from exc

        for reference in references:
            first_seen = reference.path not in checked_resources
            if first_seen and len(checked_resources) >= MAX_HLS_GRAPH_RESOURCES:
                raise bad_request("HLS manifest graph has too many resources")
            checked_resources.add(reference.path)

            if reference.is_manifest and not reference.path.lower().endswith(".m3u8"):
                raise bad_request("HLS child playlists must use the .m3u8 extension")
            is_manifest = reference.is_manifest or reference.path.lower().endswith(".m3u8")
            if not is_manifest:
                if not first_seen:
                    continue
                await _verify_hls_resource_has_bytes(
                    asset,
                    provider=provider,
                    resource=reference.path,
                )
                continue

            if reference.path in checked_manifests:
                continue
            checked_manifests.add(reference.path)
            if depth + 1 > MAX_HLS_GRAPH_DEPTH:
                raise bad_request("HLS manifest graph is too deep")
            if manifest_count >= MAX_HLS_GRAPH_MANIFESTS:
                raise bad_request("HLS manifest graph has too many playlists")
            child_manifest = await _read_hls_manifest_resource(
                asset,
                provider=provider,
                resource=reference.path,
            )
            manifest_count += 1
            total_manifest_bytes += len(child_manifest)
            if total_manifest_bytes > MAX_HLS_GRAPH_MANIFEST_BYTES:
                raise bad_request("HLS manifest graph is too large")
            queue.append((reference.path, child_manifest, depth + 1))


async def _verify_media_storage_for_publish(asset: MediaAsset) -> None:
    """Fail closed unless registered bytes exist and match their immutable digest."""
    try:
        object_key = media_resource_storage_key(asset.storage_key)
    except MediaResourceError as exc:
        raise bad_request("Media storage key is invalid") from exc

    provider = str(asset.storage_provider or "").strip().lower()
    manifest_bytes: bytes | None = None
    if provider == "s3":
        stored = await object_storage_digest(
            object_key,
            bucket_name=_private_media_bucket(),
        )
        actual_checksum = stored.checksum_sha256
        actual_size = stored.size_bytes
        if _value(asset.playback_type) == MediaPlaybackType.HLS.value:
            try:
                manifest_bytes = await read_object_storage_bytes(
                    object_key,
                    max_bytes=MAX_HLS_MANIFEST_BYTES,
                    bucket_name=_private_media_bucket(),
                )
            except ValueError as exc:
                raise bad_request("HLS manifest exceeds the allowed size") from exc
    elif provider in {"local", "mounted"}:
        path = _local_media_path(asset, "")
        if not path or not path.exists() or not path.is_file():
            raise bad_request("Media storage object is missing")
        try:
            actual_checksum, actual_size = await to_thread.run_sync(_local_file_digest, path)
            if _value(asset.playback_type) == MediaPlaybackType.HLS.value:
                manifest_bytes = await to_thread.run_sync(
                    _read_limited_file,
                    path,
                    MAX_HLS_MANIFEST_BYTES,
                )
        except (OSError, ValueError) as exc:
            raise bad_request("Media storage object cannot be verified") from exc
    else:
        raise bad_request("Media storage provider is invalid")

    expected_checksum = str(asset.checksum_sha256 or "").lower()
    if not hmac.compare_digest(expected_checksum, actual_checksum.lower()):
        raise bad_request("Media checksum does not match stored bytes")
    if asset.file_size_bytes is not None and int(asset.file_size_bytes) != actual_size:
        raise bad_request("Media size does not match stored bytes")

    if _value(asset.playback_type) == MediaPlaybackType.HLS.value:
        if manifest_bytes is None:
            raise bad_request("HLS manifest is missing")
        await _verify_hls_graph(
            asset,
            provider=provider,
            root_manifest=manifest_bytes,
        )


def _resource_media_type(asset: MediaAsset, resource: str) -> str:
    target = resource or asset.storage_key
    guessed, _encoding = mimetypes.guess_type(target)
    if target.lower().endswith(".ts"):
        return "video/mp2t"
    if target.lower().endswith(".m4s"):
        return "video/iso.segment"
    return guessed or asset.mime_type or "application/octet-stream"


def _subtitle_response(track: SubtitleTrack) -> dict[str, Any]:
    return {
        "id": track.id,
        "lesson_id": track.lesson_id,
        "language": track.language,
        "format": track.format,
        "version": track.revision,
        "status": _value(track.status),
        "quality_status": _value(track.quality_status),
        "quality_score": track.quality_score,
        "quality_report": track.quality_report or {},
        "checksum_sha256": track.checksum_sha256,
        "source_name": track.source_name,
        "cues": [
            {
                "id": cue.id,
                "start": cue.timestamp_start,
                "end": cue.timestamp_end,
                "zh_text": cue.zh_text,
                "pinyin": cue.pinyin,
                "target_text": cue.target_text,
                "highlighted_words": cue.highlighted_words or [],
            }
            for cue in sorted(track.cues or [], key=lambda item: (item.cue_index, item.id))
        ],
        "created_at": track.created_at,
        "updated_at": track.updated_at,
    }


async def _load_track(db: AsyncSession, track_id: int) -> SubtitleTrack:
    result = await db.execute(
        select(SubtitleTrack)
        .options(selectinload(SubtitleTrack.cues))
        .where(SubtitleTrack.id == track_id)
    )
    track = result.scalar_one_or_none()
    if not track:
        raise not_found("Subtitle track")
    return track


async def _load_published_lesson_media(
    db: AsyncSession,
    *,
    lesson_id: int,
    media_id: int | None = None,
) -> tuple[Lesson, MediaAsset] | None:
    query = (
        select(Lesson, MediaAsset)
        .join(Course, Course.id == Lesson.course_id)
        .join(MediaAsset, MediaAsset.id == Lesson.media_id)
        .where(
            Lesson.id == lesson_id,
            Lesson.status == PublicationStatus.PUBLISHED,
            Course.status == PublicationStatus.PUBLISHED,
            MediaAsset.status == MediaPublicationStatus.PUBLISHED,
            MediaAsset.license_status == MediaLicenseStatus.APPROVED,
            MediaAsset.media_type == "video",
        )
    )
    if media_id is not None:
        query = query.where(MediaAsset.id == media_id)
    row = (await db.execute(query)).one_or_none()
    if not row:
        return None
    return row[0], row[1]


async def _lesson_duration_seconds(db: AsyncSession, lesson: Lesson) -> float | None:
    if lesson.media_id:
        asset = await db.get(MediaAsset, lesson.media_id)
        if asset and asset.duration_seconds is not None:
            return float(asset.duration_seconds)
    fallback = float(lesson.duration_minutes or 0) * 60
    return fallback or None


async def _is_published_public_image_use(db: AsyncSession, media_id: int) -> bool:
    cover = await db.scalar(
        select(Course.id)
        .where(
            Course.status == PublicationStatus.PUBLISHED,
            Course.cover_media_id == media_id,
        )
        .limit(1)
    )
    if cover is not None:
        return True
    poster = await db.scalar(
        select(Lesson.id)
        .join(Course, Course.id == Lesson.course_id)
        .where(
            Course.status == PublicationStatus.PUBLISHED,
            Lesson.status == PublicationStatus.PUBLISHED,
            Lesson.poster_media_id == media_id,
        )
        .limit(1)
    )
    return poster is not None


async def _record_access(
    db: AsyncSession,
    *,
    action: str,
    outcome: str,
    reason: str,
    media_id: int | None,
    lesson_id: int | None,
    user_id: int | None,
    expires_at: datetime | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    db.add(
        MediaAccessAuditEvent(
            media_id=media_id,
            lesson_id=lesson_id,
            user_id=user_id,
            action=action,
            outcome=outcome,
            reason=reason,
            token_expires_at=expires_at,
            metadata_json=metadata or {},
        )
    )


async def _published_subtitles(db: AsyncSession, lesson_id: int) -> list[SubtitleTrack]:
    result = await db.execute(
        select(SubtitleTrack)
        .options(selectinload(SubtitleTrack.cues))
        .where(
            SubtitleTrack.lesson_id == lesson_id,
            SubtitleTrack.status == PublicationStatus.PUBLISHED,
            SubtitleTrack.quality_status == SubtitleQualityStatus.VALID,
        )
        .order_by(SubtitleTrack.language, SubtitleTrack.revision.desc())
    )
    return list(result.scalars().unique().all())


@router.get(
    "/courses/lessons/{lesson_id}/playback",
    response_model=media_schemas.LessonPlaybackResponse,
)
async def lesson_playback(
    lesson_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_optional_session_user),
) -> Any:
    pair = await _load_published_lesson_media(db, lesson_id=lesson_id)
    user_id = int(current_user.id) if current_user else None
    if not pair:
        # Do not turn anonymous ID enumeration into unbounded database or log
        # writes. A bounded metric can be added at the edge in Phase 7.
        raise not_found("Published lesson media")

    lesson, asset = pair
    asset_validation = validate_media_asset(asset)
    if not asset_validation.valid:
        if user_id is not None:
            await _record_access(
                db,
                action="issue",
                outcome="denied",
                reason="media_validation_failed",
                media_id=asset.id,
                lesson_id=lesson.id,
                user_id=user_id,
                metadata={"errors": list(asset_validation.errors)},
            )
            await db.commit()
        raise not_found("Published lesson media")

    required, granted, reason, subject_id = await lesson_entitlement(db, lesson, user_id)
    if not granted:
        if user_id is not None:
            await _record_access(
                db,
                action="issue",
                outcome="denied",
                reason=reason,
                media_id=asset.id,
                lesson_id=lesson.id,
                user_id=user_id,
            )
            await db.commit()
        if reason == "login_required":
            raise unauthorized("Login is required for this lesson")
        raise forbidden("An active subscription is required for this lesson")

    playback_url, expires_at = signed_playback_url(
        base_path=f"{settings.API_V1_STR}/media/assets/{asset.id}/content",
        media_id=asset.id,
        lesson_id=lesson.id,
        subject_id=subject_id,
    )
    poster_url: str | None = None
    if lesson.poster_media_id:
        poster = await db.get(MediaAsset, lesson.poster_media_id)
        if (
            poster
            and _value(poster.media_type) == "image"
            and _value(poster.status) == MediaPublicationStatus.PUBLISHED.value
            and _value(poster.license_status) == MediaLicenseStatus.APPROVED.value
            and validate_media_asset(poster).valid
        ):
            poster_url = f"{settings.API_V1_STR}/media/public-images/{poster.id}"
    subtitles = await _published_subtitles(db, lesson.id)
    if user_id is not None:
        await _record_access(
            db,
            action="issue",
            outcome="granted",
            reason=reason,
            media_id=asset.id,
            lesson_id=lesson.id,
            user_id=user_id,
            expires_at=expires_at,
        )
        await db.commit()

    return {
        "lesson": {
            "id": lesson.id,
            "course_id": lesson.course_id,
            "section_id": lesson.section_id,
            "title": lesson.title,
            "duration_seconds": asset.duration_seconds
            if asset.duration_seconds is not None
            else float(lesson.duration_minutes or 0) * 60,
            "is_free": bool(lesson.is_free),
        },
        "media": {
            "id": asset.id,
            "playback_url": playback_url,
            "playback_type": "hls"
            if _value(asset.playback_type) == MediaPlaybackType.HLS.value
            else "mp4",
            "poster_url": poster_url,
            "expires_at": expires_at,
        },
        "entitlement": {
            "required": required,
            "granted": True,
            "reason": reason,
        },
        "subtitles": [_subtitle_response(track) for track in subtitles],
    }


@router.get("/media/public-images/{media_id}")
async def resolve_public_image(
    media_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Stream a published licensed course cover/poster without provider URLs."""
    asset = await db.get(MediaAsset, media_id)
    safe_mime = str(asset.mime_type or "").strip().lower() if asset else ""
    if (
        not asset
        or _value(asset.media_type) != "image"
        or _value(asset.status) != MediaPublicationStatus.PUBLISHED.value
        or _value(asset.license_status) != MediaLicenseStatus.APPROVED.value
        or not validate_media_asset(asset).valid
        or safe_mime not in _SAFE_PUBLIC_IMAGE_MIME_TYPES
        or not await _is_published_public_image_use(db, media_id)
    ):
        raise not_found("Published media")

    headers = {
        "Cache-Control": "public, max-age=300, must-revalidate",
        "X-Content-Type-Options": "nosniff",
    }
    provider = str(asset.storage_provider or "").strip().lower()
    if provider == "s3":
        stream = await open_object_storage_stream(
            media_resource_storage_key(asset.storage_key),
            bucket_name=_private_media_bucket(),
        )
        stream_headers = dict(headers)
        if stream.content_length is not None:
            stream_headers["Content-Length"] = str(stream.content_length)
        if stream.etag:
            stream_headers["ETag"] = stream.etag
        return StreamingResponse(
            iter_object_storage_body(stream.body),
            # Never trust provider metadata for a same-origin public response.
            media_type=safe_mime,
            headers=stream_headers,
        )

    path = _local_media_path(asset, "")
    if not path or not path.exists() or not path.is_file():
        raise not_found("Published media")
    return FileResponse(
        path,
        media_type=safe_mime,
        headers=headers,
    )


@router.get("/media/assets/{media_id}/content")
async def resolve_media_content(
    media_id: int,
    lesson_id: int = Query(ge=0),
    subject_id: int = Query(ge=0),
    expires: int = Query(gt=0),
    signature: str = Query(min_length=20, max_length=200),
    resource: str = Query(default="", max_length=1000),
    range_header: str | None = Header(default=None, alias="Range"),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    try:
        resource = normalize_media_resource(resource)
        verify_playback_signature(
            media_id=media_id,
            lesson_id=lesson_id,
            subject_id=subject_id,
            expires=expires,
            signature=signature,
            resource_path=resource,
        )
    except (MediaResourceError, PlaybackTokenError) as exc:
        reason = getattr(exc, "reason", str(exc) or "invalid_resource")
        # Invalid public tokens are attacker-controlled. Keep them out of both
        # relational audit and per-request logs to avoid write amplification.
        raise forbidden("Playback token is invalid or expired") from exc

    # Browser media elements cannot attach the API bearer to HLS subrequests.
    # The short-lived signature is therefore the credential. Its subject is
    # trusted only after HMAC verification, and entitlement is rechecked below
    # for every manifest, key, init fragment, and segment request.
    user_id = subject_id or None

    lesson: Lesson | None = None
    if lesson_id == 0:
        # Course covers/posters use the same signed gateway, but do not have
        # lesson entitlement.  They still require published + approved media.
        asset = await db.get(MediaAsset, media_id)
        if (
            not asset
            or _value(asset.media_type) != "image"
            or _value(asset.status) != MediaPublicationStatus.PUBLISHED.value
            or _value(asset.license_status) != MediaLicenseStatus.APPROVED.value
            or not validate_media_asset(asset).valid
            or subject_id != 0
            or not await _is_published_public_image_use(db, media_id)
        ):
            raise not_found("Published media")
        reason = "published_cover"
    else:
        pair = await _load_published_lesson_media(
            db,
            lesson_id=lesson_id,
            media_id=media_id,
        )
        if not pair:
            raise not_found("Published lesson media")
        lesson, asset = pair
        if not validate_media_asset(asset).valid:
            raise not_found("Published lesson media")

        _required, granted, reason, expected_subject = await lesson_entitlement(db, lesson, user_id)
        if not granted or expected_subject != subject_id:
            await _record_access(
                db,
                action="resolve",
                outcome="denied",
                reason=reason,
                media_id=asset.id,
                lesson_id=lesson.id,
                user_id=user_id,
            )
            await db.commit()
            raise forbidden("Playback entitlement is no longer active")

    provider = (asset.storage_provider or "").strip().lower()
    playback_type = _value(asset.playback_type)
    if playback_type != MediaPlaybackType.HLS.value and resource:
        raise not_found("Media file")
    try:
        object_key = media_resource_storage_key(asset.storage_key, resource)
    except MediaResourceError as exc:
        raise not_found("Media file") from exc

    is_manifest = playback_type == MediaPlaybackType.HLS.value and (
        not resource or resource.lower().endswith(".m3u8")
    )
    common_headers = {
        "Cache-Control": "private, no-store",
        "Pragma": "no-cache",
        "X-Content-Type-Options": "nosniff",
    }
    response: Response
    if is_manifest:
        try:
            if provider == "s3":
                manifest_bytes = await read_object_storage_bytes(
                    object_key,
                    max_bytes=MAX_HLS_MANIFEST_BYTES,
                    bucket_name=_private_media_bucket(),
                )
            else:
                path = _local_media_path(asset, resource)
                if not path or not path.exists() or not path.is_file():
                    raise not_found("Media file")
                manifest_bytes = await to_thread.run_sync(
                    _read_limited_file,
                    path,
                    MAX_HLS_MANIFEST_BYTES,
                )
            manifest = manifest_bytes.decode("utf-8-sig")
            rewritten = rewrite_hls_manifest(
                manifest,
                # Relative URIs keep browser subrequests on the frontend BFF
                # after it maps the initial /api/v1 URL to /api/backend.
                base_path="./content",
                media_id=asset.id,
                lesson_id=lesson_id,
                subject_id=subject_id,
                expires=expires,
                current_resource=resource,
            )
        except (UnicodeDecodeError, ValueError, MediaResourceError) as exc:
            raise not_found("Media manifest") from exc
        response = Response(
            content=rewritten,
            media_type="application/vnd.apple.mpegurl",
            headers=common_headers,
        )
    elif provider == "s3":
        normalized_range = range_header.strip() if range_header else None
        if normalized_range and not _SINGLE_BYTE_RANGE_RE.fullmatch(normalized_range):
            raise HTTPException(status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE)
        stream = await open_object_storage_stream(
            object_key,
            byte_range=normalized_range,
            bucket_name=_private_media_bucket(),
        )
        stream_headers = dict(common_headers)
        stream_headers["Accept-Ranges"] = "bytes"
        if stream.content_length is not None:
            stream_headers["Content-Length"] = str(stream.content_length)
        if stream.content_range:
            stream_headers["Content-Range"] = stream.content_range
        if stream.etag:
            stream_headers["ETag"] = stream.etag
        response = StreamingResponse(
            iter_object_storage_body(stream.body),
            status_code=status.HTTP_206_PARTIAL_CONTENT if stream.content_range else status.HTTP_200_OK,
            media_type=stream.content_type or _resource_media_type(asset, resource),
            headers=stream_headers,
        )
    else:
        path = _local_media_path(asset, resource)
        if not path or not path.exists() or not path.is_file():
            raise not_found("Media file")
        response = FileResponse(
            path,
            media_type=_resource_media_type(asset, resource),
            headers=common_headers,
        )

    # A single HLS play can resolve hundreds of segments. Successful issuance
    # is already audited once; per-segment rows would amplify normal playback
    # into hundreds of Neon writes.
    return response


async def _get_media(db: AsyncSession, media_id: int) -> MediaAsset:
    asset = await db.get(MediaAsset, media_id)
    if not asset:
        raise not_found("Media asset")
    return asset


@router.get(
    "/media/admin/assets/{media_id}",
    response_model=media_schemas.MediaAssetRead,
)
async def get_admin_media_asset(
    media_id: int,
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_admin_user),
) -> Any:
    """Recover an existing asset so an interrupted admin workflow can resume."""
    return await _get_media(db, media_id)


@router.post(
    "/media/admin/assets",
    response_model=media_schemas.MediaAssetRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(write_rate_limit)],
)
async def register_media_asset(
    payload: media_schemas.MediaAssetCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
) -> Any:
    asset = MediaAsset(
        user_id=current_user.id,
        **payload.model_dump(),
        status=MediaPublicationStatus.DRAFT,
        license_status=MediaLicenseStatus.PENDING,
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


@router.patch(
    "/media/admin/assets/{media_id}",
    response_model=media_schemas.MediaAssetRead,
    dependencies=[Depends(write_rate_limit)],
)
async def update_media_asset(
    media_id: int,
    payload: media_schemas.MediaAssetUpdate,
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_admin_user),
) -> Any:
    asset = await _get_media(db, media_id)
    changes = payload.model_dump(exclude_unset=True)
    sensitive = {
        "checksum_sha256",
        "source_name",
        "source_url",
        "rights_holder",
        "license_type",
        "license_url",
    }
    for key, value in changes.items():
        setattr(asset, key, value)
    if sensitive.intersection(changes):
        asset.license_status = MediaLicenseStatus.PENDING
        asset.license_reviewed_at = None
        asset.license_reviewed_by_id = None
    if changes:
        asset.status = MediaPublicationStatus.DRAFT
        asset.published_at = None
        asset.published_by_id = None
        asset.revision += 1
    await db.commit()
    await db.refresh(asset)
    return asset


@router.post(
    "/media/admin/assets/{media_id}/license-review",
    response_model=media_schemas.MediaAssetRead,
    dependencies=[Depends(write_rate_limit)],
)
async def review_media_license(
    media_id: int,
    payload: media_schemas.MediaLicenseReview,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
) -> Any:
    asset = await _get_media(db, media_id)
    asset.license_status = payload.status
    asset.license_notes = payload.notes
    asset.license_reviewed_at = utc_now()
    asset.license_reviewed_by_id = current_user.id
    if payload.status == MediaLicenseStatus.APPROVED.value:
        validation = validate_media_asset(asset)
        errors = [error for error in validation.errors if error != "license_not_approved"]
        if errors:
            raise bad_request("Media license cannot be approved: " + ", ".join(errors))
    else:
        asset.status = MediaPublicationStatus.DRAFT
    await db.commit()
    await db.refresh(asset)
    return asset


@router.post(
    "/media/admin/assets/{media_id}/publish",
    response_model=media_schemas.MediaAssetRead,
    dependencies=[Depends(write_rate_limit)],
)
async def publish_media_asset(
    media_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
) -> Any:
    asset = await _get_media(db, media_id)
    validation = validate_media_asset(asset)
    if not validation.valid:
        raise bad_request("Media is not publishable: " + ", ".join(validation.errors))
    await _verify_media_storage_for_publish(asset)
    asset.status = MediaPublicationStatus.PUBLISHED
    asset.published_at = utc_now()
    asset.published_by_id = current_user.id
    await db.commit()
    await db.refresh(asset)
    return asset


@router.post(
    "/media/admin/assets/{media_id}/archive",
    response_model=media_schemas.MediaAssetRead,
    dependencies=[Depends(write_rate_limit)],
)
async def archive_media_asset(
    media_id: int,
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_admin_user),
) -> Any:
    asset = await _get_media(db, media_id)
    asset.status = MediaPublicationStatus.ARCHIVED
    await db.commit()
    await db.refresh(asset)
    return asset


@router.post(
    "/courses/admin/lessons/{lesson_id}/subtitle-tracks",
    response_model=media_schemas.SubtitleTrackRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(write_rate_limit)],
)
async def create_subtitle_track(
    lesson_id: int,
    payload: media_schemas.SubtitleTrackCreate,
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_admin_user),
) -> Any:
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise not_found("Lesson")
    latest_revision = await db.scalar(
        select(func.max(SubtitleTrack.revision)).where(
            SubtitleTrack.lesson_id == lesson.id,
            SubtitleTrack.language == payload.language,
        )
    )
    previous = await db.scalar(
        select(SubtitleTrack.id)
        .where(
            SubtitleTrack.lesson_id == lesson.id,
            SubtitleTrack.language == payload.language,
        )
        .order_by(SubtitleTrack.revision.desc())
        .limit(1)
    )
    if payload.format in {"srt", "vtt"}:
        cue_rows = parse_srt_or_vtt(payload.content or "", payload.format)
    else:
        cue_rows = [
            {
                "cue_index": index,
                "timestamp_start": cue.start,
                "timestamp_end": cue.end,
                "zh_text": cue.zh_text,
                "pinyin": cue.pinyin,
                "target_text": cue.target_text,
                "highlighted_words": cue.highlighted_words,
            }
            for index, cue in enumerate(payload.cues)
        ]
    track = SubtitleTrack(
        lesson_id=lesson.id,
        language=payload.language,
        format=payload.format,
        revision=int(latest_revision or 0) + 1,
        supersedes_id=previous,
        status=PublicationStatus.DRAFT,
        quality_status=SubtitleQualityStatus.PENDING,
        source_name=payload.source_name,
    )
    track.cues = [
        SubtitleCue(
            cue_index=int(cue["cue_index"]),
            timestamp_start=float(cue["timestamp_start"]),
            timestamp_end=float(cue["timestamp_end"]),
            zh_text=str(cue.get("zh_text") or ""),
            pinyin=str(cue.get("pinyin") or ""),
            target_text=str(cue.get("target_text") or ""),
            highlighted_words=list(cue.get("highlighted_words") or []),
        )
        for cue in cue_rows
    ]
    db.add(track)
    await db.flush()
    apply_subtitle_validation(
        track,
        validate_subtitle_track(
            track,
            duration_seconds=await _lesson_duration_seconds(db, lesson),
        ),
    )
    await db.commit()
    return _subtitle_response(await _load_track(db, track.id))


@router.post(
    "/courses/admin/subtitle-tracks/{track_id}/validate",
    response_model=media_schemas.SubtitleTrackRead,
    dependencies=[Depends(write_rate_limit)],
)
async def validate_track(
    track_id: int,
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_admin_user),
) -> Any:
    track = await _load_track(db, track_id)
    lesson = await db.get(Lesson, track.lesson_id)
    if not lesson:
        raise not_found("Lesson")
    apply_subtitle_validation(
        track,
        validate_subtitle_track(
            track,
            duration_seconds=await _lesson_duration_seconds(db, lesson),
        ),
    )
    await db.commit()
    return _subtitle_response(await _load_track(db, track.id))


@router.post(
    "/courses/admin/subtitle-tracks/{track_id}/publish",
    response_model=media_schemas.SubtitleTrackRead,
    dependencies=[Depends(write_rate_limit)],
)
async def publish_track(
    track_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
) -> Any:
    track = await _load_track(db, track_id)
    lesson = await db.get(Lesson, track.lesson_id)
    if not lesson or _value(lesson.status) != PublicationStatus.PUBLISHED.value:
        raise bad_request("Lesson must be published before its subtitles")
    result = validate_subtitle_track(
        track,
        duration_seconds=await _lesson_duration_seconds(db, lesson),
    )
    apply_subtitle_validation(track, result)
    if not result.valid:
        raise bad_request("Subtitle track is not publishable: " + ", ".join(result.errors))
    await db.execute(
        update(SubtitleTrack)
        .where(
            SubtitleTrack.lesson_id == track.lesson_id,
            SubtitleTrack.language == track.language,
            SubtitleTrack.status == PublicationStatus.PUBLISHED,
            SubtitleTrack.id != track.id,
        )
        .values(status=PublicationStatus.ARCHIVED)
    )
    track.status = PublicationStatus.PUBLISHED
    track.published_at = utc_now()
    track.published_by_id = current_user.id
    await db.commit()
    return _subtitle_response(await _load_track(db, track.id))


@router.post(
    "/courses/admin/subtitle-tracks/{track_id}/archive",
    response_model=media_schemas.SubtitleTrackRead,
    dependencies=[Depends(write_rate_limit)],
)
async def archive_track(
    track_id: int,
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_admin_user),
) -> Any:
    track = await _load_track(db, track_id)
    track.status = PublicationStatus.ARCHIVED
    await db.commit()
    return _subtitle_response(await _load_track(db, track.id))


@router.patch(
    "/courses/admin/lessons/{lesson_id}",
    response_model=course_schemas.Lesson,
    dependencies=[Depends(write_rate_limit)],
)
async def update_lesson_workflow(
    lesson_id: int,
    payload: media_schemas.LessonWorkflowUpdate,
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_admin_user),
) -> Any:
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise not_found("Lesson")
    changes = payload.model_dump(exclude_unset=True)
    if "media_id" in changes and changes["media_id"] is not None:
        media = await _get_media(db, changes["media_id"])
        if _value(media.media_type) != "video":
            raise bad_request("Lesson media must be a video asset")
        lesson.video_url = media.file_url
    if "poster_media_id" in changes:
        poster_id = changes["poster_media_id"]
        if poster_id is None:
            lesson.thumbnail_url = None
        else:
            poster = await _get_media(db, poster_id)
            if _value(poster.media_type) != "image":
                raise bad_request("Lesson poster must be an image asset")
            lesson.thumbnail_url = poster.file_url
    for key, value in changes.items():
        setattr(lesson, key, value)
    if changes:
        if "media_id" in changes:
            await db.execute(
                update(SubtitleTrack)
                .where(
                    SubtitleTrack.lesson_id == lesson.id,
                    SubtitleTrack.status == PublicationStatus.PUBLISHED,
                )
                .values(status=PublicationStatus.ARCHIVED)
            )
        lesson.status = PublicationStatus.DRAFT
        lesson.published_at = None
        lesson.published_by_id = None
        lesson.revision += 1
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.post(
    "/courses/admin/lessons/{lesson_id}/publish",
    response_model=course_schemas.Lesson,
    dependencies=[Depends(write_rate_limit)],
)
async def publish_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
) -> Any:
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise not_found("Lesson")
    if not lesson.media_id:
        raise bad_request("Lesson requires a media asset")
    asset = await _get_media(db, lesson.media_id)
    if _value(asset.media_type) != "video":
        raise bad_request("Lesson media must be a video asset")
    if _value(asset.status) != MediaPublicationStatus.PUBLISHED.value:
        raise bad_request("Lesson media must be published")
    validation = validate_media_asset(asset)
    if not validation.valid:
        raise bad_request("Lesson media is not valid: " + ", ".join(validation.errors))
    if lesson.poster_media_id:
        poster = await _get_media(db, lesson.poster_media_id)
        if _value(poster.media_type) != "image":
            raise bad_request("Lesson poster must be an image asset")
        if (
            _value(poster.status) != MediaPublicationStatus.PUBLISHED.value
            or not validate_media_asset(poster).valid
        ):
            raise bad_request("Lesson poster media must be licensed and published")
    lesson.status = PublicationStatus.PUBLISHED
    lesson.published_at = utc_now()
    lesson.published_by_id = current_user.id
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.post(
    "/courses/admin/lessons/{lesson_id}/archive",
    response_model=course_schemas.Lesson,
    dependencies=[Depends(write_rate_limit)],
)
async def archive_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_admin_user),
) -> Any:
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise not_found("Lesson")
    lesson.status = PublicationStatus.ARCHIVED
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.post(
    "/courses/admin/courses/{course_id}/publish",
    response_model=course_schemas.Course,
    dependencies=[Depends(write_rate_limit)],
)
async def publish_course(
    course_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
) -> Any:
    course = await db.get(Course, course_id)
    if not course:
        raise not_found("Course")
    if not course.cover_media_id:
        raise bad_request("Course requires a registered cover media asset")
    cover = await _get_media(db, course.cover_media_id)
    if _value(cover.media_type) != "image":
        raise bad_request("Course cover media must be an image asset")
    if _value(cover.status) != MediaPublicationStatus.PUBLISHED.value or not validate_media_asset(cover).valid:
        raise bad_request("Course cover media must be licensed and published")
    course.status = PublicationStatus.PUBLISHED
    course.published_at = utc_now()
    course.published_by_id = current_user.id
    await db.commit()
    # Response validation is synchronous: preload sections and lessons rather
    # than triggering async lazy loads after the successful commit.
    return await _load_course(db, course_id)


@router.post(
    "/courses/admin/courses/{course_id}/archive",
    response_model=course_schemas.Course,
    dependencies=[Depends(write_rate_limit)],
)
async def archive_course(
    course_id: int,
    db: AsyncSession = Depends(deps.get_db),
    _current_user=Depends(deps.get_current_admin_user),
) -> Any:
    course = await db.get(Course, course_id)
    if not course:
        raise not_found("Course")
    course.status = PublicationStatus.ARCHIVED
    await db.commit()
    return await _load_course(db, course_id)
