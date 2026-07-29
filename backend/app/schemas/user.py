import re
from typing import Optional
from urllib.parse import urlparse
from email_validator import EmailNotValidError, validate_email as validate_email_address
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


PERSIAN_NAME_PATTERN = re.compile(r"^[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیءئؤۀة\s‌]+$")

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

ALLOWED_PROFILE_GENDERS = {
    "خانم",
    "آقا",
    "ترجیح می‌دهم نگویم",
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
    if len(value) < 8:
        raise ValueError("رمز عبور باید حداقل ۸ کاراکتر باشد")
    if len(value.encode("utf-8")) > 72:
        raise ValueError("رمز عبور نباید بیشتر از ۷۲ بایت باشد")
    if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        raise ValueError("رمز عبور باید حداقل یک حرف انگلیسی و یک عدد داشته باشد")
    return value


def _normalize_persian_name(value: str) -> str:
    normalized = value.translate(str.maketrans({"ي": "ی", "ى": "ی", "ك": "ک"}))
    return re.sub(r"\s+", " ", normalized).strip()


def _validate_persian_name(value: str) -> str:
    display_name = _normalize_persian_name(value)
    if len(display_name) < 2:
        raise ValueError("نام و نام خانوادگی باید حداقل ۲ حرف باشد")
    if len(display_name) > 120:
        raise ValueError("نام و نام خانوادگی نباید بیشتر از ۱۲۰ کاراکتر باشد")
    if not PERSIAN_NAME_PATTERN.fullmatch(display_name):
        raise ValueError("نام و نام خانوادگی را فقط با حروف فارسی بنویسید")
    return display_name


def _validate_email(value: object) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("ایمیل را وارد کنید")
    try:
        return validate_email_address(value.strip(), check_deliverability=False).normalized.lower()
    except EmailNotValidError as exc:
        raise ValueError("ایمیل را با ساختار درست وارد کنید؛ مثل name@example.com") from exc


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


def _normalize_profile_website(value: str) -> str:
    url = value.strip()
    if not url:
        return url
    if not re.match(r"^[a-z][a-z\d+.-]*://", url, flags=re.IGNORECASE):
        url = f"https://{url}"
    if len(url) > 500 or re.search(r"\s", url):
        raise ValueError("آدرس وب‌سایت معتبر نیست؛ مثل https://chinverse.ir")

    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    try:
        ascii_hostname = hostname.encode("idna").decode("ascii")
    except UnicodeError as exc:
        raise ValueError("آدرس وب‌سایت معتبر نیست؛ مثل https://chinverse.ir") from exc

    labels = ascii_hostname.split(".")
    valid_labels = all(
        re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?", label)
        for label in labels
    )
    valid_tld = bool(labels and (re.fullmatch(r"[A-Za-z]{2,63}", labels[-1]) or labels[-1].startswith("xn--")))
    if (
        parsed.scheme not in {"http", "https"}
        or not hostname
        or parsed.username
        or parsed.password
        or len(labels) < 2
        or not valid_labels
        or not valid_tld
    ):
        raise ValueError("آدرس وب‌سایت معتبر نیست؛ مثل https://chinverse.ir")
    return url


def _normalize_social_handle(platform: str, raw_handle: str) -> str:
    handle = raw_handle.strip()
    handle = re.sub(r"^https?://(www\.)?", "", handle, flags=re.IGNORECASE)
    handle = re.sub(r"^@+", "", handle)
    handle = re.sub(r"/+$", "", handle)

    prefixes = {
        "instagram": r"^instagram\.com/",
        "twitter": r"^(x\.com|twitter\.com)/",
        "telegram": r"^(t\.me|telegram\.me)/",
        "wechat": r"^(weixin://dl/chat\?|wechat:)",
        "facebook": r"^(facebook\.com|fb\.com)/",
    }
    if platform in prefixes:
        handle = re.sub(prefixes[platform], "", handle, flags=re.IGNORECASE)
    elif platform == "linkedin":
        handle = re.sub(r"^linkedin\.com/(in/)?", "", handle, flags=re.IGNORECASE)
        handle = re.sub(r"^in/", "", handle, flags=re.IGNORECASE)
    elif platform == "whatsapp":
        handle = re.sub(r"^(wa\.me/|api\.whatsapp\.com/send\?phone=)", "", handle, flags=re.IGNORECASE)
        return re.sub(r"\D", "", handle)

    return re.split(r"[/?#]", handle, maxsplit=1)[0]

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

    @field_validator("email", mode="before")
    @classmethod
    def validate_signup_email(cls, value: object) -> str:
        return _validate_email(value)

    @field_validator("password", mode="before")
    @classmethod
    def password_must_fit_bcrypt(cls, value: str) -> str:
        return _validate_password_strength(value)

    @field_validator("phone", mode="before")
    @classmethod
    def validate_signup_phone(cls, value: str) -> str:
        phone = _normalize_iran_mobile(value)
        if not re.fullmatch(r"09\d{9}", phone):
            raise ValueError("شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود؛ مثل 09121234567")
        return phone

    @field_validator("display_name", mode="before")
    @classmethod
    def validate_display_name(cls, value: str) -> str:
        return _validate_persian_name(value)

    @field_validator("referral_code", mode="before")
    @classmethod
    def normalize_referral_code(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        normalized = value.strip().upper().replace("-", "").replace(" ", "")
        if normalized and (len(normalized) < 4 or len(normalized) > 32 or not re.fullmatch(r"[A-Z0-9]+", normalized)):
            raise ValueError("ساختار کد دعوت درست نیست")
        return normalized or None

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = Field(default=None, min_length=8, max_length=72)

    @field_validator("password", mode="before")
    @classmethod
    def password_must_fit_bcrypt(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return _validate_password_strength(value)

    @field_validator("phone", mode="before")
    @classmethod
    def validate_update_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        phone = _normalize_iran_mobile(value)
        if not re.fullmatch(r"09\d{9}", phone):
            raise ValueError("شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود؛ مثل 09121234567")
        return phone

class UserInDBBase(UserBase):
    id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

# Profile schemas
class UserProfileBase(BaseModel):
    display_name: Optional[str] = Field(default=None, max_length=120)
    headline: Optional[str] = Field(default=None, max_length=180)
    about_me: Optional[str] = Field(default=None, max_length=4000)
    country: Optional[str] = Field(default=None, max_length=80)
    city: Optional[str] = Field(default=None, max_length=80)
    gender: Optional[str] = Field(default=None, max_length=32)
    profile_truth_confirmed: bool = False
    website_url: Optional[str] = Field(default=None, max_length=500)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None, max_length=4000)
    websites: Optional[list[str]] = None
    socials: Optional[list[dict]] = None
    resume: Optional[dict] = None

    @field_validator("display_name", mode="before")
    @classmethod
    def validate_profile_display_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if not value.strip():
            return None
        return _validate_persian_name(value)

    @field_validator("city", "country")
    @classmethod
    def normalize_short_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return value.strip() or None

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        normalized = value.strip()
        if not normalized:
            return None
        if normalized not in ALLOWED_PROFILE_GENDERS:
            raise ValueError("گزینه جنسیت معتبر نیست")
        return normalized

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        url = value.strip()
        if not url:
            return None
        return _validate_external_or_relative_url(url, field_name="URL")

    @field_validator("website_url")
    @classmethod
    def validate_profile_website_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return _normalize_profile_website(value) or None

    @field_validator("websites")
    @classmethod
    def validate_websites(cls, value: Optional[list[str]]) -> Optional[list[str]]:
        if value is None:
            return value

        normalized_websites = []
        seen_websites = set()
        for website in value:
            if not isinstance(website, str):
                raise ValueError("آدرس وب‌سایت معتبر نیست")
            url = website.strip()
            if not url:
                continue
            normalized_url = _normalize_profile_website(url)
            if normalized_url.lower() in seen_websites:
                continue
            seen_websites.add(normalized_url.lower())
            normalized_websites.append(normalized_url)

        if len(normalized_websites) > 10:
            raise ValueError("حداکثر ۱۰ وب‌سایت می‌توانید اضافه کنید")
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
            "instagram": re.compile(r"^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9._]{1,30}$"),
            "twitter": re.compile(r"^[A-Za-z0-9_]{1,15}$"),
            "linkedin": re.compile(r"^[A-Za-z0-9-]{3,100}$"),
            "telegram": re.compile(r"^[A-Za-z][A-Za-z0-9_]{3,30}[A-Za-z0-9]$"),
            "whatsapp": re.compile(r"^[1-9][0-9]{7,14}$"),
            "wechat": re.compile(r"^[A-Za-z][A-Za-z0-9_-]{5,19}$"),
            "facebook": re.compile(r"^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9.]{5,50}$"),
        }

        platform_errors = {
            "instagram": "آیدی Instagram معتبر نیست؛ مثل chinverse_app",
            "twitter": "آیدی X/Twitter معتبر نیست؛ مثل chinverse_app",
            "linkedin": "شناسه LinkedIn معتبر نیست؛ مثل chinverse-academy",
            "telegram": "آیدی Telegram معتبر نیست؛ مثل chinverse_app",
            "whatsapp": "شماره WhatsApp را با کد کشور وارد کنید؛ مثل 989123456789",
            "wechat": "WeChat ID معتبر نیست؛ مثل chinverse_id",
            "facebook": "آیدی Facebook معتبر نیست؛ مثل chinverse.app",
        }

        normalized_socials = []
        used_platforms = set()
        for item in value:
            if not isinstance(item, dict):
                raise ValueError("اطلاعات شبکه اجتماعی معتبر نیست")
            platform = str(item.get("platform", "")).strip().lower()
            handle = str(item.get("handle", "")).strip()

            if not platform or not handle:
                continue

            platform = "twitter" if platform == "x" else platform
            handle = _normalize_social_handle(platform, handle)

            pattern = platform_patterns.get(platform)
            if not pattern:
                raise ValueError("این شبکه اجتماعی پشتیبانی نمی‌شود")
            if platform in used_platforms:
                raise ValueError("هر شبکه اجتماعی را فقط یک‌بار اضافه کنید")
            if not pattern.fullmatch(handle):
                raise ValueError(platform_errors[platform])

            used_platforms.add(platform)
            normalized_socials.append({"platform": platform, "handle": handle})

        if len(normalized_socials) > len(platform_patterns):
            raise ValueError("تعداد شبکه‌های اجتماعی بیشتر از حد مجاز است")
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

    model_config = ConfigDict(from_attributes=True)

# Additional properties to return via API
class User(UserInDBBase):
    profile: Optional[UserProfile] = None

class UserInDB(UserInDBBase):
    hashed_password: str
