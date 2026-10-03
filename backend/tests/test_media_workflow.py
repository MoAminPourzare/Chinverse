from datetime import UTC, datetime
from types import SimpleNamespace

import pytest

from app.core.config import settings
from app.models.media import MediaLicenseStatus, MediaPlaybackType, MediaPublicationStatus
from app.services.media_workflow import (
    MediaResourceError,
    PlaybackTokenError,
    assess_subtitle_cues,
    media_resource_storage_key,
    normalize_media_resource,
    parse_srt_or_vtt,
    resolve_hls_reference,
    rewrite_hls_manifest,
    sign_playback_signature,
    signed_playback_url,
    validate_hls_manifest,
    validate_media_asset,
    verify_playback_signature,
)


def _asset(**overrides):
    values = {
        "media_type": "video",
        "storage_key": "uploads/videos/demo.mp4",
        "storage_provider": "mounted",
        "checksum_sha256": "a" * 64,
        "source_name": "internal-record",
        "rights_holder": "ChinVerse",
        "license_type": "internal",
        "license_status": MediaLicenseStatus.APPROVED,
        "status": MediaPublicationStatus.PUBLISHED,
        "playback_type": MediaPlaybackType.PROGRESSIVE,
        "mime_type": "video/mp4",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_media_validation_is_fail_closed_for_missing_provenance():
    result = validate_media_asset(_asset(checksum_sha256=None, rights_holder=None))
    assert result.valid is False
    assert "checksum_sha256_required" in result.errors
    assert "rights_holder_required" in result.errors


def test_signed_playback_signature_binds_media_lesson_subject_and_expiry(monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_SIGNING_KEY", "m" * 48)
    signature = sign_playback_signature(media_id=4, lesson_id=9, subject_id=12, expires=1_800)
    verify_playback_signature(
        media_id=4,
        lesson_id=9,
        subject_id=12,
        expires=1_800,
        signature=signature,
        now=1_000,
    )
    with pytest.raises(PlaybackTokenError, match="invalid_signature"):
        verify_playback_signature(
            media_id=4,
            lesson_id=10,
            subject_id=12,
            expires=1_800,
            signature=signature,
            now=1_000,
        )
    with pytest.raises(PlaybackTokenError, match="expired"):
        verify_playback_signature(
            media_id=4,
            lesson_id=9,
            subject_id=12,
            expires=1_800,
            signature=signature,
            now=1_801,
        )


def test_signed_playback_signature_binds_hls_resource(monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_SIGNING_KEY", "m" * 48)
    signature = sign_playback_signature(
        media_id=4,
        lesson_id=9,
        subject_id=12,
        expires=1_800,
        resource_path="720p/segment-1.ts",
    )
    verify_playback_signature(
        media_id=4,
        lesson_id=9,
        subject_id=12,
        expires=1_800,
        signature=signature,
        resource_path="720p/segment-1.ts",
        now=1_000,
    )
    with pytest.raises(PlaybackTokenError, match="invalid_signature"):
        verify_playback_signature(
            media_id=4,
            lesson_id=9,
            subject_id=12,
            expires=1_800,
            signature=signature,
            resource_path="720p/segment-2.ts",
            now=1_000,
        )


def test_media_resource_paths_are_canonical_and_confined():
    assert normalize_media_resource("720p/../audio/init.mp4") == "audio/init.mp4"
    assert resolve_hls_reference("720p/index.m3u8", "segment-1.ts?provider=secret") == "720p/segment-1.ts"
    assert media_resource_storage_key("courses/demo/master.m3u8", "720p/segment-1.ts") == (
        "courses/demo/720p/segment-1.ts"
    )
    for value in ("../secret", "%2e%2e/secret", "%252e%252e/secret", "https://cdn.example/x.ts"):
        with pytest.raises(MediaResourceError):
            normalize_media_resource(value)


def test_hls_manifest_rewrites_segments_variants_keys_and_maps(monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_SIGNING_KEY", "m" * 48)
    source = """#EXTM3U
#EXT-X-KEY:METHOD=AES-128,URI="keys/key.bin"
#EXT-X-MAP:URI="init.mp4"
#EXT-X-STREAM-INF:BANDWIDTH=1280000
720p/index.m3u8
#EXTINF:6,
segment-1.ts?provider_token=must-not-leak
"""
    rewritten = rewrite_hls_manifest(
        source,
        base_path="./content",
        media_id=4,
        lesson_id=9,
        subject_id=12,
        expires=1_800,
    )
    assert "provider_token" not in rewritten
    assert "URI=\"./content?" in rewritten
    assert "resource=keys%2Fkey.bin" in rewritten
    assert "resource=init.mp4" in rewritten
    assert "resource=720p%2Findex.m3u8" in rewritten
    assert "resource=segment-1.ts" in rewritten
    assert rewritten.count("signature=") == 4


def test_hls_manifest_rejects_external_or_escaping_references(monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_SIGNING_KEY", "m" * 48)
    for reference in ("https://provider.example/segment.ts", "../outside.ts"):
        with pytest.raises(MediaResourceError):
            rewrite_hls_manifest(
                f"#EXTM3U\n{reference}\n",
                base_path="./content",
                media_id=4,
                lesson_id=9,
                subject_id=0,
                expires=1_800,
            )


def test_hls_manifest_validation_rejects_empty_or_non_hls_payloads():
    for manifest in ("", "not a playlist", "#EXTM3U\n#EXT-X-VERSION:3\n"):
        with pytest.raises(MediaResourceError):
            validate_hls_manifest(manifest)

    validate_hls_manifest("#EXTM3U\n#EXTINF:6,\nsegment-1.ts\n")


def test_signed_url_has_short_lived_gateway_contract(monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_SIGNING_KEY", "m" * 48)
    url, expires_at = signed_playback_url(
        base_path="/api/v1/media/assets/4/content",
        media_id=4,
        lesson_id=9,
        subject_id=0,
        ttl_seconds=120,
        now=datetime(2030, 1, 1, tzinfo=UTC),
    )
    assert url.startswith("/api/v1/media/assets/4/content?")
    assert "lesson_id=9" in url
    assert "subject_id=0" in url
    assert expires_at.timestamp() == datetime(2030, 1, 1, 0, 2, tzinfo=UTC).timestamp()


def test_subtitle_quality_rejects_overlap_and_accepts_aligned_cues():
    invalid = assess_subtitle_cues(
        [
            {"cue_index": 0, "start": 0, "end": 2, "target_text": "one"},
            {"cue_index": 1, "start": 1.5, "end": 3, "target_text": "two"},
        ]
    )
    assert invalid.valid is False
    assert "cue_1_overlap" in invalid.errors

    valid = assess_subtitle_cues(
        [
            {"cue_index": 0, "start": 0, "end": 2, "zh_text": "一", "target_text": "one"},
            {"cue_index": 1, "start": 2, "end": 3, "zh_text": "二", "target_text": "two"},
        ],
        duration_seconds=3,
    )
    assert valid.valid is True
    assert valid.score < 100  # missing pinyin is a quality warning, not a sync error


def test_hls_media_validation_requires_manifest_contract():
    invalid = validate_media_asset(
        _asset(
            playback_type=MediaPlaybackType.HLS,
            storage_key="uploads/videos/demo.mp4",
            mime_type="video/mp4",
        )
    )
    assert invalid.valid is False
    assert "hls_manifest_storage_key_required" in invalid.errors
    assert "hls_manifest_mime_type_required" in invalid.errors

    valid = validate_media_asset(
        _asset(
            playback_type=MediaPlaybackType.HLS,
            storage_key="uploads/videos/demo/master.m3u8",
            mime_type="application/vnd.apple.mpegurl",
        )
    )
    assert valid.valid is True


def test_srt_and_vtt_ingest_normalizes_timing_and_text():
    srt = "1\n00:00:01,000 --> 00:00:02,500\n你好\n\n"
    vtt = "WEBVTT\n\n00:00:03.000 --> 00:00:04.000\nسلام\n"
    srt_cues = parse_srt_or_vtt(srt, "srt")
    vtt_cues = parse_srt_or_vtt(vtt, "vtt")
    assert srt_cues[0]["timestamp_start"] == 1
    assert srt_cues[0]["timestamp_end"] == 2.5
    assert vtt_cues[0]["target_text"] == "سلام"


@pytest.mark.parametrize(
    "content",
    [
        "1\nthis is not a timing line\ntext\n",
        "1\n00:00:bad --> 00:00:02,000\ntext\n",
        "1\n00:00:01,000 trailing --> 00:00:02,000\ntext\n",
        "1\n00:00:01,000 --> 00:00:02,000\n",
        (
            "1\n00:00:01,000 --> 00:00:02,000\nvalid\n\n"
            "2\nmalformed timing\nmust not be silently dropped\n"
        ),
    ],
)
def test_subtitle_ingest_rejects_every_malformed_block(content):
    with pytest.raises(ValueError, match="Malformed subtitle block"):
        parse_srt_or_vtt(content, "srt")


def test_vtt_ingest_accepts_metadata_blocks_but_rejects_malformed_cues():
    content = (
        "WEBVTT\n\n"
        "NOTE generated by subtitle tool\nmetadata only\n\n"
        "cue-id\n00:00:01.000 --> 00:00:02.000 align:start\ntext\n"
    )
    assert len(parse_srt_or_vtt(content, "vtt")) == 1
