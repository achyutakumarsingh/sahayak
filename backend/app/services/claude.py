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


async def complete_structured(
    *,
    system: str,
    user: str | list,
    output_format: type,
    max_tokens: int = 700,
):
    """One non-streaming call returning a validated Pydantic model.

    Used where the frontend needs a machine-readable field (a verdict level
    that picks a colour, a price band) rather than a wall of prose.
    """
    settings = get_settings()
    response = await get_client().messages.parse(
        model=settings.anthropic_model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],  # str or content blocks
        output_format=output_format,
        output_config={"effort": settings.anthropic_effort},
    )
    return response.parsed_output
