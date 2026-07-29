import pytest
from pydantic import ValidationError

from app.core.config import Settings, build_async_database_url, parse_setting_list


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
        FILE_STORAGE_MODE="s3",
        OBJECT_STORAGE_ENDPOINT_URL="https://s3.example.test",
        OBJECT_STORAGE_BUCKET_NAME="chinverse-production",
        OBJECT_STORAGE_ACCESS_KEY_ID="test-access-key",
        OBJECT_STORAGE_SECRET_ACCESS_KEY="test-secret-key",
        OBJECT_STORAGE_PUBLIC_BASE_URL="https://assets.chinverse.example",
    )

    assert settings.CORS_ORIGINS == ["https://chinverse.example"]
    assert settings.TRUSTED_HOSTS == ["api.chinverse.example"]
    assert settings.ASYNC_DATABASE_URL.startswith("postgresql+asyncpg://")
    assert settings.USES_OBJECT_STORAGE is True


def test_async_database_url_translates_neon_libpq_parameters():
    async_url = build_async_database_url(
        "postgresql://chinverse:p%40ss@ep-example.neon.tech/chinverse"
        "?sslmode=require&channel_binding=require&application_name=chinverse"
    )

    assert async_url.startswith("postgresql+asyncpg://chinverse:p%40ss@")
    assert "ssl=require" in async_url
    assert "sslmode=" not in async_url
    assert "channel_binding=" not in async_url
    assert "application_name=" not in async_url


def test_s3_mode_requires_complete_object_storage_configuration():
    with pytest.raises(ValidationError, match="Object storage settings are missing"):
        Settings(
            _env_file=None,
            ENVIRONMENT="test",
            FILE_STORAGE_MODE="s3",
            OBJECT_STORAGE_BUCKET_NAME="chinverse-test",
        )
