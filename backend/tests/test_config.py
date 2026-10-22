import pytest
from pydantic import ValidationError

from app.core.config import (
    Settings,
    build_async_database_url,
    database_url_matches_neon_endpoint,
    parse_setting_list,
    resolve_release_sha,
)


def test_parse_setting_list_supports_csv_json_and_empty_values():
    assert parse_setting_list("one, two ,,three") == ["one", "two", "three"]
    assert parse_setting_list('["one", " two "]') == ["one", "two"]
    assert parse_setting_list("") == []
    assert parse_setting_list(None) == []


def test_release_sha_prefers_valid_immutable_artifact(tmp_path):
    artifact = tmp_path / "RELEASE_SHA"
    artifact.write_text("a" * 40 + "\n", encoding="ascii")
    assert resolve_release_sha("environment-release", artifact) == "a" * 40

    artifact.write_text("not-a-release", encoding="ascii")
    assert resolve_release_sha("environment-release", artifact) == "environment-release"


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
        MEDIA_OBJECT_STORAGE_BUCKET_NAME="chinverse-private-media",
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
            MEDIA_OBJECT_STORAGE_BUCKET_NAME="chinverse-private-media",
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


@pytest.mark.parametrize(
    "host",
    [
        "ep-wild-band-atse2yoq.us-east-2.aws.neon.tech",
        "ep-wild-band-atse2yoq-pooler.us-east-2.aws.neon.tech",
    ],
)
def test_database_target_guard_accepts_direct_and_pooled_neon_hosts(host):
    assert database_url_matches_neon_endpoint(
        f"postgresql://chinverse:secret@{host}/neondb",
        "ep-wild-band-atse2yoq",
    )


@pytest.mark.parametrize(
    "database_url,endpoint_id",
    [
        (
            "postgresql://chinverse:secret@ep-production.us-east-2.aws.neon.tech/neondb",
            "ep-wild-band-atse2yoq",
        ),
        (
            "postgresql://chinverse:secret@ep-wild-band-atse2yoq.example.com/neondb",
            "ep-wild-band-atse2yoq",
        ),
        (
            "postgresql://chinverse:secret@ep-wild-band-atse2yoq.us-east-2.aws.neon.tech/neondb",
            "not-an-endpoint",
        ),
    ],
)
def test_database_target_guard_rejects_wrong_provider_or_endpoint(
    database_url,
    endpoint_id,
):
    assert not database_url_matches_neon_endpoint(database_url, endpoint_id)


def test_s3_mode_requires_complete_object_storage_configuration():
    with pytest.raises(ValidationError, match="Object storage settings are missing"):
        Settings(
            _env_file=None,
            ENVIRONMENT="test",
            FILE_STORAGE_MODE="s3",
            OBJECT_STORAGE_BUCKET_NAME="chinverse-test",
        )


def test_phase7_operational_settings_are_bounded_and_fail_closed():
    local = Settings(
        _env_file=None,
        ENVIRONMENT="test",
        CHAT_REALTIME_POLL_INTERVAL_SECONDS=0.25,
    )
    assert local.CHAT_REALTIME_POLL_INTERVAL_SECONDS == 0.25

    with pytest.raises(ValidationError, match="METRICS_BEARER_TOKEN"):
        Settings(
            _env_file=None,
            ENVIRONMENT="test",
            METRICS_ENABLED=True,
            METRICS_BEARER_TOKEN="short",
        )

    with pytest.raises(ValidationError, match="SENTRY_TRACES_SAMPLE_RATE"):
        Settings(
            _env_file=None,
            ENVIRONMENT="test",
            SENTRY_TRACES_SAMPLE_RATE=1.1,
        )

    with pytest.raises(ValidationError, match="CHAT_MAX_CONNECTIONS_PER_USER"):
        Settings(
            _env_file=None,
            ENVIRONMENT="test",
            CHAT_MAX_CONNECTIONS_PER_USER=21,
        )

    with pytest.raises(ValidationError, match="HEALTHCHECK_CACHE_TTL_SECONDS"):
        Settings(
            _env_file=None,
            ENVIRONMENT="test",
            HEALTHCHECK_CACHE_TTL_SECONDS=301,
        )

    with pytest.raises(ValidationError, match="CHAT_REALTIME_BACKEND"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            DEPLOYMENT_TIER="staging",
            CHAT_REALTIME_BACKEND="memory",
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

    with pytest.raises(ValidationError, match="LOG_LEVEL must not be DEBUG"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            DEPLOYMENT_TIER="staging",
            LOG_LEVEL="DEBUG",
        )

    with pytest.raises(ValidationError, match="LOG_JSON must be true"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            DEPLOYMENT_TIER="staging",
            LOG_JSON=False,
        )


def test_phase8_beta_and_payment_settings_are_fail_closed():
    closed = Settings(_env_file=None)
    assert closed.FEATURE_BETA_ENABLED is False
    assert closed.PAYMENT_PROVIDER == "disabled"

    with pytest.raises(ValidationError, match="BETA_INVITE_HASH_SECRET"):
        Settings(
            _env_file=None,
            FEATURE_BETA_ENABLED=True,
            BETA_INVITE_REQUIRED=True,
        )

    with pytest.raises(ValidationError, match="BETA_ALLOWED_EMAILS"):
        Settings(
            _env_file=None,
            BETA_ALLOWED_EMAILS="not-an-email",
        )

    with pytest.raises(ValidationError, match="PAYMENT_WEBHOOK_SECRET"):
        Settings(
            _env_file=None,
            PAYMENT_PROVIDER="generic_hmac",
        )

    with pytest.raises(ValidationError, match="FEATURE_SUBSCRIPTIONS_ENABLED"):
        Settings(
            _env_file=None,
            FEATURE_SUBSCRIPTIONS_ENABLED=True,
        )


def test_production_runtime_accepts_mounted_storage_only_for_staging_tier():
    staging = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        DEPLOYMENT_TIER="staging",
        DATABASE_URL=(
            "postgresql://chinverse_app:strong-password@"
            "ep-wild-band-atse2yoq-pooler.us-east-2.aws.neon.tech/chinverse"
        ),
        STAGING_DATABASE_ENDPOINT_ID="ep-wild-band-atse2yoq",
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
    assert staging.STAGING_DATABASE_TARGET_VERIFIED is True

    with pytest.raises(ValidationError, match="STAGING_DATABASE_ENDPOINT_ID"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            DEPLOYMENT_TIER="staging",
            DATABASE_URL="postgresql://chinverse_app:strong-password@db.example.com/chinverse",
        )

    with pytest.raises(ValidationError, match="does not target"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            DEPLOYMENT_TIER="staging",
            DATABASE_URL=(
                "postgresql://chinverse_app:strong-password@"
                "ep-production.us-east-2.aws.neon.tech/chinverse"
            ),
            STAGING_DATABASE_ENDPOINT_ID="ep-wild-band-atse2yoq",
        )

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
