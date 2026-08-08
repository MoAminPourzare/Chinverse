import json

import pytest

from app.core.config import settings
from app.core.request_size import RequestSizeLimitMiddleware, request_body_limit


def _scope(*, path: str, content_length: int | None = None) -> dict:
    headers = []
    if content_length is not None:
        headers.append((b"content-length", str(content_length).encode("ascii")))
    return {
        "type": "http",
        "method": "POST",
        "path": path,
        "headers": headers,
    }


@pytest.mark.asyncio
async def test_request_size_rejects_declared_oversized_body_before_endpoint():
    called = False
    sent: list[dict] = []

    async def app(scope, receive, send):
        nonlocal called
        called = True

    async def receive():
        return {"type": "http.request", "body": b"{}", "more_body": False}

    async def send(message):
        sent.append(message)

    middleware = RequestSizeLimitMiddleware(app)
    await middleware(
        _scope(
            path=f"{settings.API_V1_STR}/signup",
            content_length=settings.MAX_API_REQUEST_SIZE_BYTES + 1,
        ),
        receive,
        send,
    )

    assert called is False
    assert sent[0]["status"] == 413
    assert json.loads(sent[1]["body"])["detail"] == "Request body is too large"


@pytest.mark.asyncio
async def test_request_size_counts_chunked_body_without_content_length():
    sent: list[dict] = []
    chunks = iter(
        [
            {
                "type": "http.request",
                "body": b"a" * settings.MAX_API_REQUEST_SIZE_BYTES,
                "more_body": True,
            },
            {"type": "http.request", "body": b"b", "more_body": False},
        ]
    )

    async def receive():
        return next(chunks)

    async def send(message):
        sent.append(message)

    async def body_reader(scope, receive, send):
        while True:
            message = await receive()
            if not message.get("more_body"):
                break

    middleware = RequestSizeLimitMiddleware(body_reader)
    await middleware(
        _scope(path=f"{settings.API_V1_STR}/community/forum/articles"),
        receive,
        send,
    )

    assert sent[0]["status"] == 413


def test_upload_routes_receive_only_their_required_body_budget():
    prefix = settings.API_V1_STR

    assert request_body_limit(f"{prefix}/users/me/avatar") == (
        settings.MAX_IMAGE_UPLOAD_SIZE_BYTES
        + settings.MULTIPART_OVERHEAD_ALLOWANCE_BYTES
    )
    assert request_body_limit(f"{prefix}/admin/dictionary/import") == (
        settings.MAX_DICTIONARY_IMPORT_SIZE_BYTES
        + settings.MULTIPART_OVERHEAD_ALLOWANCE_BYTES
    )
    assert request_body_limit(
        f"{prefix}/courses/admin/courses/1/sections/2/lessons/upload"
    ) == (
        settings.MAX_VIDEO_UPLOAD_SIZE_BYTES
        + settings.MAX_IMAGE_UPLOAD_SIZE_BYTES
        + settings.MULTIPART_OVERHEAD_ALLOWANCE_BYTES
    )
