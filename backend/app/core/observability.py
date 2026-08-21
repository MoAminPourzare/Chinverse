from __future__ import annotations

from contextvars import ContextVar
from datetime import UTC, datetime
import hmac
import json
import logging
from logging.config import dictConfig
import re
import time
from typing import Any
from urllib.parse import unquote, urlsplit, urlunsplit
from uuid import uuid4

from fastapi import Request
from prometheus_client import CollectorRegistry, Counter, Gauge, Histogram, generate_latest
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.config import resolve_release_sha, settings


REQUEST_ID_HEADER = "X-Request-ID"
REQUEST_ID_RE = re.compile(
    r"^(?:"
    r"[0-9a-f]{32}|"
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|"
    r"[0-9A-HJKMNP-TV-Z]{26}"
    r")$",
    re.IGNORECASE,
)
METRIC_HTTP_METHODS = frozenset(
    {"GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
)
request_id_context: ContextVar[str | None] = ContextVar(
    "chinverse_request_id",
    default=None,
)
deployed_release_sha = resolve_release_sha(settings.RELEASE_SHA)
LOG_EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
LOG_BEARER_RE = re.compile(r"\bBearer\s+[A-Za-z0-9._~+/=-]+", re.IGNORECASE)
LOG_SECRET_RE = re.compile(
    r"(authorization|cookie|password|secret|token|api[_-]?key|x-amz-(?:signature|credential))"
    r"(\s*[:=]\s*)([^\s,;&]+)",
    re.IGNORECASE,
)
LOG_DATABASE_URL_RE = re.compile(
    r"((?:postgres(?:ql)?|redis)(?:\+[a-z0-9]+)?://)[^\s/@:]+(?::[^\s/@]*)?@",
    re.IGNORECASE,
)
SENTRY_IDENTIFIER_SEGMENT_RE = re.compile(
    r"^(?:"
    r"[0-9]+|"
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|"
    r"[0-9A-HJKMNP-TV-Z]{26}|"
    r"[0-9a-f]{16,}"
    r")$",
    re.IGNORECASE,
)
SENTRY_IDENTIFIER_PLACEHOLDER = "{id}"


def _redact_log_text(value: str) -> str:
    redacted = LOG_DATABASE_URL_RE.sub(r"\1[redacted]@", value)
    redacted = LOG_EMAIL_RE.sub("[redacted-email]", redacted)
    redacted = LOG_BEARER_RE.sub("Bearer [redacted]", redacted)
    return LOG_SECRET_RE.sub(r"\1\2[redacted]", redacted)


class JsonLogFormatter(logging.Formatter):
    """Emit a bounded JSON schema without request bodies, credentials or raw URLs."""

    _extra_fields = (
        "event",
        "request_id",
        "method",
        "route",
        "status_code",
        "duration_ms",
        "dependency",
        "outcome",
    )

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname.lower(),
            "service": "chinverse-api",
            "environment": settings.DEPLOYMENT_TIER.lower(),
            "release": deployed_release_sha,
            "logger": record.name,
            "message": _redact_log_text(record.getMessage()),
        }
        context_request_id = request_id_context.get()
        if context_request_id:
            payload["request_id"] = context_request_id
        for field in self._extra_fields:
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = (
                    _redact_log_text(value) if isinstance(value, str) else value
                )
        if record.exc_info:
            payload["exception"] = _redact_log_text(
                self.formatException(record.exc_info)
            )
        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


class RedactingTextFormatter(logging.Formatter):
    def __init__(
        self,
        format: str | None = None,
        datefmt: str | None = None,
        style: str = "%",
    ) -> None:
        super().__init__(fmt=format, datefmt=datefmt, style=style)

    def format(self, record: logging.LogRecord) -> str:
        return _redact_log_text(super().format(record))


