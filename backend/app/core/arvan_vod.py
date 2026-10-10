"""Bounded reads from registered Arvan VOD assets, behind the media gateway."""
import asyncio
from dataclasses import dataclass
from urllib.parse import quote, urlsplit, urlunsplit

import httpx

from app.core.config import parse_setting_list, settings


MAX_ARVAN_RESOURCE_BYTES = 32 * 1024 * 1024


class ArvanVodError(ValueError):
    pass


class _RetryableArvanVodError(ArvanVodError):
    pass


@dataclass(frozen=True)
class ArvanVodObject:
    content: bytes
    content_type: str
    status_code: int
    content_range: str | None


def arvan_vod_resource_url(source_url: str, resource: str = "") -> str:
    from app.services.media_workflow import normalize_media_resource

    parsed = urlsplit(source_url)
    allowed = {host.lower() for host in parse_setting_list(settings.ARVAN_VOD_ALLOWED_HOSTS)}
    if (
        parsed.scheme != "https" or parsed.hostname not in allowed
        or parsed.port not in {None, 443} or parsed.username or parsed.password
        or parsed.query or parsed.fragment or not parsed.path.endswith("/master.m3u8")
        or "\\" in source_url
    ):
        raise ArvanVodError("Unapproved Arvan VOD origin or manifest")
    # Validate the root as well as each asset-relative path; redirects and
    # absolute child URLs are never followed.
    normalize_media_resource(parsed.path.lstrip("/"))
    normalized = normalize_media_resource(resource)
    path = parsed.path if not normalized else parsed.path.rsplit("/", 1)[0] + "/" + quote(normalized, safe="/._-")
    return urlunsplit(("https", parsed.netloc, path, "", ""))


async def read_arvan_vod_resource(
    source_url: str, resource: str = "", *, byte_range: str | None = None,
    max_bytes: int = MAX_ARVAN_RESOURCE_BYTES,
) -> ArvanVodObject:
    url = arvan_vod_resource_url(source_url, resource)
    headers = {"Accept-Encoding": "identity"}
    if byte_range:
        headers["Range"] = byte_range
    async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
        for attempt in range(3):
            try:
                return await _read_once(client, url, headers, max_bytes)
            except (httpx.HTTPError, _RetryableArvanVodError) as exc:
                if attempt == 2:
                    raise ArvanVodError("Arvan VOD request failed after bounded retries") from exc
                await asyncio.sleep(0.5 * (attempt + 1))
    raise ArvanVodError("Arvan VOD request failed")


async def _read_once(client: httpx.AsyncClient, url: str, headers: dict, max_bytes: int) -> ArvanVodObject:
    async with client.stream("GET", url, headers=headers) as response:
        if response.status_code == 429 or 500 <= response.status_code < 600:
            raise _RetryableArvanVodError("Arvan VOD is temporarily unavailable")
        if response.status_code not in {200, 206}:
            raise ArvanVodError(f"Arvan VOD resource is unavailable (HTTP {response.status_code})")
        length = response.headers.get("content-length")
        if length and (not length.isdecimal() or int(length) > max_bytes):
            raise ArvanVodError("Arvan VOD resource exceeds the size limit")
        content = bytearray()
        async for chunk in response.aiter_bytes():
            content.extend(chunk)
            if len(content) > max_bytes:
                raise ArvanVodError("Arvan VOD resource exceeds the size limit")
        if not content:
            raise ArvanVodError("Arvan VOD resource is empty")
        return ArvanVodObject(
            bytes(content), response.headers.get("content-type", "application/octet-stream"),
            response.status_code, response.headers.get("content-range"),
        )
