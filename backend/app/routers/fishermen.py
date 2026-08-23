"""Sea-conditions dashboard for the Fishermen module.

The readings and the verdict are deliberately separate calls: the numbers come
from Open-Meteo and are always available, while the verdict needs an AI service key.
A crew with no key still sees the real data.
"""

import logging
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.llm import LLMAuthError, LLMError, complete_structured, has_api_key
from app.services.grounding import load_grounding
from app.services.marine import UpstreamError, fetch_conditions, find_district, districts
from app.services.prompts import build_system_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/fishermen", tags=["fishermen"])


class Verdict(BaseModel):
    """Shape the model must return."""

    level: Literal["safe", "caution", "danger"] = Field(
        description="safe = fine to go out, caution = experienced crews only, danger = do not go out"
    )
    headline: str = Field(description="At most 6 words, in the requested language.")
    advice: str = Field(description="Two short sentences, in the requested language.")


class VerdictRequest(BaseModel):
    district: str
    language: str = "en"


@router.get("/districts", summary="Coastal districts with a sample point")
async def list_districts() -> dict:
    return {"districts": districts()}


@router.get("/conditions", summary="Live wave and wind readings")
async def conditions(district: str = Query(min_length=2, max_length=40)) -> dict:
    found = find_district(district)
    if found is None:
        raise HTTPException(status_code=404, detail=f"Unknown district '{district}'.")
    try:
        return await fetch_conditions(found)
    except UpstreamError as exc:
        raise HTTPException(
            status_code=502, detail=f"Could not reach Open-Meteo: {exc}"
        )


@router.post("/verdict", summary="Plain-language safety verdict")
async def verdict(request: VerdictRequest) -> dict:
    found = find_district(request.district)
    if found is None:
        raise HTTPException(status_code=404, detail=f"Unknown district '{request.district}'.")

    try:
        readings = await fetch_conditions(found)
    except UpstreamError as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach Open-Meteo: {exc}")

    if not has_api_key():
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not set, so the verdict cannot be generated. The readings above are live.",
        )

    # Same grounding as the chat: the thresholds the model reasons with are the
    # ones written in grounding/fishermen.json, not the model's own memory.
    system = build_system_prompt("fishermen", load_grounding("fishermen"), request.language)
    user = (
        "Current readings for "
        f"{found['name']['en']} ({found['state']['en']}):\n"
        f"- Significant wave height: {readings['waveHeight']} m\n"
        f"- Swell height: {readings['swellHeight']} m\n"
        f"- Wave period: {readings['wavePeriod']} s\n"
        f"- Wind speed: {readings['windSpeed']} km/h\n"
        f"- Wind gusts: {readings['windGusts']} km/h\n\n"
        "Using only the bands in the reference data, decide whether a small "
        "open country boat should go out now. Return the verdict level, a "
        "headline of at most 6 words, and two short sentences of advice."
    )

    try:
        parsed: Verdict = await complete_structured(
            system=system, user=user, output_format=Verdict
        )
    except LLMAuthError:
        raise HTTPException(status_code=502, detail="The AI service rejected the API key.")
    except LLMError as exc:
        logger.exception("Verdict generation failed")
        raise HTTPException(status_code=502, detail=str(exc))

    return {"readings": readings, "verdict": parsed.model_dump()}
