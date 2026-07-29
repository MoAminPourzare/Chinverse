import pytest
from pydantic import ValidationError

from app.schemas.user import UserCreate, UserProfileUpdate


def test_signup_normalizes_email_phone_name_and_referral_code():
    user = UserCreate(
        email="  USER@Example.COM ",
        password="Secure123",
        phone="+98 912 123 4567",
        display_name="  امین   پورزارع ",
        referral_code="ab-12",
    )

    assert str(user.email) == "user@example.com"
    assert user.phone == "09121234567"
    assert user.display_name == "امین پورزارع"
    assert user.referral_code == "AB12"


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("password", "short"),
        ("phone", "123"),
        ("display_name", "Latin Name"),
        ("referral_code", "A!"),
    ],
)
def test_signup_rejects_invalid_identity_fields(field, value):
    payload = {
        "email": "person@example.com",
        "password": "Secure123",
        "phone": "09121234567",
        "display_name": "کاربر آزمایشی",
    }
    payload[field] = value

    with pytest.raises(ValidationError):
        UserCreate(**payload)


def test_profile_cleans_empty_fields_and_normalizes_websites():
    profile = UserProfileUpdate(
        display_name=" ",
        headline=" ",
        country=" ایران ",
        city=" ",
        gender="خانم",
        website_url="chinverse.ir",
        websites=[" chinverse.ir ", "", "https://chinverse.ir"],
    )

    assert profile.display_name is None
    assert profile.headline is None
    assert profile.country == "ایران"
    assert profile.city is None
    assert profile.website_url == "https://chinverse.ir"
    assert profile.websites == ["https://chinverse.ir"]


def test_profile_rejects_unknown_gender_and_credentialed_website():
    with pytest.raises(ValidationError):
        UserProfileUpdate(gender="unknown")

    with pytest.raises(ValidationError):
        UserProfileUpdate(website_url="https://user:pass@example.com")
