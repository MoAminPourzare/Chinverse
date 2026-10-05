from hashlib import sha256
from types import SimpleNamespace
from unittest.mock import AsyncMock
import time
from urllib.parse import parse_qs, urlsplit

import httpx
import pytest
from fastapi import HTTPException

from app.api.v1.endpoints import media
from app.core import arvan_vod
from app.core.config import settings
from app.services.media_workflow import sign_playback_signature, validate_media_asset
from scripts.sync_client_demo import demo_target_allowed, read_fixture


URL = "https://chinverse-test.arvanvod.ir/channel/video/h_,144,k.mp4.list/master.m3u8"


def asset(manifest=b"", **overrides):
    values = dict(
        id=81, file_url=URL, media_type="video", storage_provider="arvan_vod",
        storage_key="arvan-vod/test/master.m3u8", checksum_sha256=sha256(manifest).hexdigest(),
        file_size_bytes=len(manifest), playback_type="hls", mime_type="application/vnd.apple.mpegurl",
        source_name="sample", rights_holder="sample author", license_type="owned", license_status="approved",
    )
    return SimpleNamespace(**{**values, **overrides})


@pytest.mark.parametrize("url,resource", [
    (URL.replace("https:", "http:"), ""),
    (URL.replace("chinverse-test.arvanvod.ir", "127.0.0.1"), ""),
    (URL.replace("chinverse-test.arvanvod.ir", "chinverse-test.arvanvod.ir.evil.invalid"), ""),
    (URL.replace("https://", "https://user:password@"), ""),
    (URL.replace(".ir/", ".ir:444/"), ""),
    (URL + "?secret=value", ""), (URL + "#fragment", ""),
    (URL, "https://other.invalid/segment.ts"),
    (URL, "../segment.ts"), (URL, "%252e%252e%252fsegment.ts"),
])
def test_arvan_origin_and_resource_cannot_escape_registered_asset(url, resource):
    with pytest.raises(ValueError):
        arvan_vod.arvan_vod_resource_url(url, resource)


def test_arvan_resource_stays_inside_source_playlist_directory():
    assert arvan_vod.arvan_vod_resource_url(URL) == URL
    assert arvan_vod.arvan_vod_resource_url(URL, "encryption-f1.key") == URL.rsplit("/", 1)[0] + "/encryption-f1.key"


@pytest.mark.asyncio
@pytest.mark.parametrize("mode", ["range", "redirect", "oversized", "missing"])
async def test_arvan_reads_are_bounded_and_do_not_follow_redirects(monkeypatch, mode):
    requests = []
    def handle(request):
        requests.append(request)
        if mode == "redirect":
            return httpx.Response(302, headers={"Location": "http://127.0.0.1/private"})
        if mode == "missing":
            return httpx.Response(404)
        if mode == "oversized":
            return httpx.Response(200, content=b"12345678")
        return httpx.Response(206, content=b"x", headers={"Content-Range": "bytes 0-0/123"})
    client_type = httpx.AsyncClient
    monkeypatch.setattr(arvan_vod.httpx, "AsyncClient", lambda **kwargs: client_type(
        transport=httpx.MockTransport(handle), **kwargs,
    ))
    if mode != "range":
        with pytest.raises(arvan_vod.ArvanVodError):
            await arvan_vod.read_arvan_vod_resource(URL, "seg-1.ts", byte_range="bytes=0-0", max_bytes=4)
    else:
        result = await arvan_vod.read_arvan_vod_resource(URL, "seg-1.ts", byte_range="bytes=0-0", max_bytes=4)
        assert result.content == b"x" and result.content_range == "bytes 0-0/123"
    assert len(requests) == 1 and requests[0].headers["Range"] == "bytes=0-0"


