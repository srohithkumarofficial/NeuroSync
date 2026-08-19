from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_uri: str = Field(default="mongodb://localhost:27017", validation_alias=AliasChoices("MONGODB_URI", "MONGO_URI"))
    database_name: str = "neurosync"
    frontend_url: str = "http://localhost:5173"
    sarvam_api_key: str = ""
    sarvam_model: str = "sarvam-105b"
    sarvam_api_url: str = "https://api.sarvam.ai/v1/chat/completions"
    sarvam_timeout_seconds: float = 120.0

    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[1] / ".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_url.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
