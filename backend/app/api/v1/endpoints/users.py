from typing import Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
import uuid
import shutil

from app.api import deps
from app.models.user import User, UserProfile
from app.schemas import user as schemas

router = APIRouter()

# مجاز فایل‌های تصویری
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.get("/me", response_model=schemas.User)
async def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me/profile", response_model=schemas.User)
async def update_user_profile(
    *,
    db: AsyncSession = Depends(deps.get_db),
    profile_in: schemas.UserProfileUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update current user profile.
    """
    # Check if profile exists
    if not current_user.profile:
        # Create new profile
        profile = UserProfile(user_id=current_user.id, **profile_in.model_dump(exclude_unset=True))
        db.add(profile)
    else:
        # Update existing profile
        profile = current_user.profile
        update_data = profile_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        db.add(profile)
    
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/me/avatar", response_model=schemas.User)
async def upload_avatar(
    *,
    db: AsyncSession = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Upload user avatar image.
    """
    # بررسی فرمت فایل
    if not file.filename:
        raise HTTPException(status_code=400, detail="فایل نامعتبر است")
    
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"فرمت فایل باید یکی از این‌ها باشد: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # بررسی حجم فایل
    file.file.seek(0, 2)  # به انتهای فایل برو
    file_size = file.file.tell()  # حجم فایل
    file.file.seek(0)  # برگرد به اول فایل
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="حجم فایل نباید بیشتر از ۵ مگابایت باشد")
    
    # ایجاد نام یونیک برای فایل
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    
    # مسیر ذخیره‌سازی
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "uploads", "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)
    
    # ذخیره فایل
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در ذخیره فایل: {str(e)}")
    finally:
        file.file.close()
    
    # آدرس URL برای دسترسی به فایل
    avatar_url = f"/uploads/avatars/{unique_filename}"
    
    # به‌روزرسانی پروفایل کاربر
    if not current_user.profile:
        # ایجاد پروفایل جدید
        profile = UserProfile(user_id=current_user.id, avatar_url=avatar_url, display_name="کاربر")
        db.add(profile)
    else:
        # به‌روزرسانی پروفایل موجود
        current_user.profile.avatar_url = avatar_url
        db.add(current_user.profile)
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user
