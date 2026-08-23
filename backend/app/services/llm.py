"""LLM client for the agent modules.

Provider-neutral by design: every module talks to this module, never to a
vendor SDK directly, so swapping providers is a change here and nowhere else.
Currently backed by Google Gemini.

Exposes three things to callers:

  has_api_key()         -- is a key configured at all
  stream_text(...)      -- token stream for the "Ask a question" panels
  complete_structured() -- one validated Pydantic object back

and a small set of provider-neutral exceptions, so routers do not import a
vendor SDK just to name its error types.
"""

import base64
import binascii
import logging
from functools import lru_cache
from typing import Any, AsyncIterator, Optional, Sequence

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)

# Obvious placeholders in .env should read as "no key", not as a bad key that
# fails later with a confusing 401 mid-stream.
PLACEHOLDER_MARKERS = ("paste", "your-", "xxx", "...", "changeme", "<", "replace")


class LLMError(Exception):
    """Base for anything that went wrong talking to the provider."""


class LLMNotConfigured(LLMError):
    """No usable API key."""


class LLMAuthError(LLMError):
    """The provider rejected the key."""


class LLMRateLimited(LLMError):
    """Too many requests."""


class LLMUnavailable(LLMError):
    """Network failure or a provider-side error."""


def resolve_api_key() -> Optional[str]:
    key = (get_settings().gemini_api_key or "").strip()
    if not key:
        return None
    lowered = key.lower()
    if any(marker in lowered for marker in PLACEHOLDER_MARKERS):
        return None
    return key


def has_api_key() -> bool:
    return resolve_api_key() is not None


@lru_cache(maxsize=1)
def get_client() -> genai.Client:
    settings = get_settings()
    key = resolve_api_key()
    if key is None:
        raise LLMNotConfigured("GEMINI_API_KEY is not set.")

    http_options = None
    # Set GEMINI_BASE_URL to point the SDK at a local stub for testing the
    # streaming path without spending quota.
    if settings.gemini_base_url:
        http_options = types.HttpOptions(base_url=settings.gemini_base_url)

    return genai.Client(api_key=key, http_options=http_options)


def _config(*, system: str, max_tokens: Optional[int] = None, **extra: Any) -> types.GenerateContentConfig:
    settings = get_settings()
    return types.GenerateContentConfig(
        system_instruction=system,
        max_output_tokens=max_tokens or settings.gemini_max_output_tokens,
        # These modules answer in 40-80 words from a small corpus. Thinking adds
        # latency and tokens for no benefit on a lookup, so it is off by default
        # — the same reasoning behind the old low effort setting.
        thinking_config=types.ThinkingConfig(
            thinking_budget=settings.gemini_thinking_budget
        ),
        **extra,
    )


def _to_contents(messages: Sequence[dict[str, str]]) -> list[types.Content]:
    """Chat history -> Gemini contents. Gemini calls the assistant role 'model'."""
    return [
        types.Content(
            role="model" if m["role"] == "assistant" else "user",
            parts=[types.Part.from_text(text=m["content"])],
        )
        for m in messages
    ]


def _to_parts(user: str | list) -> list[types.Part]:
    """Accepts a plain string, or the block list the vision callers already build.

    The blocks are in the shape the previous provider used
    ({"type": "image", "source": {...}}); translating here keeps that detail out
    of the routers.
    """
    if isinstance(user, str):
        return [types.Part.from_text(text=user)]

    parts: list[types.Part] = []
    for block in user:
        kind = block.get("type")
        if kind == "text":
            parts.append(types.Part.from_text(text=block["text"]))
        elif kind == "image":
            source = block.get("source", {})
            try:
                raw = base64.b64decode(source["data"], validate=True)
            except (KeyError, binascii.Error, ValueError) as exc:
                raise LLMError("Could not decode an image block.") from exc
            parts.append(
                types.Part.from_bytes(
                    data=raw, mime_type=source.get("media_type", "image/png")
                )
            )
        else:
            raise LLMError(f"Unsupported content block type: {kind!r}")
    return parts


def _translate(exc: Exception) -> LLMError:
    """Vendor exception -> our own, so routers never import the SDK."""
    if isinstance(exc, genai_errors.ClientError):
        status = getattr(exc, "code", None) or getattr(exc, "status_code", None)
        if status == 429:
            return LLMRateLimited("The AI service is rate-limiting this key.")
        if status in (401, 403):
            return LLMAuthError("The AI service rejected the API key.")
        return LLMUnavailable(f"The AI service rejected the request ({status}).")
    if isinstance(exc, genai_errors.ServerError):
        return LLMUnavailable("The AI service had a server error.")
    if isinstance(exc, genai_errors.APIError):
        return LLMUnavailable("The AI service could not be reached.")
    return LLMUnavailable("Unexpected failure talking to the AI service.")


async def stream_text(
    *,
    system: str,
    messages: Sequence[dict[str, str]],
    max_tokens: Optional[int] = None,
) -> AsyncIterator[str]:
    """Yield the answer in chunks as it is generated."""
    settings = get_settings()
    try:
        stream = await get_client().aio.models.generate_content_stream(
            model=settings.gemini_model,
            contents=_to_contents(messages),
            config=_config(system=system, max_tokens=max_tokens),
        )
        async for chunk in stream:
            text = chunk.text
            if text:
                yield text
    except LLMError:
        raise
    except Exception as exc:  # noqa: BLE001 - translated below
        logger.exception("Streaming failed")
        raise _translate(exc) from exc


async def complete_structured(
    *,
    system: str,
    user: str | list,
    output_format: type,
    max_tokens: int = 700,
):
    """One non-streaming call returning a validated Pydantic model.

    Signature unchanged from the previous provider so callers did not move.
    """
    settings = get_settings()
    try:
        response = await get_client().aio.models.generate_content(
            model=settings.gemini_model,
            contents=[types.Content(role="user", parts=_to_parts(user))],
            config=_config(
                system=system,
                max_tokens=max_tokens,
                response_mime_type="application/json",
                response_schema=output_format,
            ),
        )
    except LLMError:
        raise
    except Exception as exc:  # noqa: BLE001 - translated below
        logger.exception("Structured completion failed")
        raise _translate(exc) from exc

    parsed = response.parsed
    if parsed is None:
        raise LLMUnavailable("The AI service returned no usable JSON.")
    return parsed
