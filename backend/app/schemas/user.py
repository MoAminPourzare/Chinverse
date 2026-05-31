import re
from typing import Optional
from urllib.parse import urlparse
from pydantic import BaseModel, EmailStr, Field, field_validator

ALLOWED_PROFILE_HEADLINES = {
    "مترجم زبان چینی",
    "مدرس زبان چینی",
    "زبان‌آموز چینی",
    "دانشجوی زبان چینی",
    "راهنمای تور چین",
    "تولیدکننده محتوای چینی",
    "مشاور تحصیل در چین",
    "بازرگان و واردات از چین",
    "متخصص فرهنگ چین",
    "زیرنویس و دوبله چینی",
}


def _normalize_digits(value: str) -> str:
    persian_digits = "۰۱۲۳۴۵۶۷۸۹"
    arabic_digits = "٠١٢٣٤٥٦٧٨٩"
    translated = []
    for char in value:
        if char in persian_digits:
            translated.append(str(persian_digits.index(char)))
        elif char in arabic_digits:
            translated.append(str(arabic_digits.index(char)))
        else:
            translated.append(char)
    return "".join(translated)


def _normalize_iran_mobile(value: str) -> str:
    phone = re.sub(r"[^\d+]", "", _normalize_digits(value.strip()))
    if phone.startswith("+98"):
        phone = f"0{phone[3:]}"
    if phone.startswith("0098"):
        phone = f"0{phone[4:]}"
    return phone


def _validate_password_strength(value: str) -> str:
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Password is too long")
    if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        raise ValueError("Password must contain at least one English letter and one number")
    return value


def _validate_external_or_relative_url(value: str, *, field_name: str) -> str:
    url = value.strip()
    if not url:
        return url
    if url.startswith("/"):
        return url
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError(f"{field_name} must be a valid http(s) URL")
    return url

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=32)
    is_verified: bool = False

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    phone: str = Field(min_length=5, max_length=32)
    display_name: str = Field(min_length=1, max_length=120)
    referral_code: Optional[str] = Field(default=None, min_length=4, max_length=32)

    @field_validator("password")
    @classmethod
    def password_must_fit_bcrypt(cls, value: str) -> str:
        return _validate_password_strength(value)

    @field_validator("phone")
    @classmethod
    def validate_signup_phone(cls, value: str) -> str:
        phone = _normalize_iran_mobile(value)
        if not re.fullmatch(r"09\d{9}", phone):
            raise ValueError("Phone number must be a valid Iranian mobile number")
        return phone

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, value: str) -> str:
        display_name = value.strip()
        if len(display_name) < 2:
            raise ValueError("Display name is too short")
        return display_name

    @field_validator("referral_code")
    @classmethod
    def normalize_referral_code(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        normalized = value.strip().upper().replace("-", "").replace(" ", "")
        if normalized and not re.fullmatch(r"[A-Z0-9]{4,32}", normalized):
            raise ValueError("Referral code is invalid")
        return normalized or None

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = Field(default=None, min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def password_must_fit_bcrypt(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return _validate_password_strength(value)

    @field_validator("phone")
    @classmethod
    def validate_update_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        phone = _normalize_iran_mobile(value)
        if not re.fullmatch(r"09\d{9}", phone):
            raise ValueError("Phone number must be a valid Iranian mobile number")
        return phone

class UserInDBBase(UserBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True

# Profile schemas
class UserProfileBase(BaseModel):
    display_name: Optional[str] = Field(default=None, max_length=120)
    headline: Optional[str] = Field(default=None, max_length=180)
    about_me: Optional[str] = Field(default=None, max_length=4000)
    country: Optional[str] = Field(default=None, max_length=80)
    city: Optional[str] = Field(default=None, max_length=80)
    website_url: Optional[str] = Field(default=None, max_length=500)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None, max_length=4000)
    websites: Optional[list[str]] = None
    socials: Optional[list[dict]] = None
    resume: Optional[dict] = None

    @field_validator("display_name")
    @classmethod
    def validate_profile_display_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        display_name = value.strip()
        if not display_name:
            return None
        if len(display_name) < 2:
            raise ValueError("Display name is too short")
        return display_name

    @field_validator("city", "country")
    @classmethod
    def normalize_short_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return value.strip() or None

    @field_validator("website_url", "avatar_url")
    @classmethod
    def validate_profile_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        url = value.strip()
        if not url:
            return None
        return _validate_external_or_relative_url(url, field_name="URL")

    @field_validator("websites")
    @classmethod
    def validate_websites(cls, value: Optional[list[str]]) -> Optional[list[str]]:
        if value is None:
            return value

        normalized_websites = []
        for website in value:
            if not isinstance(website, str):
                raise ValueError("Website must be a string")
            url = website.strip()
            if not url:
                continue
            normalized_websites.append(_validate_external_or_relative_url(url, field_name="Website"))

        if len(normalized_websites) > 10:
            raise ValueError("Too many websites")
        return normalized_websites

    @field_validator("headline")
    @classmethod
    def validate_headline(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        normalized = value.strip()
        if not normalized:
            return None
        return normalized

    @field_validator("socials")
    @classmethod
    def validate_socials(cls, value: Optional[list[dict]]) -> Optional[list[dict]]:
        if value is None:
            return value

        platform_patterns = {
            "instagram": re.compile(r"^[A-Za-z0-9._]{1,30}$"),
            "twitter": re.compile(r"^[A-Za-z0-9_]{1,15}$"),
            "linkedin": re.compile(r"^(in/)?[A-Za-z0-9-]{3,100}$"),
            "telegram": re.compile(r"^[A-Za-z0-9_]{5,32}$"),
            "whatsapp": re.compile(r"^[1-9][0-9]{7,14}$"),
            "wechat": re.compile(r"^[A-Za-z][A-Za-z0-9_-]{5,19}$"),
            "facebook": re.compile(r"^[A-Za-z0-9.]{5,50}$"),
        }

        normalized_socials = []
        for item in value:
            platform = str(item.get("platform", "")).strip().lower()
            handle = str(item.get("handle", "")).strip()

            if not platform or not handle:
                continue

            platform = "twitter" if platform == "x" else platform
            handle = handle.lstrip("@").rstrip("/")
            if platform == "whatsapp":
                handle = re.sub(r"\D", "", handle)

            pattern = platform_patterns.get(platform)
            if not pattern:
                raise ValueError(f"Unsupported social platform: {platform}")
            if not pattern.fullmatch(handle):
                raise ValueError(f"Invalid handle for {platform}")

            normalized_socials.append({"platform": platform, "handle": handle})

        return normalized_socials

class UserProfileUpdate(UserProfileBase):
    @field_validator("headline")
    @classmethod
    def validate_update_headline(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        normalized = value.strip()
        if not normalized:
            return None
        if normalized not in ALLOWED_PROFILE_HEADLINES:
            raise ValueError("Invalid profile headline")
        return normalized

class UserProfile(UserProfileBase):
    user_id: int

    class Config:
        from_attributes = True

# Additional properties to return via API
class User(UserInDBBase):
    profile: Optional[UserProfile] = None

class UserInDB(UserInDBBase):
    hashed_password: str
