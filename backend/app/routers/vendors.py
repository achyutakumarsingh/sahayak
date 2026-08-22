"""Micro-Entrepreneurs & Vendors: daily log note and scheme matching."""

import json
import logging
from typing import List, Literal, Optional

import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.claude import complete_structured, has_api_key
from app.services.grounding import GROUNDING_DIR, load_grounding
from app.services.prompts import build_system_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/vendors", tags=["vendors"])


# --------------------------------------------------------------------------
#  (a) Daily log -> tomorrow-demand note
# --------------------------------------------------------------------------

class LogEntry(BaseModel):
    date: str
    sales_inr: float = Field(ge=0, le=10_000_000)
    stock_cost_inr: float = Field(ge=0, le=10_000_000)
    unsold_units: Optional[int] = Field(default=None, ge=0, le=100_000)
    note: Optional[str] = Field(default=None, max_length=200)


class DemandRequest(BaseModel):
    # The client keeps the log; only the recent window is sent.
    entries: List[LogEntry] = Field(min_length=1, max_length=7)
    language: str = "en"


class DemandNote(BaseModel):
    headline: str = Field(description="At most 8 words, in the requested language.")
    note: str = Field(description="Two or three short sentences, in the requested language.")
    confidence: Literal["low", "medium"] = Field(
        description="low when there are fewer than 5 entries, otherwise medium. Never higher."
    )


@router.post("/demand-note", summary="Tomorrow-demand note from recent entries")
async def demand_note(request: DemandRequest) -> dict:
    if not has_api_key():
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY is not set, so the demand note cannot be generated. Your log is still saved on this device.",
        )

    rows = "\n".join(
        f"- {e.date}: sales ₹{e.sales_inr:.0f}, stock cost ₹{e.stock_cost_inr:.0f}"
        + (f", {e.unsold_units} unsold" if e.unsold_units is not None else "")
        + (f" ({e.note})" if e.note else "")
        for e in request.entries
    )

    system = build_system_prompt("vendors", load_grounding("vendors"), request.language)
    user = (
        f"A vendor's last {len(request.entries)} daily entries:\n{rows}\n\n"
        "Using only the method described in the reference data, write a short "
        "note about what to order tomorrow. Do not invent a cause for any "
        "change you see. With fewer than five entries, say the pattern is not "
        "yet clear and set confidence to low."
    )

    try:
        parsed: DemandNote = await complete_structured(
            system=system, user=user, output_format=DemandNote
        )
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=502, detail="The Claude API key was rejected.")
    except anthropic.APIStatusError as exc:
        logger.exception("Demand note failed")
        raise HTTPException(status_code=502, detail=f"Claude API error ({exc.status_code}).")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=502, detail="Could not reach the Claude API.")

    return {"demand": parsed.model_dump(), "entriesUsed": len(request.entries)}


# --------------------------------------------------------------------------
#  (b) Scheme matching — deterministic, against the /services dataset
# --------------------------------------------------------------------------

class Profile(BaseModel):
    occupation: Literal["vendor", "artisan", "other"]
    age: int = Field(ge=14, le=120)
    annual_income_inr: int = Field(ge=0, le=100_000_000)
    gender: Literal["female", "male", "other", "unspecified"] = "unspecified"
    has_vending_certificate: bool = False
    language: str = "en"


def _schemes() -> list[dict]:
    """The same file /services is grounded on."""
    raw = json.loads((GROUNDING_DIR / "services.json").read_text(encoding="utf-8"))
    return raw.get("schemes", [])


@router.post("/schemes", summary="Match a vendor profile against the scheme dataset")
async def match_schemes(profile: Profile) -> dict:
    """Rule-based on purpose.

    Eligibility is decided in code against the dataset, not by the model, so a
    result can always be traced to a specific criterion. The model is never
    asked to judge who qualifies.
    """
    matched, missed = [], []

    for scheme in _schemes():
        criteria = scheme.get("criteria", {})
        reasons: list[str] = []

        occupations = criteria.get("occupations")
        if occupations and profile.occupation not in occupations:
            reasons.append("occupation")

        genders = criteria.get("genders")
        if genders and profile.gender not in genders:
            reasons.append("gender")

        cap = criteria.get("max_annual_income_inr")
        if cap is not None and profile.annual_income_inr > cap:
            reasons.append("income")

        if profile.age < criteria.get("min_age", 0):
            reasons.append("age")
        if profile.age > criteria.get("max_age", 200):
            reasons.append("age")

        if criteria.get("requires_vending_certificate") and not profile.has_vending_certificate:
            reasons.append("vending_certificate")

        record = {
            "id": scheme["id"],
            "verified": scheme.get("verified", False),
            "name": scheme.get("name", {}),
            "summary": scheme.get("summary", {}),
            "documents": scheme.get("documents", {}),
            "criteria": criteria,
        }
        if reasons:
            missed.append({**record, "failedOn": reasons})
        else:
            matched.append(record)

    return {
        "matched": matched,
        "notMatched": missed,
        "datasetVerified": all(s.get("verified") for s in _schemes()) if _schemes() else False,
        "source": "grounding/services.json",
    }
