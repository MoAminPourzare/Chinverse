import base64
from datetime import UTC, datetime, timedelta
import hashlib
import hmac
import secrets
import time
from typing import Any

from cryptography.fernet import Fernet, InvalidToken
import jwt
from passlib.context import CryptContext
import pyotp

from app.core.config import settings


pwd_context = CryptContext(
    schemes=["argon2", "bcrypt_sha256", "bcrypt"],
    deprecated="auto",
)


def create_access_token(
    subject: str | int | Any,
    *,
    session_id: str,
    role: str,
    mfa_verified: bool,
    expires_delta: timedelta | None = None,
) -> str:
    issued_at = datetime.now(UTC)
    expire = issued_at + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {
        "exp": expire,
        "iat": issued_at,
        "nbf": issued_at,
        "jti": secrets.token_urlsafe(16),
        "sub": str(subject),
        "sid": session_id,
        "type": "access",
        "role": role,
        "mfa": mfa_verified,
    }
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError):
        return False


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def password_hash_needs_update(password_hash: str) -> bool:
    try:
        return pwd_context.needs_update(password_hash)
    except (ValueError, TypeError):
        return False


def generate_opaque_token(bytes_count: int = 48) -> str:
    return secrets.token_urlsafe(bytes_count)


def hash_secret(value: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        value.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def hash_request_fingerprint(value: str | None) -> str | None:
    normalized = (value or "").strip()
    return hash_secret(normalized) if normalized else None


def _mfa_fernet() -> Fernet:
    source = settings.MFA_ENCRYPTION_KEY or settings.SECRET_KEY
    key = base64.urlsafe_b64encode(hashlib.sha256(source.encode("utf-8")).digest())
    return Fernet(key)


def encrypt_mfa_secret(secret: str) -> str:
    return _mfa_fernet().encrypt(secret.encode("ascii")).decode("ascii")


def decrypt_mfa_secret(ciphertext: str) -> str | None:
    try:
        return _mfa_fernet().decrypt(ciphertext.encode("ascii")).decode("ascii")
    except (InvalidToken, ValueError, UnicodeError):
        return None


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def matching_totp_counter(secret: str, code: str, *, timestamp: float | None = None) -> int | None:
    normalized = code.replace(" ", "").replace("-", "")
    if len(normalized) != 6 or not normalized.isdigit():
        return None

    totp = pyotp.TOTP(secret)
    counter = int(timestamp if timestamp is not None else time.time()) // totp.interval
    for offset in (-1, 0, 1):
        candidate_counter = counter + offset
        if candidate_counter >= 0 and secrets.compare_digest(
            totp.at(candidate_counter * totp.interval),
            normalized,
        ):
            return candidate_counter
    return None


def verify_totp(secret: str, code: str) -> bool:
    return matching_totp_counter(secret, code) is not None


def build_totp_uri(secret: str, email: str) -> str:
    return pyotp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name="ChinVerse",
    )
