from typing import Any, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.api.errors import bad_request, not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import upload_rate_limit, write_rate_limit
from app.core.paths import SERVICE_UPLOAD_DIR, resolve_backend_file_url, safe_unlink
from app.core.storage import delete_public_file
from app.core.uploads import save_image_upload
from app.models.user import User
from app.models.service import UserService
from app.schemas.service import Service
from app.services.notifications import notify_followers

router = APIRouter()


@router.get("", response_model=List[Service])
async def get_my_services(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=50)),
) -> Any:
    """
    Get current user's services.
    """
    result = await db.execute(
        select(UserService)
        .where(UserService.user_id == current_user.id)
        .order_by(UserService.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    services = result.scalars().all()
    return services


@router.post("", response_model=Service, status_code=status.HTTP_201_CREATED)
async def create_service(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    title: str = Form(..., min_length=1, max_length=160),
    description: str = Form(..., min_length=1, max_length=4000),
    price_label: str | None = Form(None, max_length=80),
    banner: UploadFile = File(None),
    _rate_limit: None = Depends(upload_rate_limit),
) -> Any:
    """
    Create a new service with optional banner image.
    """
    title = title.strip()
    description = description.strip()
    if not title or not description:
        raise bad_request("Title and description cannot be empty")
    if price_label is not None:
        price_label = price_label.strip() or None

    banner_url = None
    
    if banner and banner.filename:
        banner_url = await save_image_upload(
            banner,
            destination_dir=SERVICE_UPLOAD_DIR,
            public_url_prefix="/uploads/services",
        )
    
    # Create service
    service = UserService(
        user_id=current_user.id,
        title=title,
        description=description,
        price_label=price_label,
        banner_url=banner_url
    )
    
    db.add(service)
    try:
        await db.commit()
        await db.refresh(service)
    except Exception:
        await db.rollback()
        if banner_url:
            delete_public_file(banner_url)
        raise

    try:
        display_name = current_user.profile.display_name if current_user.profile else "Chinverse user"
        await notify_followers(
            db,
            actor_user_id=current_user.id,
            type="service",
            title="خدمت جدید",
            body=f"{display_name} یک خدمت جدید اضافه کرد: {service.title}",
            target_url=f"/services/{service.id}",
            metadata={"service_id": service.id},
        )
    except Exception:
        await db.rollback()
    
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
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
        raise not_found("Service")
    
    # Delete banner file if exists
    if service.banner_url:
        safe_unlink(resolve_backend_file_url(service.banner_url))
    
    await db.delete(service)
    await db.commit()


# ===== PUBLIC ENDPOINTS =====

@router.get("/public", response_model=List[dict])
async def get_public_services(
    db: AsyncSession = Depends(deps.get_db),
    pagination: PaginationParams = Depends(pagination_params(default_limit=50)),
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
        .order_by(UserService.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
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
            "created_at": service.created_at,
            "provider": provider_info
        })
    
    return public_services


@router.get("/public/{service_id}", response_model=dict)
async def get_public_service(
    service_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Get a single public service with provider info.
    """
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(UserService)
        .options(selectinload(UserService.user).selectinload(User.profile))
        .where(UserService.id == service_id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise not_found("Service")

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

    return {
        "id": service.id,
        "title": service.title,
        "description": service.description,
        "banner_url": service.banner_url,
        "price_label": service.price_label,
        "created_at": service.created_at,
        "provider": provider_info,
    }
