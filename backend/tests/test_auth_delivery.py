from app.core.config import settings
from app.services.auth_security import challenge_public_url


def test_challenge_links_use_configured_public_origin_and_encoded_tokens(monkeypatch):
    monkeypatch.setattr(settings, "AUTH_PUBLIC_APP_URL", "https://chinverse.example/")

    assert challenge_public_url(purpose="verify_email", token="a+b/c") == (
        "https://chinverse.example/verify-account?email_token=a%2Bb%2Fc"
    )
    assert challenge_public_url(purpose="password_reset", token="reset token") == (
        "https://chinverse.example/forgot-password?token=reset+token"
    )
    assert challenge_public_url(purpose="verify_phone", token="123456") is None
