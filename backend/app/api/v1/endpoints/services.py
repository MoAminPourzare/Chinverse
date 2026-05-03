from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.api import deps
from app.core.paths import SERVICE_UPLOAD_DIR, resolve_backend_file_url, safe_unlink
from app.models.user import User
from app.models.service import UserService
from app.schemas.service import Service

router = APIRouter()


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
        file_extension = "." + banner.filename.rsplit(".", 1)[-1].lower() if "." in banner.filename else ""
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        SERVICE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        file_path = SERVICE_UPLOAD_DIR / unique_filename
        
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
        safe_unlink(resolve_backend_file_url(service.banner_url))
    
    await db.delete(service)
    await db.commit()


# ===== PUBLIC ENDPOINTS =====

@router.get("/public", response_model=List[dict])
async def get_public_services(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """
    Get all public services for the showcase marketplace.
    Returns services with provider info (name, avatar).
    No authentication required.
    """
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(UserService)
        .options(selectinload(UserService.user).selectinload(User.profile))
        .offset(skip)
        .limit(limit)
    )
    services = result.scalars().all()
    
    # Build response with provider info
    public_services = []
    for service in services:
        provider_info = None
        if service.user and service.user.profile:
            provider_info = {
                "id": service.user.id,
                "display_name": service.user.profile.display_name,
                "avatar_url": service.user.profile.avatar_url,
                "headline": service.user.profile.headline,
            }
        elif service.user:
            provider_info = {
                "id": service.user.id,
                "display_name": None,
                "avatar_url": None,
                "headline": None,
            }
        
        public_services.append({
            "id": service.id,
            "title": service.title,
            "description": service.description,
            "banner_url": service.banner_url,
            "price_label": service.price_label,
            "provider": provider_info
        })
    
    return public_services
