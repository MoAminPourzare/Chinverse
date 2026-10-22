from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.user import _validate_password_strength
from app.core.passwords import PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH


class MessageResponse(BaseModel):
    message: str
    debug_token: str | None = None


class PasswordResetRequest(BaseModel):
    email: EmailStr
    turnstile_token: str | None = Field(default=None, max_length=2048)


class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=6, max_length=512)
    new_password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)

    @field_validator("new_password", mode="before")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password_strength(value)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=PASSWORD_MAX_LENGTH)
    new_password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)

    @field_validator("new_password", mode="before")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password_strength(value)


class VerificationConfirm(BaseModel):
    token: str = Field(min_length=6, max_length=512)


class VerificationStatus(BaseModel):
    email_verified: bool
    phone_verified: bool
    account_verified: bool


class MfaSetupResponse(BaseModel):
    secret: str
    provisioning_uri: str


class MfaSetupRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=PASSWORD_MAX_LENGTH)


class MfaConfirmRequest(BaseModel):
    code: str = Field(min_length=6, max_length=32)


class MfaConfirmResponse(BaseModel):
    backup_codes: list[str]


class SessionRead(BaseModel):
    id: str
    created_at: datetime
    last_used_at: datetime
    expires_at: datetime
    current: bool
    mfa_verified: bool
