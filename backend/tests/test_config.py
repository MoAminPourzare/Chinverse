import pytest
from pydantic import ValidationError

from app.core.config import Settings, parse_setting_list


def test_parse_setting_list_supports_csv_json_and_empty_values():
    assert parse_setting_list("one, two ,,three") == ["one", "two", "three"]
    assert parse_setting_list('["one", " two "]') == ["one", "two"]
    assert parse_setting_list("") == []
    assert parse_setting_list(None) == []


def test_production_rejects_placeholder_security_configuration():
    with pytest.raises(ValidationError, match="Invalid production configuration"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://postgres:postgres@example.com/chinverse",
            SECRET_KEY="short",
            BACKEND_CORS_ORIGINS="http://localhost:3000",
            ALLOWED_HOSTS="*",
            ENABLE_API_DOCS=True,
        )


def test_production_accepts_restricted_hosts_and_strong_secret():
    settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        DATABASE_URL="postgresql://chinverse_app:strong-password@db.example.com/chinverse",
        SECRET_KEY="a-strong-production-secret-with-more-than-32-characters",
        BACKEND_CORS_ORIGINS="https://chinverse.example",
        BACKEND_CORS_ORIGIN_REGEX="",
        ALLOWED_HOSTS="api.chinverse.example",
        ENABLE_API_DOCS=False,
        HSTS_ENABLED=True,
    )

    assert settings.CORS_ORIGINS == ["https://chinverse.example"]
    assert settings.TRUSTED_HOSTS == ["api.chinverse.example"]
    assert settings.ASYNC_DATABASE_URL.startswith("postgresql+asyncpg://")
