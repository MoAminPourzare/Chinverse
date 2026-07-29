from datetime import timedelta

import jwt

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password


def test_password_hash_round_trip_and_invalid_hash():
    password_hash = get_password_hash("Secure123")

    assert password_hash != "Secure123"
    assert verify_password("Secure123", password_hash)
    assert not verify_password("Wrong123", password_hash)
    assert not verify_password("Secure123", "not-a-password-hash")


def test_access_token_contains_subject_and_expiration():
    token = create_access_token(42, expires_delta=timedelta(minutes=5))
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    assert payload["sub"] == "42"
    assert isinstance(payload["exp"], int)
