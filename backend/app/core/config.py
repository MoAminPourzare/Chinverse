import json
import ipaddress
from pathlib import Path

from pydantic import computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DEV_SECRET_KEY = "dev-only-change-this-secret-before-production"
PLACEHOLDER_SECRET_KEYS = {
    DEFAULT_DEV_SECRET_KEY,
    "replace-this-with-a-generated-secret-key",
    "generate-with-python-secrets-token-urlsafe",
}
PRODUCTION_ENVIRONMENTS = {"prod", "production"}
DEPLOYMENT_TIERS = {"local", "staging", "production"}


def build_async_database_url(database_url: str) -> str:
    """Translate provider-style PostgreSQL URLs for SQLAlchemy's asyncpg driver."""
    if not database_url:
        return database_url

    parsed_url = make_url(database_url)
    if parsed_url.get_backend_name() not in {"postgres", "postgresql"}:
        return database_url

    query = dict(parsed_url.query)
    ssl_mode = query.pop("sslmode", None)
    if ssl_mode and "ssl" not in query:
        query["ssl"] = ssl_mode

    # libpq supports these parameters, but asyncpg expects different APIs.
    query.pop("channel_binding", None)
    query.pop("application_name", None)

    async_url = parsed_url.set(drivername="postgresql+asyncpg", query=query)
    return async_url.render_as_string(hide_password=False)


def parse_setting_list(value) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    if isinstance(value, str):
        raw_value = value.strip()
        if not raw_value:
            return []

        if raw_value.startswith("["):
            parsed_value = json.loads(raw_value)
            return [str(item).strip() for item in parsed_value if str(item).strip()]

        return [item.strip() for item in raw_value.split(",") if item.strip()]

    return []