def configure_logging() -> None:
    formatter: dict[str, Any]
    if settings.LOG_JSON:
        formatter = {"()": "app.core.observability.JsonLogFormatter"}
    else:
        formatter = {
            "()": "app.core.observability.RedactingTextFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        }
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {"default": formatter},
            "handlers": {
                "stdout": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                    "stream": "ext://sys.stdout",
                }
            },
            "root": {"handlers": ["stdout"], "level": settings.LOG_LEVEL},
            "loggers": {
                "uvicorn": {"handlers": ["stdout"], "level": settings.LOG_LEVEL, "propagate": False},
                "uvicorn.access": {
                    "handlers": ["stdout"],
                    # The default Uvicorn access formatter includes client IPs
                    # and raw URLs/query strings. The bounded request middleware
                    # below is the sole production access log.
                    "level": "CRITICAL",
                    "propagate": False,
                },
                "uvicorn.error": {
                    "handlers": ["stdout"],
                    "level": settings.LOG_LEVEL,
                    "propagate": False,
                },
                # Provider libraries may log signed URLs, headers or connection
                # details at DEBUG. Keep them above the application root level.
                "botocore": {"handlers": ["stdout"], "level": "WARNING", "propagate": False},
                "boto3": {"handlers": ["stdout"], "level": "WARNING", "propagate": False},
                "httpcore": {"handlers": ["stdout"], "level": "WARNING", "propagate": False},
                "httpx": {"handlers": ["stdout"], "level": "WARNING", "propagate": False},
                "urllib3": {"handlers": ["stdout"], "level": "WARNING", "propagate": False},
            },
        }
    )


_SENTRY_SENSITIVE_KEYS = {
    "authorization",
    "proxyauthorization",
    "cookie",
    "cookies",
    "setcookie",
    "xapikey",
    "query",
    "querystring",
    "vars",
    "user",
    "userid",
    "email",
    "ip",
    "ipaddress",
    "username",
    "phone",
    "phonenumber",
    "displayname",
}


def _normalized_sentry_key(value: object) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value).lower())


def _is_sensitive_sentry_key(value: object) -> bool:
    normalized = _normalized_sentry_key(value)
    return (
        normalized in _SENTRY_SENSITIVE_KEYS
        or "password" in normalized
        or "secret" in normalized
        or normalized.endswith("token")
    )


def _redact_sentry_path_identifiers(path: str) -> str:
    return "/".join(
        SENTRY_IDENTIFIER_PLACEHOLDER
        if SENTRY_IDENTIFIER_SEGMENT_RE.fullmatch(unquote(segment))
        else segment
        for segment in path.split("/")
    )


def _redact_sentry_url(value: str) -> str:
    """Drop query/fragment data and group clear identifier path segments."""

    try:
        parsed = urlsplit(value)
    except ValueError:
        path = value.split("?", 1)[0].split("#", 1)[0]
        return _redact_sentry_path_identifiers(path)
    return urlunsplit(
        (
            parsed.scheme,
            parsed.netloc,
            _redact_sentry_path_identifiers(parsed.path),
            "",
            "",
        )
    )


def _scrub_sentry_headers(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: item
            for key, item in value.items()
            if _normalized_sentry_key(key) == "xrequestid"
            and isinstance(item, str)
            and REQUEST_ID_RE.fullmatch(item)
        }
    if isinstance(value, (list, tuple)):
        cleaned: list[Any] = []
        for item in value:
            if (
                isinstance(item, (list, tuple))
                and len(item) == 2
                and _normalized_sentry_key(item[0]) == "xrequestid"
                and isinstance(item[1], str)
                and REQUEST_ID_RE.fullmatch(item[1])
            ):
                cleaned.append(list(item))
        return cleaned
    return None


