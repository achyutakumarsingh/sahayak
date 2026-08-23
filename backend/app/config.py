"""Runtime configuration, loaded from the environment and backend/.env."""

from functools import lru_cache
import json
from typing import List, Optional, Union

from pydantic import field_validator
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Sahayak API"
    environment: str = "development"

    # LLM Provider selection: "gemini" (default if key present) or "anthropic"
    llm_provider: Optional[str] = None

    # Google Gemini — primary LLM provider
    gemini_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.5-flash"

    # Claude / Anthropic — alternative LLM provider
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

    # Browsers allowed to call this API (e.g. Vercel frontend, localhost).
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return ["*"]
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(x).strip() for x in parsed if str(x).strip()]
                except Exception:
                    pass
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls,
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        """Customise settings sources so pydantic-settings does not fail on non-JSON list env vars."""
        def wrap_source(source_obj: PydanticBaseSettingsSource):
            source_cls = type(source_obj)

            class SafeSettingsSource(source_cls):
                def decode_complex_value(self, field_name: str, field, value):
                    if field_name == "cors_origins" and isinstance(value, str):
                        v = value.strip()
                        if v.startswith("[") and v.endswith("]"):
                            try:
                                return json.loads(v)
                            except Exception:
                                pass
                        if "," in v:
                            return [x.strip() for x in v.split(",") if x.strip()]
                        return [v] if v else ["*"]
                    return super().decode_complex_value(field_name, field, value)

            return SafeSettingsSource

        env_safe = wrap_source(env_settings)(settings_cls)
        dotenv_safe = wrap_source(dotenv_settings)(settings_cls, env_file=".env", env_file_encoding="utf-8")
        return (init_settings, env_safe, dotenv_safe, file_secret_settings)


@lru_cache
def get_settings() -> Settings:
    return Settings()
