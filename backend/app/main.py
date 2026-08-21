from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from prometheus_client import CONTENT_TYPE_LATEST
import sentry_sdk
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.v1.api import api_router
from app.core.browser_origin import is_allowed_browser_origin
from app.core.config import resolve_release_sha, settings
from app.core.health import readiness_checks
from app.core.observability import (
    RequestObservabilityMiddleware,
    configure_logging,
    configure_sentry,
    metrics_authorized,
    metrics_payload,
)
from app.core.paths import (
    AVATARS_DIR,
    GALLERY_UPLOAD_DIR,
    SERVICE_UPLOAD_DIR,
    STATIC_DIR,
    ensure_upload_dirs,
)
from app.core.request_size import RequestSizeLimitMiddleware
from app.db.session import engine
from app.api.v1.endpoints.chat import start_chat_realtime, stop_chat_realtime

configure_logging()
configure_sentry()
deployed_release_sha = resolve_release_sha(settings.RELEASE_SHA)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await start_chat_realtime()
    try:
        yield
    finally:
        await stop_chat_realtime()
        await engine.dispose()
        sentry_sdk.flush(timeout=2.0)

app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.ENABLE_API_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_API_DOCS else None,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.ENABLE_API_DOCS else None,
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(RequestSizeLimitMiddleware)
app.add_middleware(RequestObservabilityMiddleware)

if settings.TRUSTED_HOSTS and "*" not in settings.TRUSTED_HOSTS:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.TRUSTED_HOSTS,
    )

if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_origin_regex=settings.BACKEND_CORS_ORIGIN_REGEX or None,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def _is_allowed_browser_origin(origin: str) -> bool:
    return is_allowed_browser_origin(
        origin,
        allowed_origins=settings.CORS_ORIGINS,
        allowed_origin_regex=settings.BACKEND_CORS_ORIGIN_REGEX,
    )


@app.middleware("http")
async def add_security_headers(request, call_next):
    origin = request.headers.get("origin")
    if origin and not _is_allowed_browser_origin(origin):
        response = JSONResponse(
            status_code=403,
            content={"detail": "Origin not allowed"},
        )
    else:
        response = await call_next(request)

    if settings.SECURE_HEADERS_ENABLED:
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
        )

    response.headers.setdefault("X-Chinverse-Deployment-Tier", settings.DEPLOYMENT_TIER.lower())
    if not settings.IS_PUBLIC_RELEASE:
        response.headers.setdefault("X-Robots-Tag", "noindex, nofollow, noarchive")

    if settings.HSTS_ENABLED:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

    if request.url.path.startswith("/uploads/") or request.url.path.startswith("/static/"):
        response.headers.setdefault("Cache-Control", "public, max-age=31536000, immutable")
    elif (
        request.url.path.startswith(settings.API_V1_STR)
        or request.url.path.startswith("/health")
        or request.url.path == "/metrics"
    ):
        # API responses can contain account data even on routes that also expose
        # public content. Keep them out of browser and intermediary caches until
        # a route is explicitly designed and tested as a public cache surface.
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
    return response


ensure_upload_dirs()

# Only user-facing image collections are public. Course videos, HLS manifests,
# segments, keys and lesson thumbnails live under the same storage root but must
# be read exclusively through the entitlement-checked signed media gateway.
app.mount("/uploads/avatars", StaticFiles(directory=str(AVATARS_DIR)), name="upload-avatars")
app.mount("/uploads/gallery", StaticFiles(directory=str(GALLERY_UPLOAD_DIR)), name="upload-gallery")
app.mount("/uploads/services", StaticFiles(directory=str(SERVICE_UPLOAD_DIR)), name="upload-services")
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Welcome to ChinVerse API"}


@app.get("/metrics", include_in_schema=False)
async def metrics(request: Request):
    if not settings.METRICS_ENABLED:
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    if not metrics_authorized(request.headers.get("authorization")):
        return JSONResponse(
            status_code=401,
            content={"detail": "Authentication required"},
            headers={"WWW-Authenticate": "Bearer", "Cache-Control": "no-store"},
        )
    return Response(
        content=metrics_payload(),
        media_type=CONTENT_TYPE_LATEST,
        headers={"Cache-Control": "no-store"},
    )


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "chinverse-api",
        "deployment_tier": settings.DEPLOYMENT_TIER.lower(),
        "release": deployed_release_sha,
    }


@app.get("/health/ready")
async def readiness_check():
    checks = await readiness_checks()
    if any(result != "ok" for result in checks.values()):
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "checks": checks},
        )
    return {"status": "ok", "checks": checks}
