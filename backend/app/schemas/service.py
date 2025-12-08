from typing import Optional, List
from pydantic import BaseModel


class ServiceBase(BaseModel):
    """Base service schema"""
    title: str
    description: str
    price_label: Optional[str] = None


class ServiceCreate(ServiceBase):
    """Schema for creating a service (banner uploaded separately)"""
    pass


class ServiceUpdate(BaseModel):
    """Schema for updating a service"""
    title: Optional[str] = None
    description: Optional[str] = None
    price_label: Optional[str] = None


class Service(ServiceBase):
    """Full service schema for API responses"""
    id: int
    user_id: int
    banner_url: Optional[str] = None

    class Config:
        from_attributes = True


class ServicePublic(BaseModel):
    """Public service without user_id exposed"""
    id: int
    title: str
    description: str
    banner_url: Optional[str] = None
    price_label: Optional[str] = None

    class Config:
        from_attributes = True
