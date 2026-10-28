from functools import lru_cache
from pathlib import Path
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "Disaster Relief Beneficiary Verification"
    environment: str = "development"
    database_url: str = f"sqlite:///{BASE_DIR / 'verification.db'}"
    secret_key: str = "change-this-in-production"
    access_token_expire_minutes: int = 1440
    upload_dir: str = str(BASE_DIR / "uploads")
    max_upload_bytes: int = 10 * 1024 * 1024
    allowed_extensions: tuple[str, ...] = (".jpg", ".jpeg", ".png", ".pdf")
    tesseract_cmd: str = "tesseract"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    main_admin_email: str | None = None
    main_admin_password: str | None = None
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def validate_production_secrets(self):
        if self.environment.lower() == "production" and (
            len(self.secret_key) < 32
            or self.secret_key in {"change-this-in-production", "replace-with-a-long-random-secret"}
        ):
            raise ValueError("Production requires a unique SECRET_KEY of at least 32 characters")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache

def get_settings() -> Settings:
    return Settings()


settings = get_settings()
