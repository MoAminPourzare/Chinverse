from typing import Optional
from pydantic import BaseModel, EmailStr

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    is_verified: bool = False

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str
    phone: str
    display_name: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True

# Profile schemas
class UserProfileBase(BaseModel):
    display_name: Optional[str] = None
    headline: Optional[str] = None
    about_me: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    website_url: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    websites: Optional[list[str]] = None
    socials: Optional[list[dict]] = None
    resume: Optional[dict] = None

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
