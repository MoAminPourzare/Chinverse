from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

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

# این خط طلاییه! اینجا تمام روت‌های ما (لاگین و...) به اپلیکیشن وصل میشن
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to ChinVerse API"}