class Settings(BaseSettings):
    PROJECT_NAME: str = "ChinVerse API"
    ENVIRONMENT: str = "local"
    DEPLOYMENT_TIER: str = "staging"
    RELEASE_SHA: str = "local"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql://user:password@localhost:5432/chinverse_db"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE_SECONDS: int = 1800

    SECRET_KEY: str = DEFAULT_DEV_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    REFRESH_COOKIE_NAME: str = "chinverse_refresh"
    REFRESH_COOKIE_SECURE: bool = True
    REFRESH_COOKIE_SAMESITE: str = "strict"
    AUTH_DEBUG_TOKENS: bool = False
    REQUIRE_VERIFIED_LOGIN: bool = False
    AUTH_DELIVERY_WEBHOOK_URL: str = ""
    AUTH_DELIVERY_WEBHOOK_SECRET: str = ""
    AUTH_PUBLIC_APP_URL: str = "http://localhost:3000"
    LOGIN_MAX_FAILURES: int = 5
    LOGIN_LOCK_MINUTES: int = 15
    MFA_ENCRYPTION_KEY: str = ""
    API_V1_STR: str = "/api/v1"
    API_DEFAULT_PAGE_SIZE: int = 20
    API_MAX_PAGE_SIZE: int = 100

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_BACKEND: str = "database"
    RATE_LIMIT_AUTH_REQUESTS: int = 10
    RATE_LIMIT_AUTH_WINDOW_SECONDS: int = 60
    RATE_LIMIT_AUTH_CHALLENGE_REQUESTS: int = 10
    RATE_LIMIT_AUTH_CHALLENGE_WINDOW_SECONDS: int = 60
    RATE_LIMIT_ACCOUNT_LOGIN_REQUESTS: int = 20
    RATE_LIMIT_ACCOUNT_LOGIN_WINDOW_SECONDS: int = 900
    RATE_LIMIT_WRITE_REQUESTS: int = 60
    RATE_LIMIT_WRITE_WINDOW_SECONDS: int = 60
    RATE_LIMIT_UPLOAD_REQUESTS: int = 20
    RATE_LIMIT_UPLOAD_WINDOW_SECONDS: int = 300
    TRUST_PROXY_HEADERS: bool = False
    TRUSTED_PROXY_COUNT: int = 1
    TRUSTED_PROXY_NETWORKS: str = ""
    TURNSTILE_ENABLED: bool = False
    TURNSTILE_SECRET_KEY: str = ""
    TURNSTILE_EXPECTED_HOSTNAMES: str = ""
    TURNSTILE_VERIFY_URL: str = (
        "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    )

    MAX_IMAGE_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024
    MAX_IMAGE_PIXEL_COUNT: int = 40_000_000
    ALLOWED_IMAGE_EXTENSIONS: str = "jpg,jpeg,jfif,png,webp,heic,heif,gif,avif,bmp,tif,tiff"
    ALLOWED_IMAGE_CONTENT_TYPES: str = "image/jpeg,image/pjpeg,image/png,image/webp,image/heic,image/heif,image/heic-sequence,image/heif-sequence,image/gif,image/avif,image/bmp,image/x-ms-bmp,image/tiff,application/octet-stream"
    MAX_VIDEO_UPLOAD_SIZE_BYTES: int = 500 * 1024 * 1024
    MAX_DICTIONARY_IMPORT_SIZE_BYTES: int = 10 * 1024 * 1024
    MAX_API_REQUEST_SIZE_BYTES: int = 2 * 1024 * 1024
    MULTIPART_OVERHEAD_ALLOWANCE_BYTES: int = 1024 * 1024
    ALLOWED_VIDEO_EXTENSIONS: str = "mp4,webm,mov,m4v"
    ALLOWED_VIDEO_CONTENT_TYPES: str = "video/mp4,video/webm,video/quicktime,video/x-m4v"
    FILE_STORAGE_MODE: str = "local"
    OBJECT_STORAGE_ENDPOINT_URL: str = ""
    OBJECT_STORAGE_BUCKET_NAME: str = ""
    OBJECT_STORAGE_ACCESS_KEY_ID: str = ""
    OBJECT_STORAGE_SECRET_ACCESS_KEY: str = ""
    OBJECT_STORAGE_PUBLIC_BASE_URL: str = ""
    OBJECT_STORAGE_REGION: str = "us-east-1"
    OBJECT_STORAGE_ADDRESSING_STYLE: str = "path"

    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://0.0.0.0:3000"
    BACKEND_CORS_ORIGIN_REGEX: str = (
        r"^https?://("
        r"localhost|127\.0\.0\.1|0\.0\.0\.0|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|"
        r"192\.168\.\d{1,3}\.\d{1,3}"
        r")(:\d+)?$"
    )
    ALLOWED_HOSTS: str = "*"
    ENABLE_API_DOCS: bool = True
    SECURE_HEADERS_ENABLED: bool = True
    HSTS_ENABLED: bool = False

    FEATURE_SUBSCRIPTIONS_ENABLED: bool = False
    FEATURE_REFERRALS_ENABLED: bool = False
    FEATURE_POINTS_ENABLED: bool = False

    @model_validator(mode="after")
    def validate_production_settings(self):
        environment = self.ENVIRONMENT.lower()
        deployment_tier = self.DEPLOYMENT_TIER.lower()
        storage_mode = self.FILE_STORAGE_MODE.strip().lower()
        self.FILE_STORAGE_MODE = storage_mode
        self.RATE_LIMIT_BACKEND = self.RATE_LIMIT_BACKEND.strip().lower()
        self.REFRESH_COOKIE_SAMESITE = self.REFRESH_COOKIE_SAMESITE.strip().lower()

        if deployment_tier not in DEPLOYMENT_TIERS:
            raise ValueError(
                "DEPLOYMENT_TIER must be one of: " + ", ".join(sorted(DEPLOYMENT_TIERS))
            )

        errors: list[str] = []
        if self.RATE_LIMIT_BACKEND not in {"memory", "database"}:
            errors.append("RATE_LIMIT_BACKEND must be either 'memory' or 'database'")
        if self.ALGORITHM not in {"HS256", "HS384", "HS512"}:
            errors.append("ALGORITHM must use an approved HMAC SHA-2 algorithm")
        if self.REFRESH_COOKIE_SAMESITE not in {"lax", "strict", "none"}:
            errors.append(
                "REFRESH_COOKIE_SAMESITE must be one of: lax, strict, none"
            )
        if (
            self.REFRESH_COOKIE_SAMESITE == "none"
            and not self.REFRESH_COOKIE_SECURE
        ):
            errors.append("SameSite=None refresh cookies must be Secure")
        if storage_mode not in {"local", "s3"}:
            errors.append("FILE_STORAGE_MODE must be either 'local' or 's3'")
        positive_settings = {
            "ACCESS_TOKEN_EXPIRE_MINUTES": self.ACCESS_TOKEN_EXPIRE_MINUTES,
            "REFRESH_TOKEN_EXPIRE_DAYS": self.REFRESH_TOKEN_EXPIRE_DAYS,
            "LOGIN_MAX_FAILURES": self.LOGIN_MAX_FAILURES,
            "LOGIN_LOCK_MINUTES": self.LOGIN_LOCK_MINUTES,
            "TRUSTED_PROXY_COUNT": self.TRUSTED_PROXY_COUNT,
            "RATE_LIMIT_ACCOUNT_LOGIN_REQUESTS": self.RATE_LIMIT_ACCOUNT_LOGIN_REQUESTS,
            "RATE_LIMIT_ACCOUNT_LOGIN_WINDOW_SECONDS": self.RATE_LIMIT_ACCOUNT_LOGIN_WINDOW_SECONDS,
            "RATE_LIMIT_AUTH_REQUESTS": self.RATE_LIMIT_AUTH_REQUESTS,
            "RATE_LIMIT_AUTH_WINDOW_SECONDS": self.RATE_LIMIT_AUTH_WINDOW_SECONDS,
            "RATE_LIMIT_AUTH_CHALLENGE_REQUESTS": self.RATE_LIMIT_AUTH_CHALLENGE_REQUESTS,
            "RATE_LIMIT_AUTH_CHALLENGE_WINDOW_SECONDS": self.RATE_LIMIT_AUTH_CHALLENGE_WINDOW_SECONDS,
            "RATE_LIMIT_WRITE_REQUESTS": self.RATE_LIMIT_WRITE_REQUESTS,
            "RATE_LIMIT_WRITE_WINDOW_SECONDS": self.RATE_LIMIT_WRITE_WINDOW_SECONDS,
            "RATE_LIMIT_UPLOAD_REQUESTS": self.RATE_LIMIT_UPLOAD_REQUESTS,
            "RATE_LIMIT_UPLOAD_WINDOW_SECONDS": self.RATE_LIMIT_UPLOAD_WINDOW_SECONDS,
            "MAX_IMAGE_UPLOAD_SIZE_BYTES": self.MAX_IMAGE_UPLOAD_SIZE_BYTES,
            "MAX_IMAGE_PIXEL_COUNT": self.MAX_IMAGE_PIXEL_COUNT,
            "MAX_VIDEO_UPLOAD_SIZE_BYTES": self.MAX_VIDEO_UPLOAD_SIZE_BYTES,
            "MAX_DICTIONARY_IMPORT_SIZE_BYTES": self.MAX_DICTIONARY_IMPORT_SIZE_BYTES,
            "MAX_API_REQUEST_SIZE_BYTES": self.MAX_API_REQUEST_SIZE_BYTES,
            "MULTIPART_OVERHEAD_ALLOWANCE_BYTES": self.MULTIPART_OVERHEAD_ALLOWANCE_BYTES,
        }
        for name, value in positive_settings.items():
            if value < 1:
                errors.append(f"{name} must be greater than zero")

        trusted_proxy_networks = parse_setting_list(self.TRUSTED_PROXY_NETWORKS)
        for network in trusted_proxy_networks:
            try:
                ipaddress.ip_network(network, strict=False)
            except ValueError:
                errors.append(f"TRUSTED_PROXY_NETWORKS contains an invalid CIDR: {network}")

        if storage_mode == "s3":
            object_storage_settings = {
                "OBJECT_STORAGE_ENDPOINT_URL": self.OBJECT_STORAGE_ENDPOINT_URL,
                "OBJECT_STORAGE_BUCKET_NAME": self.OBJECT_STORAGE_BUCKET_NAME,
                "OBJECT_STORAGE_ACCESS_KEY_ID": self.OBJECT_STORAGE_ACCESS_KEY_ID,
                "OBJECT_STORAGE_SECRET_ACCESS_KEY": self.OBJECT_STORAGE_SECRET_ACCESS_KEY,
                "OBJECT_STORAGE_PUBLIC_BASE_URL": self.OBJECT_STORAGE_PUBLIC_BASE_URL,
            }
            missing = [
                name
                for name, value in object_storage_settings.items()
                if not value.strip()
            ]
            if missing:
                errors.append(
                    "Object storage settings are missing: " + ", ".join(missing)
                )
            if self.OBJECT_STORAGE_ADDRESSING_STYLE not in {"path", "virtual"}:
                errors.append(
                    "OBJECT_STORAGE_ADDRESSING_STYLE must be either 'path' or 'virtual'"
                )

        is_production_runtime = (
            environment in PRODUCTION_ENVIRONMENTS
            or deployment_tier == "production"
        )
        if not is_production_runtime:
            if errors:
                raise ValueError("Invalid configuration: " + "; ".join(errors))
            return self

        cors_origins = parse_setting_list(self.BACKEND_CORS_ORIGINS)
        allowed_hosts = parse_setting_list(self.ALLOWED_HOSTS)

        if self.DEBUG:
            errors.append("DEBUG must be false in production")

        if self.AUTH_DEBUG_TOKENS:
            errors.append("AUTH_DEBUG_TOKENS must be false in production")

        if self.ENABLE_API_DOCS:
            errors.append("ENABLE_API_DOCS must be false in production")

        if not self.SECURE_HEADERS_ENABLED:
            errors.append("SECURE_HEADERS_ENABLED must be true in production")

        if not self.HSTS_ENABLED:
            errors.append("HSTS_ENABLED must be true in production")

        if self.BACKEND_CORS_ORIGIN_REGEX.strip():
            errors.append("BACKEND_CORS_ORIGIN_REGEX must be empty in production")

        if self.SECRET_KEY in PLACEHOLDER_SECRET_KEYS or len(self.SECRET_KEY) < 32:
            errors.append("SECRET_KEY must be set to a strong production value")

        if deployment_tier == "production":
            if not self.RATE_LIMIT_ENABLED:
                errors.append("RATE_LIMIT_ENABLED must be true in production")
            if self.RATE_LIMIT_BACKEND != "database":
                errors.append("RATE_LIMIT_BACKEND must be 'database' in production")
            if not self.REFRESH_COOKIE_SECURE:
                errors.append("REFRESH_COOKIE_SECURE must be true in production")
            if not self.REFRESH_COOKIE_NAME.startswith("__Host-"):
                errors.append("REFRESH_COOKIE_NAME must use the __Host- prefix in production")
            if self.REFRESH_COOKIE_SAMESITE != "strict":
                errors.append("REFRESH_COOKIE_SAMESITE must be 'strict' in production")
            if self.ACCESS_TOKEN_EXPIRE_MINUTES > 15:
                errors.append("ACCESS_TOKEN_EXPIRE_MINUTES must not exceed 15 in production")
            if self.REFRESH_TOKEN_EXPIRE_DAYS > 30:
                errors.append("REFRESH_TOKEN_EXPIRE_DAYS must not exceed 30 in production")
            if not self.TRUST_PROXY_HEADERS:
                errors.append("TRUST_PROXY_HEADERS must be true in production")
            if not trusted_proxy_networks:
                errors.append("TRUSTED_PROXY_NETWORKS is required in production")
            if not self.REQUIRE_VERIFIED_LOGIN:
                errors.append("REQUIRE_VERIFIED_LOGIN must be true in production")
            if self.REQUIRE_VERIFIED_LOGIN and not self.AUTH_DELIVERY_WEBHOOK_URL.strip():
                errors.append(
                    "AUTH_DELIVERY_WEBHOOK_URL is required for account verification in production"
                )
            if self.AUTH_DELIVERY_WEBHOOK_URL and not self.AUTH_DELIVERY_WEBHOOK_URL.startswith(
                "https://"
            ):
                errors.append("AUTH_DELIVERY_WEBHOOK_URL must use HTTPS in production")
            if len(self.AUTH_DELIVERY_WEBHOOK_SECRET) < 32:
                errors.append(
                    "AUTH_DELIVERY_WEBHOOK_SECRET must be a strong production secret"
                )
            if not self.AUTH_PUBLIC_APP_URL.startswith("https://"):
                errors.append("AUTH_PUBLIC_APP_URL must use HTTPS in production")
            if not self.TURNSTILE_ENABLED:
                errors.append("TURNSTILE_ENABLED must be true in production")
            if not self.TURNSTILE_SECRET_KEY.strip():
                errors.append("TURNSTILE_SECRET_KEY is required in production")
            if not parse_setting_list(self.TURNSTILE_EXPECTED_HOSTNAMES):
                errors.append("TURNSTILE_EXPECTED_HOSTNAMES is required in production")
            if len(self.MFA_ENCRYPTION_KEY) < 32:
                errors.append("MFA_ENCRYPTION_KEY must be a strong production key")

        if "user:password" in self.DATABASE_URL or "postgres:postgres" in self.DATABASE_URL:
            errors.append("DATABASE_URL still uses the placeholder username/password")

        if storage_mode != "s3":
            errors.append("FILE_STORAGE_MODE must be 's3' in production")
        else:
            if not self.OBJECT_STORAGE_ENDPOINT_URL.startswith("https://"):
                errors.append("OBJECT_STORAGE_ENDPOINT_URL must use HTTPS in production")
            if not self.OBJECT_STORAGE_PUBLIC_BASE_URL.startswith("https://"):
                errors.append(
                    "OBJECT_STORAGE_PUBLIC_BASE_URL must use HTTPS in production"
                )

        if not cors_origins:
            errors.append("BACKEND_CORS_ORIGINS must include the production frontend origin")

        if "*" in cors_origins:
            errors.append("BACKEND_CORS_ORIGINS cannot contain '*' in production")

        if cors_origins and all(
            "localhost" in origin or "127.0.0.1" in origin
            for origin in cors_origins
        ):
            errors.append("BACKEND_CORS_ORIGINS only contains local development origins")

        if not allowed_hosts or "*" in allowed_hosts:
            errors.append("ALLOWED_HOSTS must be restricted in production")

        if errors:
            raise ValueError("Invalid production configuration: " + "; ".join(errors))

        return self

    @computed_field
    @property
    def CORS_ORIGINS(self) -> list[str]:
        return parse_setting_list(self.BACKEND_CORS_ORIGINS)

    @computed_field
    @property
    def TRUSTED_HOSTS(self) -> list[str]:
        return parse_setting_list(self.ALLOWED_HOSTS)

    @computed_field
    @property
    def TRUSTED_PROXY_CIDRS(self) -> list[str]:
        return parse_setting_list(self.TRUSTED_PROXY_NETWORKS)

    @computed_field
    @property
    def IS_PUBLIC_RELEASE(self) -> bool:
        return self.DEPLOYMENT_TIER.lower() == "production"

    @computed_field
    @property
    def IMAGE_EXTENSIONS(self) -> list[str]:
        return [item.lower().lstrip(".") for item in parse_setting_list(self.ALLOWED_IMAGE_EXTENSIONS)]

    @computed_field
    @property
    def IMAGE_CONTENT_TYPES(self) -> list[str]:
        return [item.lower() for item in parse_setting_list(self.ALLOWED_IMAGE_CONTENT_TYPES)]

    @computed_field
    @property
    def VIDEO_EXTENSIONS(self) -> list[str]:
        return [item.lower().lstrip(".") for item in parse_setting_list(self.ALLOWED_VIDEO_EXTENSIONS)]

    @computed_field
    @property
    def VIDEO_CONTENT_TYPES(self) -> list[str]:
        return [item.lower() for item in parse_setting_list(self.ALLOWED_VIDEO_CONTENT_TYPES)]

    @computed_field
    @property
    def TURNSTILE_HOSTNAMES(self) -> list[str]:
        return [item.lower() for item in parse_setting_list(self.TURNSTILE_EXPECTED_HOSTNAMES)]

    @computed_field
    @property
    def USES_OBJECT_STORAGE(self) -> bool:
        return self.FILE_STORAGE_MODE == "s3"

    @computed_field
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        return build_async_database_url(self.DATABASE_URL)

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")


settings = Settings()