def test_staging_demo_requires_pinned_neon_and_is_unavailable_in_production(monkeypatch):
    assert demo_target_allowed("staging", "postgresql://test:test@ep-wild-band-atse2yoq-pooler.eu.neon.tech/neondb")
    assert not demo_target_allowed("production", "postgresql://test:test@ep-wild-band-atse2yoq.eu.neon.tech/neondb")
    assert not demo_target_allowed("staging", "postgresql://test:test@ep-other.eu.neon.tech/neondb")
    monkeypatch.setattr(settings, "DEPLOYMENT_TIER", "production")
    assert not validate_media_asset(asset(license_type="owner_authorized_staging_demo")).valid


def test_client_fixture_has_bilingual_cues_and_real_dictionary_highlights():
    fixture = read_fixture()
    assert fixture["media"]["duration_seconds"] > fixture["cues"][-1]["timestamp_end"]
    assert all(cue["zh_text"] and cue["pinyin"] and cue["target_text"] for cue in fixture["cues"])
    assert "同学" in fixture["cues"][0]["highlighted_words"]
    assert "学习" in fixture["cues"][1]["highlighted_words"]


@pytest.mark.asyncio
async def test_arvan_publish_checks_master_checksum_and_every_dependency(monkeypatch):
    master = b"#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=200000\nindex.m3u8\n"
    playlist = b'#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="encryption.key"\n#EXTINF:2,\nseg-1.ts\n'
    checked = []
    async def read(_url, resource="", **kwargs):
        checked.append(resource)
        data = master if not resource else playlist if resource == "index.m3u8" else b"x"
        return arvan_vod.ArvanVodObject(data, "application/octet-stream", 200, None)
    monkeypatch.setattr(media, "read_arvan_vod_resource", read)
    await media._verify_media_storage_for_publish(asset(master))
    assert set(checked) == {"", "index.m3u8", "encryption.key", "seg-1.ts"}
    with pytest.raises(HTTPException, match="checksum"):
        await media._verify_media_storage_for_publish(asset(master, checksum_sha256="0" * 64))


@pytest.mark.asyncio
async def test_arvan_gateway_signs_playlists_keys_and_segments_without_provider_urls(monkeypatch):
    manifest = b'#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="encryption.key"\n#EXTINF:2,\nseg-1.ts\n'
    registered = asset(manifest)
    monkeypatch.setattr(media, "_load_published_lesson_media", AsyncMock(return_value=(SimpleNamespace(
        id=82, is_free=True,
    ), registered)))
    async def read(_url, resource="", **kwargs):
        if not resource:
            return arvan_vod.ArvanVodObject(manifest, "application/vnd.apple.mpegurl", 200, None)
        return arvan_vod.ArvanVodObject(b"x", "video/mp2t", 206, "bytes 0-0/123")
    monkeypatch.setattr(media, "read_arvan_vod_resource", read)
    expires = int(time.time()) + 120
    async def resolve(resource, signature=None, byte_range=None):
        return await media.resolve_media_content(
            media_id=81, lesson_id=82, subject_id=0, expires=expires, resource=resource,
            signature=signature or sign_playback_signature(media_id=81, lesson_id=82, subject_id=0,
                                                           expires=expires, resource_path=resource),
            range_header=byte_range, db=SimpleNamespace(),
        )
    response = await resolve("")
    body = response.body.decode()
    assert "arvanvod.ir" not in body and "encryption.key" in body and "seg-1.ts" in body
    segment_url = next(line for line in body.splitlines() if line.startswith("./content?"))
    params = {key: value[0] for key, value in parse_qs(urlsplit(segment_url).query).items()}
    segment = await resolve(params["resource"], params["signature"], "bytes=0-0")
    assert segment.status_code == 206 and segment.headers["Content-Range"] == "bytes 0-0/123"
    assert segment.headers["Cache-Control"] == "private, no-store"
    with pytest.raises(HTTPException) as tampered:
        await resolve("encryption.key", params["signature"])
    assert tampered.value.status_code == 403
    registered.checksum_sha256 = "0" * 64
    with pytest.raises(HTTPException) as changed:
        await resolve("")
    assert changed.value.status_code == 404
