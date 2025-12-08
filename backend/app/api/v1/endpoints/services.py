from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
import uuid

from app.api import deps
from app.models.user import User
from app.models.service import UserService
from app.schemas.service import Service

router = APIRouter()

# Upload directory for service banners
UPLOAD_DIR = "static/uploads/services"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=List[Service])
async def get_my_services(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user's services.
    """
    result = await db.execute(
        select(UserService).where(UserService.user_id == current_user.id)
    )
    services = result.scalars().all()
    return services


@router.post("", response_model=Service, status_code=status.HTTP_201_CREATED)
async def create_service(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    title: str = Form(...),
    description: str = Form(...),
    price_label: str = Form(None),
    banner: UploadFile = File(None),
) -> Any:
    """
    Create a new service with optional banner image.
    """
    banner_url = None
    
    # Handle banner upload
    if banner and banner.filename:
        # Validate file type
        if not banner.content_type or not banner.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed for banner"
            )
        
        # Generate unique filename
        file_extension = os.path.splitext(banner.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await banner.read()
            buffer.write(content)
        
        banner_url = f"/uploads/services/{unique_filename}"
    
    # Create service
    service = UserService(
        user_id=current_user.id,
        title=title,
        description=description,
        price_label=price_label,
        banner_url=banner_url
    )
    
    db.add(service)
    await db.commit()
    await db.refresh(service)
    
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> None:
    """
    Delete a service.
    """
    result = await db.execute(
        select(UserService).where(
            UserService.id == service_id,
            UserService.user_id == current_user.id
        )
    )
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Delete banner file if exists
    if service.banner_url:
        file_path = os.path.join("static", service.banner_url.lstrip("/"))
        if os.path.exists(file_path):
            os.remove(file_path)
    
    await db.delete(service)
    await db.commit()
