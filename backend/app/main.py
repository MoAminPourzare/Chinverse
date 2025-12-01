from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
import os

from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(
    title="ChinVerse API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# تنظیمات CORS (برای اینکه بعداً فرانت‌اند بتونه وصل شه)
# فعلاً همه رو مجاز می‌ذاریم
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ایجاد دایرکتوری آپلود در صورت عدم وجود
uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "avatars"), exist_ok=True)

# Mount static files برای سرو کردن تصاویر آپلود شده
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# این خط طلاییه! اینجا تمام روت‌های ما (لاگین و...) به اپلیکیشن وصل میشن
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to ChinVerse API"}