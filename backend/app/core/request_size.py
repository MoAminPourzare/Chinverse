from collections.abc import Awaitable, Callable
import json
from typing import Any

from app.core.config import settings


Scope = dict[str, Any]
Message = dict[str, Any]
Receive = Callable[[], Awaitable[Message]]
Send = Callable[[Message], Awaitable[None]]


class RequestBodyTooLarge(Exception):
    pass


def request_body_limit(path: str) -> int:
    api_prefix = settings.API_V1_STR.rstrip("/")
    if not path.startswith(f"{api_prefix}/"):
        return settings.MAX_API_REQUEST_SIZE_BYTES
    if path.endswith("/lessons/upload"):
        return (
            settings.MAX_VIDEO_UPLOAD_SIZE_BYTES
            + settings.MAX_IMAGE_UPLOAD_SIZE_BYTES
            + settings.MULTIPART_OVERHEAD_ALLOWANCE_BYTES
        )
    if path == f"{api_prefix}/admin/dictionary/import":
        return (
            settings.MAX_DICTIONARY_IMPORT_SIZE_BYTES
            + settings.MULTIPART_OVERHEAD_ALLOWANCE_BYTES
        )
    if (
        path == f"{api_prefix}/users/me/avatar"
        or path.startswith(f"{api_prefix}/users/me/gallery")
        or path.startswith(f"{api_prefix}/users/me/services")
    ):
        return (
            settings.MAX_IMAGE_UPLOAD_SIZE_BYTES
            + settings.MULTIPART_OVERHEAD_ALLOWANCE_BYTES
        )
    return settings.MAX_API_REQUEST_SIZE_BYTES


class RequestSizeLimitMiddleware:
    def __init__(self, app: Callable[..., Awaitable[None]]) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        path = str(scope.get("path") or "")
        if not path.startswith(settings.API_V1_STR):
            await self.app(scope, receive, send)
            return

        limit = request_body_limit(path)
        headers = {key.lower(): value for key, value in scope.get("headers", [])}
        content_length = headers.get(b"content-length")
        if content_length is not None:
            try:
                declared_length = int(content_length)
            except ValueError:
                await self._reject(send, 400, "Invalid Content-Length header")
                return
            if declared_length < 0:
                await self._reject(send, 400, "Invalid Content-Length header")
                return
            if declared_length > limit:
                await self._reject(send, 413, "Request body is too large")
                return

        received = 0

        async def limited_receive() -> Message:
            nonlocal received
            message = await receive()
            if message.get("type") == "http.request":
                received += len(message.get("body", b""))
                if received > limit:
                    raise RequestBodyTooLarge
            return message

        try:
            await self.app(scope, limited_receive, send)
        except RequestBodyTooLarge:
            await self._reject(send, 413, "Request body is too large")

    @staticmethod
    async def _reject(send: Send, status_code: int, detail: str) -> None:
        body = json.dumps({"detail": detail}).encode("utf-8")
        await send(
            {
                "type": "http.response.start",
                "status": status_code,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode("ascii")),
                    (b"cache-control", b"no-store"),
                    (b"x-content-type-options", b"nosniff"),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body})
