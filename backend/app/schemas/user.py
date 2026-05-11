import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

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

    @field_validator("password")
    @classmethod
    def password_must_fit_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password is too long")
        return value

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = Field(default=None, min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def password_must_fit_bcrypt(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and len(value.encode("utf-8")) > 72:
            raise ValueError("Password is too long")
        return value

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
    bio: Optional[str] = Field(default=None, max_length=1000)
    websites: Optional[list[str]] = None
    socials: Optional[list[dict]] = None
    resume: Optional[dict] = None

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
    pass

class UserProfile(UserProfileBase):
    user_id: int

    class Config:
        from_attributes = True

# Additional properties to return via API
class User(UserInDBBase):
    profile: Optional[UserProfile] = None

class UserInDB(UserInDBBase):
    hashed_password: str
