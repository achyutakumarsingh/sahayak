"""Anthropic client for the agent modules."""

from functools import lru_cache
from typing import Optional

from anthropic import AsyncAnthropic

from app.config import get_settings

# Obvious placeholders in .env should read as "no key", not as a bad key that
# fails later with a confusing 401 mid-stream.
PLACEHOLDER_MARKERS = ("paste", "your-", "xxx", "...", "changeme")


def resolve_api_key() -> Optional[str]:
    key = (get_settings().anthropic_api_key or "").strip()
    if not key or not key.startswith("sk-ant-"):
        return None
    lowered = key.lower()
    if any(marker in lowered for marker in PLACEHOLDER_MARKERS):
        return None
    return key


def has_api_key() -> bool:
    return resolve_api_key() is not None


@lru_cache(maxsize=1)
def get_client() -> AsyncAnthropic:
    settings = get_settings()
    kwargs = {"api_key": resolve_api_key()}
    # Set ANTHROPIC_BASE_URL to point the SDK at a local stub for testing the
    # streaming path without spending tokens.
    if settings.anthropic_base_url:
        kwargs["base_url"] = settings.anthropic_base_url
    return AsyncAnthropic(**kwargs)
