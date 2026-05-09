import json
from pathlib import Path

from pydantic import computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DEV_SECRET_KEY = "dev-only-change-this-secret-before-production"
PLACEHOLDER_SECRET_KEYS = {
    DEFAULT_DEV_SECRET_KEY,
    "replace-this-with-a-generated-secret-key",
    "generate-with-python-secrets-token-urlsafe",
}
PRODUCTION_ENVIRONMENTS = {"prod", "production"}


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
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql://user:password@localhost:5432/chinverse_db"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE_SECONDS: int = 1800

    SECRET_KEY: str = DEFAULT_DEV_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    API_V1_STR: str = "/api/v1"

    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"
    ALLOWED_HOSTS: str = "*"
    ENABLE_API_DOCS: bool = True
    SECURE_HEADERS_ENABLED: bool = True
    HSTS_ENABLED: bool = False

    ADMIN_EMAILS: str = ""

    @model_validator(mode="after")
    def validate_production_settings(self):
        environment = self.ENVIRONMENT.lower()
        if environment not in PRODUCTION_ENVIRONMENTS:
            return self

        errors: list[str] = []
        cors_origins = parse_setting_list(self.BACKEND_CORS_ORIGINS)
        allowed_hosts = parse_setting_list(self.ALLOWED_HOSTS)

        if self.DEBUG:
            errors.append("DEBUG must be false in production")

        if self.ENABLE_API_DOCS:
            errors.append("ENABLE_API_DOCS must be false in production")

        if self.SECRET_KEY in PLACEHOLDER_SECRET_KEYS or len(self.SECRET_KEY) < 32:
            errors.append("SECRET_KEY must be set to a strong production value")

        if "user:password" in self.DATABASE_URL or "postgres:postgres" in self.DATABASE_URL:
            errors.append("DATABASE_URL still uses the placeholder username/password")

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
    def ASYNC_DATABASE_URL(self) -> str:
        if self.DATABASE_URL and self.DATABASE_URL.startswith("postgresql://"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.DATABASE_URL

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")


settings = Settings()
