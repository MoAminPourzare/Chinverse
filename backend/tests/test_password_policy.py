import pytest

from app.core.passwords import password_contains_account_data, validate_new_password


def test_password_policy_accepts_long_passphrases_without_composition_rules():
    assert validate_new_password("یک عبارت طولانی و به یاد ماندنی")
    assert validate_new_password("correct horse battery staple")


@pytest.mark.parametrize(
    "password",
    [
        "short",
        "password123456",
        "a" * 129,
        "safe passphrase\x00hidden",
    ],
)
def test_password_policy_rejects_weak_or_unsafe_values(password):
    with pytest.raises(ValueError):
        validate_new_password(password)


def test_password_account_data_comparison_is_case_and_separator_insensitive():
    assert password_contains_account_data("My-Person.Name-safe-pass", "person.name")
    assert password_contains_account_data("call-09121234567-later", "09121234567")
    assert not password_contains_account_data("independent secure phrase", "person", "09121234567")
