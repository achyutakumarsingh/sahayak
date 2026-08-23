from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


cors_origins: List[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://bosc-1.onrender.com",
]


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
    # Deliberately small: these modules answer in 40-80 words, and a low cap
    # keeps a runaway reply from costing real money.
    anthropic_max_tokens: int = 700
    # Simple grounded lookups do not need deep reasoning; low effort is
    # cheaper and faster while leaving adaptive thinking on.
    anthropic_effort: str = "low"
    # Override to point the SDK at a local stub instead of the real API.
    anthropic_base_url: Optional[str] = None

    # data.gov.in mandi prices. Defaults to the rate-limited sample key that
    # data.gov.in publishes in its own API documentation; replace it with your
    # own free key for anything beyond a demo.
    data_gov_in_api_key: str = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"

    # Path to the trained crop-disease classifier, relative to backend/.
    crop_model_path: str = "models/crop_disease.onnx"

    # Prototype storage. Swap for a Postgres DSN when the round allows.
    database_url: str = "sqlite:///./sahayak.db"

    # Browsers allowed to call this API.
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://bosc-1.onrender.com",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
