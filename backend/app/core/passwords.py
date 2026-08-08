import re
import unicodedata


PASSWORD_MIN_LENGTH = 15
PASSWORD_MAX_LENGTH = 128

_COMMON_PASSWORDS = {
    "123456789012345",
    "1234567890123456",
    "passwordpassword",
    "password123456",
    "qwertyqwerty123",
    "qwertyuiop12345",
    "adminadmin12345",
    "letmeinletmein1",
    "chinverse123456",
}


def _comparison_value(value: str) -> str:
    return re.sub(r"[\s\W_]+", "", value.casefold(), flags=re.UNICODE)


def validate_new_password(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("رمز عبور معتبر نیست")
    if len(value) < PASSWORD_MIN_LENGTH:
        raise ValueError("رمز عبور باید حداقل ۱۵ کاراکتر باشد")
    if len(value) > PASSWORD_MAX_LENGTH:
        raise ValueError("رمز عبور نباید بیشتر از ۱۲۸ کاراکتر باشد")
    if any(unicodedata.category(character) in {"Cc", "Cs"} for character in value):
        raise ValueError("رمز عبور نباید نویسه کنترلی داشته باشد")
    if _comparison_value(value) in _COMMON_PASSWORDS:
        raise ValueError("این رمز عبور بسیار رایج و قابل حدس است")
    return value


def password_contains_account_data(password: str, *values: str | None) -> bool:
    comparable_password = _comparison_value(password)
    for value in values:
        if not value:
            continue
        comparable_value = _comparison_value(value)
        if len(comparable_value) >= 5 and comparable_value in comparable_password:
            return True
    return False
