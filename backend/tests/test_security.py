from datetime import timedelta

import jwt
import pyotp

from app.core.config import settings
from app.core.security import (
    build_totp_uri,
    create_access_token,
    decrypt_mfa_secret,
    encrypt_mfa_secret,
    generate_totp_secret,
    get_password_hash,
    verify_password,
    verify_totp,
)


def test_password_hash_round_trip_and_invalid_hash():
    password_hash = get_password_hash("Secure123")

    assert password_hash != "Secure123"
    assert verify_password("Secure123", password_hash)
    assert not verify_password("Wrong123", password_hash)
    assert not verify_password("Secure123", "not-a-password-hash")


def test_access_token_contains_subject_and_expiration():
    token = create_access_token(
        42,
        session_id="session-42",
        role="admin",
        mfa_verified=True,
        expires_delta=timedelta(minutes=5),
    )
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    assert payload["sub"] == "42"
    assert payload["sid"] == "session-42"
    assert payload["role"] == "admin"
    assert payload["mfa"] is True
    assert payload["type"] == "access"
    assert isinstance(payload["exp"], int)


def test_mfa_secret_is_encrypted_and_totp_is_verifiable():
    secret = generate_totp_secret()
    encrypted = encrypt_mfa_secret(secret)

    assert encrypted != secret
    assert decrypt_mfa_secret(encrypted) == secret
    assert "otpauth://totp/" in build_totp_uri(secret, "admin@example.test")

    assert verify_totp(secret, pyotp.TOTP(secret).now())
