"""Education/media publication, subtitle quality, entitlement and URL signing.

The service deliberately keeps provider URLs inside the database. Public API
responses only contain an app-signed gateway URL. A gateway request verifies
the token and re-checks the current publication/license/entitlement state
before resolving a local file or creating a provider presigned URL.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import posixpath
import re
import time
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import PurePosixPath
from typing import Any, Iterable, Mapping, Sequence
from urllib.parse import unquote, urlencode, urlsplit

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.course import (
    Lesson,
    SubtitleQualityStatus,
    SubtitleTrack,
)
from app.models.media import (
    MediaAsset,
    MediaLicenseStatus,
    MediaPlaybackType,
)
from app.models.subscription import UserSubscription
from app.models.user import User, UserStatus


@dataclass(frozen=True)
class WorkflowValidation:
    valid: bool
    errors: tuple[str, ...] = ()
    warnings: tuple[str, ...] = ()
    score: float = 0.0

    def as_dict(self) -> dict[str, Any]:
        return {
            "valid": self.valid,
            "errors": list(self.errors),
            "warnings": list(self.warnings),
            "quality_score": self.score,
        }


def _value(value: Any) -> str:
    return str(getattr(value, "value", value))


def _signing_secret() -> bytes:
    # A separately configurable key is preferred; SECRET_KEY remains a safe
    # backwards-compatible fallback for existing staging environments.
    raw = (settings.MEDIA_SIGNING_KEY or settings.SECRET_KEY or "").encode("utf-8")
    if len(raw) < 32:
        raise RuntimeError("Media signing requires a non-empty strong secret")
    # Domain separation prevents a media token from being confused with any
    # other HMAC token emitted by the application.
    return hmac.new(raw, b"chinverse-media-playback-v1", hashlib.sha256).digest()


def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


class MediaResourceError(ValueError):
    """Raised when an HLS resource would escape its registered asset."""


def normalize_media_resource(resource_path: str | None) -> str:
    """Return a canonical asset-relative resource path.

    Playback signatures bind this canonical path. Repeated percent-decoding is
    intentional: it closes double-encoding traversal tricks before a path ever
    reaches local or object storage.
    """
    value = str(resource_path or "").strip().replace("\\", "/")
    for _ in range(3):
        decoded = unquote(value)
        if decoded == value:
            break
        value = decoded
    if "\x00" in value:
        raise MediaResourceError("invalid_resource")
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or parsed.query or parsed.fragment or parsed.path.startswith("/"):
        raise MediaResourceError("invalid_resource")
    normalized = posixpath.normpath(parsed.path)
    if normalized in {"", "."}:
        return ""
    if normalized == ".." or normalized.startswith("../"):
        raise MediaResourceError("invalid_resource")
    return PurePosixPath(normalized).as_posix()


def resolve_hls_reference(current_resource: str, reference: str) -> str:
    """Resolve an HLS URI without allowing absolute/provider URLs or escape."""
    raw = str(reference or "").strip()
    parsed = urlsplit(raw)
    if parsed.scheme or parsed.netloc or parsed.path.startswith("/"):
        raise MediaResourceError("external_hls_resource")
    current = normalize_media_resource(current_resource)
    parent = PurePosixPath(current).parent.as_posix() if current else ""
    combined = posixpath.join("" if parent == "." else parent, parsed.path)
    resolved = normalize_media_resource(combined)
    if not resolved:
        raise MediaResourceError("invalid_resource")
    return resolved


def media_resource_storage_key(root_storage_key: str, resource_path: str = "") -> str:
    """Map a signed asset-relative resource onto its registered storage root."""
    raw_root = str(root_storage_key or "").strip()
    if "\\" in raw_root:
        raise MediaResourceError("invalid_storage_key")
    root = raw_root
    normalized_root = PurePosixPath(root)
    if not root or normalized_root.is_absolute() or ".." in normalized_root.parts:
        raise MediaResourceError("invalid_storage_key")
    resource = normalize_media_resource(resource_path)
    if not resource:
        return normalized_root.as_posix()
    return (normalized_root.parent / PurePosixPath(resource)).as_posix()


def _signature_payload(
    media_id: int,
    lesson_id: int,
    subject_id: int,
    expires: int,
    resource_path: str,
) -> bytes:
    resource_digest = hashlib.sha256(resource_path.encode("utf-8")).hexdigest()
    return f"v2:{media_id}:{lesson_id}:{subject_id}:{expires}:{resource_digest}".encode("ascii")


def sign_playback_signature(
    *,
    media_id: int,
    lesson_id: int,
    subject_id: int,
    expires: int,
    resource_path: str = "",
) -> str:
    """Create a URL-safe HMAC bound to one exact media resource."""
    resource = normalize_media_resource(resource_path)
    payload = _signature_payload(media_id, lesson_id, subject_id, expires, resource)
    return _b64(hmac.new(_signing_secret(), payload, hashlib.sha256).digest())


class PlaybackTokenError(ValueError):
    """Raised when an app-signed playback token cannot be accepted."""

    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(reason)


def verify_playback_signature(
    *,
    media_id: int,
    lesson_id: int,
    subject_id: int,
    expires: int,
    signature: str,
    resource_path: str = "",
    now: int | None = None,
) -> None:
    """Reject tampering, malformed values, and expired signatures."""
    try:
        media_id = int(media_id)
        lesson_id = int(lesson_id)
        subject_id = int(subject_id)
        expires = int(expires)
    except (TypeError, ValueError) as exc:
        raise PlaybackTokenError("invalid_token") from exc
    if min(media_id, lesson_id, subject_id) < 0 or expires <= 0:
        raise PlaybackTokenError("invalid_token")
    current = int(time.time()) if now is None else int(now)
    if expires <= current:
        raise PlaybackTokenError("expired")
    if expires - current > 900:
        raise PlaybackTokenError("expiry_too_far")
    expected = sign_playback_signature(
        media_id=media_id,
        lesson_id=lesson_id,
        subject_id=subject_id,
        expires=expires,
        resource_path=resource_path,
    )
    if not hmac.compare_digest(expected, str(signature or "")):
        raise PlaybackTokenError("invalid_signature")


def signed_playback_url(
    *,
    base_path: str,
    media_id: int,
    lesson_id: int,
    subject_id: int,
    ttl_seconds: int | None = None,
    now: datetime | None = None,
    resource_path: str = "",
) -> tuple[str, datetime]:
    issued_at = now or datetime.now(UTC)
    ttl = ttl_seconds if ttl_seconds is not None else settings.MEDIA_SIGNED_URL_TTL_SECONDS
    expires_at = issued_at + timedelta(seconds=max(1, min(int(ttl), 900)))
    expires = int(expires_at.timestamp())
    resource = normalize_media_resource(resource_path)
    signature = sign_playback_signature(
        media_id=media_id,
        lesson_id=lesson_id,
        subject_id=subject_id,
        expires=expires,
        resource_path=resource,
    )
    separator = "&" if "?" in base_path else "?"
    query = {
        "lesson_id": lesson_id,
        "subject_id": subject_id,
        "expires": expires,
    }
    if resource:
        query["resource"] = resource
    query["signature"] = signature
    return (
        f"{base_path}{separator}{urlencode(query)}",
        expires_at,
    )


_HLS_URI_ATTRIBUTE_RE = re.compile(r'URI=(?:"(?P<quoted>[^"]+)"|(?P<bare>[^,\s]+))')


@dataclass(frozen=True)
class HlsResourceReference:
    path: str
    is_manifest: bool


def rewrite_hls_manifest(
    manifest: str,
    *,
    base_path: str,
    media_id: int,
    lesson_id: int,
    subject_id: int,
    expires: int,
    current_resource: str = "",
) -> str:
    """Rewrite every HLS child URI to a resource-bound application URL."""
    validate_hls_manifest(manifest, current_resource=current_resource)

    def gateway_url(reference: str) -> str:
        resource = resolve_hls_reference(current_resource, reference)
        signature = sign_playback_signature(
            media_id=media_id,
            lesson_id=lesson_id,
            subject_id=subject_id,
            expires=expires,
            resource_path=resource,
        )
        return f"{base_path}?{urlencode({'lesson_id': lesson_id, 'subject_id': subject_id, 'expires': expires, 'resource': resource, 'signature': signature})}"

    rewritten: list[str] = []
    for line in manifest.splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            rewritten.append(gateway_url(stripped))
            continue

        def replace_uri(match: re.Match[str]) -> str:
            reference = match.group("quoted") or match.group("bare") or ""
            return f'URI="{gateway_url(reference)}"'

        rewritten.append(_HLS_URI_ATTRIBUTE_RE.sub(replace_uri, line))
    return "\n".join(rewritten) + "\n"


def hls_manifest_references(
    manifest: str,
    *,
    current_resource: str = "",
) -> tuple[HlsResourceReference, ...]:
    """Validate one playlist and return its canonical dependency edges."""
    lines = manifest.lstrip("\ufeff").splitlines()
    first_line = next((line.strip() for line in lines if line.strip()), "")
    if first_line != "#EXTM3U":
        raise MediaResourceError("invalid_hls_manifest")

    payload_resources = 0
    expected_resource_kind: str | None = None
    references: list[HlsResourceReference] = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            if expected_resource_kind is None:
                raise MediaResourceError("orphan_hls_resource")
            path = resolve_hls_reference(current_resource, stripped)
            references.append(
                HlsResourceReference(
                    path=path,
                    is_manifest=expected_resource_kind == "playlist",
                )
            )
            payload_resources += 1
            expected_resource_kind = None
            continue
        if stripped.startswith("#EXTINF:"):
            if expected_resource_kind is not None:
                raise MediaResourceError("missing_hls_resource")
            expected_resource_kind = "media"
        elif stripped.startswith("#EXT-X-STREAM-INF:"):
            if expected_resource_kind is not None:
                raise MediaResourceError("missing_hls_resource")
            expected_resource_kind = "playlist"
        for match in _HLS_URI_ATTRIBUTE_RE.finditer(line):
            reference = match.group("quoted") or match.group("bare") or ""
            is_manifest = stripped.startswith("#EXT-X-I-FRAME-STREAM-INF:") or stripped.startswith(
                "#EXT-X-MEDIA:"
            )
            references.append(
                HlsResourceReference(
                    path=resolve_hls_reference(current_resource, reference),
                    is_manifest=is_manifest,
                )
            )
            if is_manifest:
                payload_resources += 1

    if expected_resource_kind is not None:
        raise MediaResourceError("missing_hls_resource")
    if payload_resources == 0:
        raise MediaResourceError("empty_hls_manifest")
    return tuple(references)


def validate_hls_manifest(manifest: str, *, current_resource: str = "") -> None:
    """Validate HLS syntax relevant to the gateway without minting URLs."""
    hls_manifest_references(manifest, current_resource=current_resource)


def _canonical_cues(cues: Iterable[Mapping[str, Any]]) -> bytes:
    canonical = []
    for index, cue in enumerate(cues):
        canonical.append(
            {
                "index": int(cue.get("cue_index", index)),
                "start": round(float(cue.get("timestamp_start", cue.get("start", 0))), 3),
                "end": round(float(cue.get("timestamp_end", cue.get("end", 0))), 3),
                "zh_text": str(cue.get("zh_text") or ""),
                "pinyin": str(cue.get("pinyin") or ""),
                "target_text": str(cue.get("target_text") or ""),
                "highlighted_words": sorted(str(item) for item in (cue.get("highlighted_words") or [])),
            }
        )
    return json.dumps(canonical, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")


def subtitle_checksum(cues: Iterable[Mapping[str, Any]]) -> str:
    return hashlib.sha256(_canonical_cues(cues)).hexdigest()


def assess_subtitle_cues(
    cues: Sequence[Mapping[str, Any]], *, duration_seconds: float | None = None
) -> WorkflowValidation:
    errors: list[str] = []
    warnings: list[str] = []
    if not cues:
        errors.append("subtitle_track_empty")

    previous_end: float | None = None
    previous_index: int | None = None
    for ordinal, cue in enumerate(cues):
        try:
            start = float(cue.get("timestamp_start", cue.get("start", 0)))
            end = float(cue.get("timestamp_end", cue.get("end", 0)))
        except (TypeError, ValueError):
            errors.append(f"cue_{ordinal}_invalid_time")
            continue
        cue_index = int(cue.get("cue_index", ordinal))
        if cue_index < 0 or (previous_index is not None and cue_index <= previous_index):
            errors.append(f"cue_{ordinal}_index_not_increasing")
        if start < 0:
            errors.append(f"cue_{ordinal}_negative_start")
        if end <= start:
            errors.append(f"cue_{ordinal}_non_positive_duration")
        if previous_end is not None:
            if start < previous_end - 0.001:
                errors.append(f"cue_{ordinal}_overlap")
            elif start - previous_end > 15:
                warnings.append(f"cue_{ordinal}_large_gap")
        if end - start > 15:
            warnings.append(f"cue_{ordinal}_long_duration")
        if not any(str(cue.get(key) or "").strip() for key in ("zh_text", "pinyin", "target_text")):
            errors.append(f"cue_{ordinal}_empty_text")
        if not str(cue.get("zh_text") or "").strip():
            warnings.append(f"cue_{ordinal}_missing_zh_text")
        if not str(cue.get("pinyin") or "").strip():
            warnings.append(f"cue_{ordinal}_missing_pinyin")
        if duration_seconds is not None and end > float(duration_seconds) + 1.0:
            errors.append(f"cue_{ordinal}_beyond_media_duration")
        previous_end = max(previous_end or 0, end)
        previous_index = cue_index

    # Warnings are quality signals, while structural/sync errors block publish.
    score = max(0.0, 100.0 - len(errors) * 30.0 - len(warnings) * 2.0)
    return WorkflowValidation(valid=not errors, errors=tuple(errors), warnings=tuple(warnings), score=score)


def validate_media_asset(asset: MediaAsset) -> WorkflowValidation:
    errors: list[str] = []
    warnings: list[str] = []
    media_type = _value(asset.media_type).strip().lower()
    playback_type = _value(asset.playback_type).strip().lower()
    provider = str(asset.storage_provider or "").strip().lower()
    if media_type not in {"image", "video", "audio"}:
        errors.append("media_type_invalid")
    try:
        media_resource_storage_key(asset.storage_key)
    except MediaResourceError:
        errors.append("storage_key_required")
    if provider not in {"local", "mounted", "s3"}:
        errors.append("storage_provider_invalid")
    if not asset.checksum_sha256 or not re.fullmatch(r"[0-9a-fA-F]{64}", asset.checksum_sha256):
        errors.append("checksum_sha256_required")
    if not asset.source_name:
        errors.append("source_name_required")
    if not asset.rights_holder:
        errors.append("rights_holder_required")
    if not asset.license_type:
        errors.append("license_type_required")
    if _value(asset.license_status) != MediaLicenseStatus.APPROVED.value:
        errors.append("license_not_approved")
    if playback_type not in {MediaPlaybackType.HLS.value, MediaPlaybackType.PROGRESSIVE.value}:
        errors.append("playback_type_invalid")
    if playback_type == MediaPlaybackType.HLS.value:
        if media_type not in {"video", "audio"}:
            errors.append("hls_media_type_invalid")
        if not str(asset.storage_key or "").lower().endswith(".m3u8"):
            errors.append("hls_manifest_storage_key_required")
        if (asset.mime_type or "").lower() not in {
            "application/vnd.apple.mpegurl",
            "application/x-mpegurl",
        }:
            errors.append("hls_manifest_mime_type_required")
    score = max(0.0, 100.0 - len(errors) * 20.0 - len(warnings) * 2.0)
    return WorkflowValidation(valid=not errors, errors=tuple(errors), warnings=tuple(warnings), score=score)


def track_cues_as_mappings(track: SubtitleTrack) -> list[dict[str, Any]]:
    return [
        {
            "cue_index": cue.cue_index,
            "timestamp_start": cue.timestamp_start,
            "timestamp_end": cue.timestamp_end,
            "zh_text": cue.zh_text,
            "pinyin": cue.pinyin,
            "target_text": cue.target_text,
            "highlighted_words": cue.highlighted_words or [],
        }
        for cue in sorted(track.cues or [], key=lambda item: (item.cue_index, item.id))
    ]


def validate_subtitle_track(track: SubtitleTrack, *, duration_seconds: float | None = None) -> WorkflowValidation:
    cues = track_cues_as_mappings(track)
    result = assess_subtitle_cues(cues, duration_seconds=duration_seconds)
    if not track.source_name:
        result = WorkflowValidation(
            valid=False,
            errors=(*result.errors, "source_name_required"),
            warnings=result.warnings,
            score=max(0.0, result.score - 20),
        )
    return result


def apply_subtitle_validation(track: SubtitleTrack, result: WorkflowValidation) -> None:
    track.quality_status = SubtitleQualityStatus.VALID if result.valid else SubtitleQualityStatus.INVALID
    track.quality_score = result.score
    track.quality_report = result.as_dict()
    track.checksum_sha256 = subtitle_checksum(track_cues_as_mappings(track)) if track.cues else None


_TIMESTAMP_RE = re.compile(
    r"(?:(?P<hours>\d{1,2}):)?(?P<minutes>\d{1,2}):(?P<seconds>\d{2})[,.](?P<millis>\d{1,3})"
)


def _parse_timestamp(value: str) -> float:
    match = _TIMESTAMP_RE.fullmatch(value.strip())
    if not match:
        raise ValueError("Invalid subtitle timestamp")
    hours = int(match.group("hours") or 0)
    minutes = int(match.group("minutes"))
    seconds = int(match.group("seconds"))
    millis = int(match.group("millis").ljust(3, "0"))
    if minutes > 59 or seconds > 59:
        raise ValueError("Invalid subtitle timestamp")
    return hours * 3600 + minutes * 60 + seconds + millis / 1000


def parse_srt_or_vtt(content: str, format: str) -> list[dict[str, Any]]:
    """Parse SRT/VTT into normalized DB cue mappings or reject malformed input."""
    normalized = (content or "").replace("\ufeff", "").replace("\r\n", "\n").replace("\r", "\n")
    kind = format.lower().strip()
    if kind not in {"srt", "vtt"}:
        raise ValueError("Only SRT and VTT text can be parsed")
    lines = normalized.split("\n")
    if kind == "vtt":
        while lines and (not lines[0].strip() or lines[0].strip().upper().startswith("WEBVTT")):
            lines.pop(0)
    blocks: list[list[str]] = []
    current: list[str] = []
    for line in lines + [""]:
        if line.strip():
            current.append(line)
        elif current:
            blocks.append(current)
            current = []

    cues: list[dict[str, Any]] = []
    for block_number, block in enumerate(blocks, start=1):
        first_line = block[0].strip().upper()
        if kind == "vtt" and (
            first_line == "STYLE"
            or first_line.startswith("NOTE")
            or first_line == "REGION"
        ):
            # These are valid WebVTT metadata blocks, not cues.
            continue
        timing_indices = [index for index, line in enumerate(block) if "-->" in line]
        if len(timing_indices) != 1 or timing_indices[0] > 1:
            raise ValueError(f"Malformed subtitle block {block_number}: timing line is required")
        timing_index = timing_indices[0]
        timing = block[timing_index].split("-->", 1)
        try:
            start = _parse_timestamp(timing[0])
            end = _parse_timestamp(timing[1].split()[0])
        except (IndexError, ValueError) as exc:
            raise ValueError(
                f"Malformed subtitle block {block_number}: invalid timing"
            ) from exc
        text_lines = [line.strip() for line in block[timing_index + 1 :] if line.strip()]
        if not text_lines:
            raise ValueError(f"Malformed subtitle block {block_number}: cue text is required")
        text = "\n".join(text_lines)
        cues.append(
            {
                "cue_index": len(cues),
                "timestamp_start": start,
                "timestamp_end": end,
                "zh_text": "",
                "pinyin": "",
                "target_text": text,
                "highlighted_words": [],
            }
        )
    return cues


async def user_has_active_subscription(db: AsyncSession, user_id: int) -> bool:
    today = datetime.now(UTC).date()
    result = await db.execute(
        select(UserSubscription.id)
        .join(User, User.id == UserSubscription.user_id)
        .where(
            UserSubscription.user_id == user_id,
            UserSubscription.status == "active",
            UserSubscription.start_date <= today,
            UserSubscription.end_date >= today,
            User.status == UserStatus.ACTIVE,
        ).limit(1)
    )
    return result.scalar_one_or_none() is not None


async def lesson_entitlement(db: AsyncSession, lesson: Lesson, user_id: int | None) -> tuple[bool, bool, str, int]:
    required = not bool(lesson.is_free)
    if not required:
        return False, True, "free_lesson", int(user_id or 0)
    if not user_id:
        return True, False, "login_required", 0
    if await user_has_active_subscription(db, int(user_id)):
        return True, True, "active_subscription", int(user_id)
    return True, False, "active_subscription_required", int(user_id)


def utc_now() -> datetime:
    return datetime.now(UTC)
