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

    # Gemini — every "agent" module in Sahayak runs through this key.
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.5-flash"
    # Deliberately small: these modules answer in 40-80 words, and a low cap
    # keeps a runaway reply from costing real money. Carried over verbatim from
    # the previous provider's cap.
    gemini_max_output_tokens: int = 700
    # Gemini 2.5 models think by default. These are lookups over a small
    # corpus, so thinking only adds latency and tokens — 0 disables it, which
    # is what the previous provider's "low effort" setting was doing.
    gemini_thinking_budget: int = 0
    # Override to point the SDK at a local stub instead of the real API.
    gemini_base_url: Optional[str] = None

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
