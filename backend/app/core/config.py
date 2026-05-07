from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/chinverse_db"
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"] # Default for frontend
    ADMIN_EMAILS: str = ""

    @computed_field
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        if self.DATABASE_URL and self.DATABASE_URL.startswith("postgresql://"):
             return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.DATABASE_URL

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