def _scrub_nested_sentry_values(value: Any) -> Any:
    if isinstance(value, dict):
        scrubbed: dict[Any, Any] = {}
        for key, item in value.items():
            if _is_sensitive_sentry_key(key):
                continue
            if _normalized_sentry_key(key) == "url" and isinstance(item, str):
                scrubbed[key] = _redact_sentry_url(item)
            else:
                scrubbed[key] = _scrub_nested_sentry_values(item)
        return scrubbed
    if isinstance(value, (list, tuple)):
        return [_scrub_nested_sentry_values(item) for item in value]
    if isinstance(value, str):
        return _redact_log_text(value)
    return value


def _scrub_sentry_event(event: dict[str, Any], _hint: dict[str, Any]) -> dict[str, Any]:
    request = event.get("request")
    if isinstance(request, dict):
        request.pop("data", None)
        request.pop("cookies", None)
        request.pop("query_string", None)
        request.pop("env", None)
        raw_url = request.get("url")
        if isinstance(raw_url, str):
            request["url"] = _redact_sentry_url(raw_url)
        raw_headers = request.get("headers")
        if raw_headers is not None:
            request["headers"] = _scrub_sentry_headers(raw_headers)
    event.pop("user", None)
    for field in (
        "breadcrumbs",
        "contexts",
        "extra",
        "modules",
        "server_name",
        "spans",
    ):
        event.pop(field, None)
    tags = event.get("tags")
    request_id = tags.get("request_id") if isinstance(tags, dict) else None
    event["tags"] = (
        {"request_id": request_id}
        if isinstance(request_id, str) and REQUEST_ID_RE.fullmatch(request_id)
        else {}
    )
    transaction = event.get("transaction")
    if isinstance(transaction, str):
        event["transaction"] = _redact_sentry_url(transaction)
    scrubbed = _scrub_nested_sentry_values(event)
    return scrubbed if isinstance(scrubbed, dict) else {}


def configure_sentry() -> None:
    if not settings.SENTRY_DSN:
        return
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.DEPLOYMENT_TIER.lower(),
        release=deployed_release_sha,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        send_default_pii=False,
        include_local_variables=False,
        max_request_body_size="never",
        before_send=_scrub_sentry_event,
        before_send_transaction=_scrub_sentry_event,
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
        ],
    )


METRICS_REGISTRY = CollectorRegistry(auto_describe=True)
HTTP_REQUESTS = Counter(
    "chinverse_http_requests_total",
    "Completed HTTP requests.",
    ("method", "route", "status"),
    registry=METRICS_REGISTRY,
)
HTTP_DURATION = Histogram(
    "chinverse_http_request_duration_seconds",
    "HTTP request duration in seconds.",
    ("method", "route"),
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10),
    registry=METRICS_REGISTRY,
)
HTTP_IN_PROGRESS = Gauge(
    "chinverse_http_requests_in_progress",
    "HTTP requests currently executing.",
    registry=METRICS_REGISTRY,
)
DEPENDENCY_HEALTH = Gauge(
    "chinverse_dependency_health",
    "Most recent dependency health result (1 healthy, 0 failed).",
    ("dependency",),
    registry=METRICS_REGISTRY,
)
CHAT_WEBSOCKET_CONNECTIONS = Gauge(
    "chinverse_chat_websocket_connections",
    "Active WebSocket connections in this process.",
    registry=METRICS_REGISTRY,
)
CHAT_REALTIME_EVENTS = Counter(
    "chinverse_chat_realtime_events_total",
    "Realtime chat events processed by outcome.",
    ("outcome",),
    registry=METRICS_REGISTRY,
)


def record_dependency_health(dependency: str, healthy: bool) -> None:
    if settings.METRICS_ENABLED:
        DEPENDENCY_HEALTH.labels(dependency=dependency).set(1 if healthy else 0)


def record_chat_connection(delta: int) -> None:
    if not settings.METRICS_ENABLED:
        return
    if delta > 0:
        CHAT_WEBSOCKET_CONNECTIONS.inc(delta)
    elif delta < 0:
        CHAT_WEBSOCKET_CONNECTIONS.dec(abs(delta))


