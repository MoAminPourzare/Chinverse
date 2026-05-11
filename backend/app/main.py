from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.paths import STATIC_DIR, UPLOADS_DIR, ensure_upload_dirs

app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.ENABLE_API_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_API_DOCS else None,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.ENABLE_API_DOCS else None,
)

app.add_middleware(GZipMiddleware, minimum_size=1024)

if settings.TRUSTED_HOSTS and "*" not in settings.TRUSTED_HOSTS:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.TRUSTED_HOSTS,
    )

if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)

    if settings.SECURE_HEADERS_ENABLED:
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

    if settings.HSTS_ENABLED:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

    if request.url.path.startswith("/uploads/") or request.url.path.startswith("/static/"):
        response.headers.setdefault("Cache-Control", "public, max-age=31536000, immutable")

    return response


ensure_upload_dirs()

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Welcome to ChinVerse API"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}
