"""POST /api/agent/{module} — the shared grounded-agent endpoint.

Every non-flagship module uses this one route. What differs per module is the
role line in the system prompt and the grounding corpus; the streaming,
validation and refusal behaviour is identical.
"""

import json
import logging
from typing import AsyncIterator

from fastapi import APIRouter, HTTPException, Path
from fastapi.responses import StreamingResponse

from app.config import get_settings
from app.schemas.agent import AgentRequest
from app.services.llm import (
    LLMAuthError,
    LLMError,
    LLMRateLimited,
    has_api_key,
    stream_text,
)
from app.services.grounding import GroundingNotFound, available_modules, load_grounding
from app.services.prompts import build_system_prompt
from app.services.usage import bump

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent", tags=["agent"])


def sse(payload: dict) -> str:
    """One server-sent event. The blank line terminates the event."""
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


@router.get("/modules", summary="Modules that have a grounding corpus")
async def list_modules() -> dict:
    return {"modules": available_modules(), "configured": has_api_key()}


@router.post("/{module}", summary="Ask a module's grounded agent")
async def ask(
    request: AgentRequest,
    module: str = Path(pattern=r"^[a-z][a-z0-9-]{1,30}$"),
) -> StreamingResponse:
    try:
        grounding = load_grounding(module)
    except GroundingNotFound:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No grounding data for '{module}'. "
                f"Available: {', '.join(available_modules()) or 'none'}."
            ),
        )
    except json.JSONDecodeError as exc:
        # A broken corpus must not silently degrade into an ungrounded answer.
        logger.exception("Grounding file for %s is not valid JSON", module)
        raise HTTPException(
            status_code=500, detail=f"Grounding data for '{module}' is malformed: {exc}"
        )

    if not has_api_key():
        raise HTTPException(
            status_code=503,
            detail=(
                "GEMINI_API_KEY is not set. Add a real key to backend/.env "
                "and restart the backend. Get one at "
                "https://aistudio.google.com/apikey"
            ),
        )

    settings = get_settings()
    system = build_system_prompt(module, grounding, request.language)
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    async def event_stream() -> AsyncIterator[str]:
        try:
            answer_started = False
            async for text in stream_text(system=system, messages=messages):
                answer_started = True
                yield sse({"type": "delta", "text": text})

            # Counted on completion, not on request, so an aborted or failed
            # stream is not recorded as an answered question.
            if answer_started:
                await bump("questions")

            yield sse({"type": "done", "model": settings.gemini_model})

        except LLMAuthError:
            yield sse({"type": "error", "code": "auth", "message": "The AI service rejected the API key."})
        except LLMRateLimited:
            yield sse({"type": "error", "code": "rate_limit", "message": "Too many requests just now. Try again shortly."})
        except LLMError as exc:
            logger.exception("AI service error for module %s", module)
            yield sse({"type": "error", "code": "upstream", "message": str(exc)})
        except Exception:
            logger.exception("Unexpected failure streaming module %s", module)
            yield sse({"type": "error", "code": "unknown", "message": "Something went wrong generating the answer."})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",  # stop nginx buffering the stream in prod
            "Connection": "keep-alive",
        },
    )
