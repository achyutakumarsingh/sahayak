"""Runtime configuration, loaded from the environment and backend/.env."""

from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Sahayak API"
    environment: str = "development"

    # Claude — every "agent" module in Sahayak runs through this key.
    anthropic_api_key: Optional[str] = None
    anthropic_model: str = "claude-sonnet-5"

    # Prototype storage. Swap for a Postgres DSN when the round allows.
    database_url: str = "sqlite:///./sahayak.db"

    # Browsers allowed to call this API.
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
