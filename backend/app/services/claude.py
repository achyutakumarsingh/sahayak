"""LLM orchestration client supporting Google Gemini and Anthropic Claude."""

import base64
from functools import lru_cache
import json
import logging
import os
from typing import AsyncIterator, List, Optional, Union

from app.config import get_settings

logger = logging.getLogger(__name__)

# Obvious placeholders in .env should read as "no key"
PLACEHOLDER_MARKERS = ("paste", "your-", "xxx", "...", "changeme", "your_key_here")


def resolve_gemini_key() -> Optional[str]:
    settings = get_settings()
    key = (
        settings.gemini_api_key
        or settings.google_api_key
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
        or ""
    ).strip()
    if not key:
        return None
    lowered = key.lower()
    if any(marker in lowered for marker in PLACEHOLDER_MARKERS):
        return None
    return key


def resolve_anthropic_key() -> Optional[str]:
    settings = get_settings()
    key = (settings.anthropic_api_key or os.environ.get("ANTHROPIC_API_KEY") or "").strip()
    if not key or not key.startswith("sk-ant-"):
        return None
    lowered = key.lower()
    if any(marker in lowered for marker in PLACEHOLDER_MARKERS):
        return None
    return key


def get_active_provider() -> str:
    """Determine the active LLM provider based on settings and available keys."""
    settings = get_settings()
    if settings.llm_provider:
        return settings.llm_provider.lower()
    if resolve_gemini_key():
        return "gemini"
    if resolve_anthropic_key():
        return "anthropic"
    return "gemini"


def resolve_api_key() -> Optional[str]:
    """Resolve the key for the active provider."""
    provider = get_active_provider()
    if provider == "gemini":
        return resolve_gemini_key()
    return resolve_anthropic_key()


def has_api_key() -> bool:
    """Return True if any valid LLM API key is configured."""
    return resolve_api_key() is not None


def get_active_model() -> str:
    """Return the name of the active model."""
    settings = get_settings()
    provider = get_active_provider()
    if provider == "gemini":
        return settings.gemini_model
    return settings.anthropic_model


@lru_cache(maxsize=1)
def get_gemini_client():
    from google import genai

    key = resolve_gemini_key()
    return genai.Client(api_key=key)


@lru_cache(maxsize=1)
def get_anthropic_client():
    from anthropic import AsyncAnthropic

    settings = get_settings()
    kwargs = {"api_key": resolve_anthropic_key()}
    if settings.anthropic_base_url:
        kwargs["base_url"] = settings.anthropic_base_url
    return AsyncAnthropic(**kwargs)


def get_client():
    """Backward compatibility helper."""
    provider = get_active_provider()
    if provider == "gemini":
        return get_gemini_client()
    return get_anthropic_client()


async def complete_structured(
    *,
    system: str,
    user: Union[str, list],
    output_format: type,
    max_tokens: int = 700,
):
    """One non-streaming call returning a validated Pydantic model."""
    settings = get_settings()
    provider = get_active_provider()

    if provider == "gemini":
        from google.genai import types

        client = get_gemini_client()
        contents = []

        if isinstance(user, str):
            contents.append(user)
        elif isinstance(user, list):
            for item in user:
                if isinstance(item, dict):
                    if item.get("type") == "image":
                        source = item.get("source", {})
                        raw_bytes = base64.b64decode(source.get("data", ""))
                        media_type = source.get("media_type", "image/jpeg")
                        contents.append(
                            types.Part.from_bytes(data=raw_bytes, mime_type=media_type)
                        )
                    elif item.get("type") == "text":
                        contents.append(item.get("text", ""))
                elif isinstance(item, str):
                    contents.append(item)

        config = types.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            response_schema=output_format,
            max_output_tokens=max_tokens,
            temperature=0.2,
        )

        response = await client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=contents,
            config=config,
        )

        if not response.text:
            raise ValueError("Gemini returned empty response text")

        return output_format.model_validate_json(response.text)

    else:
        # Anthropic Claude
        client = get_anthropic_client()
        response = await client.messages.parse(
            model=settings.anthropic_model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
            output_format=output_format,
            output_config={"effort": settings.anthropic_effort},
        )
        return response.parsed_output


async def stream_completion(
    *,
    system: str,
    messages: List[dict],
    max_tokens: int = 700,
) -> AsyncIterator[dict]:
    """Stream token deltas and termination events."""
    settings = get_settings()
    provider = get_active_provider()

    if provider == "gemini":
        from google.genai import errors, types

        client = get_gemini_client()
        contents = [
            types.Content(
                role="user" if m.get("role") == "user" else "model",
                parts=[types.Part.from_text(text=m.get("content", ""))],
            )
            for m in messages
        ]

        config = types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=max_tokens,
            temperature=0.3,
        )

        try:
            stream = await client.aio.models.generate_content_stream(
                model=settings.gemini_model,
                contents=contents,
                config=config,
            )
            async for chunk in stream:
                if chunk.text:
                    yield {"type": "delta", "text": chunk.text}

            yield {
                "type": "done",
                "stopReason": "stop",
                "model": settings.gemini_model,
                "outputTokens": 0,
            }
        except errors.APIError as exc:
            logger.exception("Gemini API stream error: %s", exc)
            yield {
                "type": "error",
                "code": "upstream",
                "message": f"Gemini API error: {exc.message if hasattr(exc, 'message') else str(exc)}",
            }
        except Exception as exc:
            logger.exception("Gemini stream failed: %s", exc)
            yield {"type": "error", "code": "unknown", "message": "Something went wrong generating the answer."}

    else:
        # Anthropic Claude stream
        import anthropic

        client = get_anthropic_client()
        try:
            async with client.messages.stream(
                model=settings.anthropic_model,
                max_tokens=max_tokens,
                system=system,
                messages=messages,
                output_config={"effort": settings.anthropic_effort},
            ) as stream:
                async for text in stream.text_stream:
                    yield {"type": "delta", "text": text}

                final = await stream.get_final_message()
                yield {
                    "type": "done",
                    "stopReason": final.stop_reason,
                    "model": final.model,
                    "outputTokens": final.usage.output_tokens,
                }
        except anthropic.AuthenticationError:
            yield {"type": "error", "code": "auth", "message": "The Claude API key was rejected."}
        except anthropic.RateLimitError:
            yield {"type": "error", "code": "rate_limit", "message": "Too many requests just now. Try again shortly."}
        except anthropic.APIStatusError as exc:
            logger.exception("Claude API stream error")
            code = "upstream" if exc.status_code >= 500 else "request"
            yield {"type": "error", "code": code, "message": f"Claude API error ({exc.status_code})."}
        except anthropic.APIConnectionError:
            yield {"type": "error", "code": "network", "message": "Could not reach the Claude API."}
        except Exception:
            logger.exception("Unexpected failure streaming Claude response")
            yield {"type": "error", "code": "unknown", "message": "Something went wrong generating the answer."}