def record_chat_realtime_event(outcome: str) -> None:
    if settings.METRICS_ENABLED:
        CHAT_REALTIME_EVENTS.labels(outcome=outcome).inc()


def metrics_authorized(authorization: str | None) -> bool:
    if not settings.METRICS_ENABLED or not authorization:
        return False
    scheme, _, supplied = authorization.partition(" ")
    return scheme.lower() == "bearer" and hmac.compare_digest(
        supplied,
        settings.METRICS_BEARER_TOKEN,
    )


def metrics_payload() -> bytes:
    return generate_latest(METRICS_REGISTRY)


def _request_id(value: str | None) -> str:
    candidate = (value or "").strip()
    return candidate if REQUEST_ID_RE.fullmatch(candidate) else uuid4().hex


def _route_label(request: Request) -> str:
    route = request.scope.get("route")
    route_path = getattr(route, "path", None)
    return str(route_path) if route_path else "unmatched"


def _method_label(method: str) -> str:
    normalized = method.upper()
    return normalized if normalized in METRIC_HTTP_METHODS else "OTHER"


class RequestObservabilityMiddleware:
    """Measure the complete ASGI response, including streamed response bodies."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(
        self,
        scope: Scope,
        receive: Receive,
        send: Send,
    ) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive=receive)
        request_id = _request_id(request.headers.get(REQUEST_ID_HEADER))
        token = request_id_context.set(request_id)
        request.state.request_id = request_id
        sentry_sdk.set_tag("request_id", request_id)
        started_at = time.perf_counter()
        status_code = 500
        response_started = False
        stream_failed = False

        async def send_with_request_id(message: Message) -> None:
            nonlocal status_code, response_started
            if message["type"] == "http.response.start":
                status_code = int(message["status"])
                response_started = True
                headers = [
                    (name, value)
                    for name, value in message.get("headers", [])
                    if name.lower() != REQUEST_ID_HEADER.lower().encode("ascii")
                ]
                headers.append(
                    (REQUEST_ID_HEADER.lower().encode("ascii"), request_id.encode("ascii"))
                )
                message = {**message, "headers": headers}
            await send(message)

        if settings.METRICS_ENABLED:
            HTTP_IN_PROGRESS.inc()
        try:
            try:
                await self.app(scope, receive, send_with_request_id)
            except Exception as exc:
                stream_failed = response_started
                sentry_sdk.capture_exception(exc)
                logging.getLogger("chinverse.request").exception(
                    "Unhandled request exception",
                    extra={
                        "event": "http.request.exception",
                        "request_id": request_id,
                        "method": request.method,
                        "route": _route_label(request),
                        "status_code": status_code if response_started else 500,
                        "outcome": "stream_failed" if response_started else "failed",
                    },
                )
                if response_started:
                    raise
                response = JSONResponse(
                    status_code=500,
                    content={
                        "detail": "Internal server error",
                        "request_id": request_id,
                    },
                    headers={
                        "Cache-Control": "no-store",
                        "X-Content-Type-Options": "nosniff",
                    },
                )
                await response(scope, receive, send_with_request_id)
        finally:
            duration = time.perf_counter() - started_at
            route = _route_label(request)
            if settings.METRICS_ENABLED:
                HTTP_IN_PROGRESS.dec()
                HTTP_REQUESTS.labels(
                    method=_method_label(request.method),
                    route=route,
                    status="stream_error" if stream_failed else str(status_code),
                ).inc()
                HTTP_DURATION.labels(
                    method=_method_label(request.method),
                    route=route,
                ).observe(duration)
            logging.getLogger("chinverse.request").info(
                "HTTP request completed",
                extra={
                    "event": "http.request.completed",
                    "request_id": request_id,
                    "method": request.method,
                    "route": route,
                    "status_code": status_code,
                    "duration_ms": round(duration * 1000, 3),
                    "outcome": "stream_failed" if stream_failed else "completed",
                },
            )
            request_id_context.reset(token)
