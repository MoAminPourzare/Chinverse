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


def test_public_deployment_tier_cannot_bypass_production_validation():
    with pytest.raises(ValidationError, match="Invalid production configuration"):
        Settings(
            _env_file=None,
            ENVIRONMENT="local",
            DEPLOYMENT_TIER="production",
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
        DEPLOYMENT_TIER="production",
        REQUIRE_VERIFIED_LOGIN=True,
        MFA_ENCRYPTION_KEY="mfa-encryption-key-for-automated-production-tests",
        AUTH_DELIVERY_WEBHOOK_URL="https://notifications.example.test/challenges",
        AUTH_DELIVERY_WEBHOOK_SECRET="delivery-webhook-secret-for-automated-tests",
        AUTH_PUBLIC_APP_URL="https://chinverse.example",
        REFRESH_COOKIE_NAME="__Host-chinverse_refresh",
        REFRESH_COOKIE_SAMESITE="strict",
        RATE_LIMIT_ENABLED=True,
        RATE_LIMIT_BACKEND="database",
        TRUST_PROXY_HEADERS=True,
        TRUSTED_PROXY_NETWORKS="10.0.0.0/8",
        TURNSTILE_ENABLED=True,
        TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA",
        TURNSTILE_EXPECTED_HOSTNAMES="chinverse.example",
    )

    assert settings.CORS_ORIGINS == ["https://chinverse.example"]
    assert settings.TRUSTED_HOSTS == ["api.chinverse.example"]
    assert settings.ASYNC_DATABASE_URL.startswith("postgresql+asyncpg://")
    assert settings.USES_OBJECT_STORAGE is True


def test_public_release_requires_verified_login_and_mfa_key():
    with pytest.raises(ValidationError, match="MFA_ENCRYPTION_KEY"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            DEPLOYMENT_TIER="production",
            DATABASE_URL="postgresql://chinverse_app:strong-password@db.example.com/chinverse",
            SECRET_KEY="a-strong-production-secret-with-more-than-32-characters",
            BACKEND_CORS_ORIGINS="https://chinverse.example",
            BACKEND_CORS_ORIGIN_REGEX="",
            ALLOWED_HOSTS="api.chinverse.example",
            ENABLE_API_DOCS=False,
            FILE_STORAGE_MODE="s3",
            OBJECT_STORAGE_ENDPOINT_URL="https://s3.example.test",
            OBJECT_STORAGE_BUCKET_NAME="chinverse-production",
            OBJECT_STORAGE_ACCESS_KEY_ID="test-access-key",
            OBJECT_STORAGE_SECRET_ACCESS_KEY="test-secret-key",
            OBJECT_STORAGE_PUBLIC_BASE_URL="https://assets.chinverse.example",
            REQUIRE_VERIFIED_LOGIN=True,
        )


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


def test_production_runtime_accepts_mounted_storage_only_for_staging_tier():
    staging = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        DEPLOYMENT_TIER="staging",
        DATABASE_URL="postgresql://chinverse_app:strong-password@db.example.com/chinverse",
        SECRET_KEY="a-strong-production-secret-with-more-than-32-characters",
        BACKEND_CORS_ORIGINS="https://chinverse.vercel.app",
        BACKEND_CORS_ORIGIN_REGEX=" ",
        ALLOWED_HOSTS="moamin9-chinverse-api.hf.space",
        ENABLE_API_DOCS=False,
        HSTS_ENABLED=True,
        FILE_STORAGE_MODE="mounted",
        MOUNTED_STORAGE_ROOT="/data",
    )

    assert staging.USES_MOUNTED_STORAGE is True
    assert staging.USES_OBJECT_STORAGE is False

    with pytest.raises(ValidationError, match="FILE_STORAGE_MODE must be s3"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            DEPLOYMENT_TIER="production",
            DATABASE_URL="postgresql://chinverse_app:strong-password@db.example.com/chinverse",
            SECRET_KEY="a-strong-production-secret-with-more-than-32-characters",
            BACKEND_CORS_ORIGINS="https://chinverse.example",
            BACKEND_CORS_ORIGIN_REGEX="",
            ALLOWED_HOSTS="api.chinverse.example",
            ENABLE_API_DOCS=False,
            HSTS_ENABLED=True,
            FILE_STORAGE_MODE="mounted",
            MOUNTED_STORAGE_ROOT="/data",
            REQUIRE_VERIFIED_LOGIN=True,
            MFA_ENCRYPTION_KEY="mfa-encryption-key-for-automated-production-tests",
            AUTH_DELIVERY_WEBHOOK_URL="https://notifications.example.test/challenges",
            AUTH_DELIVERY_WEBHOOK_SECRET="delivery-webhook-secret-for-automated-tests",
            AUTH_PUBLIC_APP_URL="https://chinverse.example",
            REFRESH_COOKIE_NAME="__Host-chinverse_refresh",
            RATE_LIMIT_BACKEND="database",
            TRUST_PROXY_HEADERS=True,
            TRUSTED_PROXY_NETWORKS="10.0.0.0/8",
            TURNSTILE_ENABLED=True,
            TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA",
            TURNSTILE_EXPECTED_HOSTNAMES="chinverse.example",
        )
