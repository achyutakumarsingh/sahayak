"""Farmers (flagship): real ONNX crop-disease inference and live mandi prices."""

import base64
import binascii
import hashlib
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.classifier import ModelUnavailable, classify, is_available, model_path
from app.services.llm import LLMAuthError, LLMError, complete_structured, has_api_key
from app.services.grounding import load_grounding
from app.services.mandi import MandiRateLimited, MandiUnavailable, fetch_prices
from app.services.prompts import build_system_prompt
from app.services.usage import bump

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/farmers", tags=["farmers"])

ALLOWED_MEDIA = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 5 * 1024 * 1024

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
FLAG_LOG = DATA_DIR / "flagged_diagnoses.jsonl"
FLAG_IMAGE_DIR = DATA_DIR / "flagged_images"
EXTENSIONS = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


class DiagnoseRequest(BaseModel):
    image_base64: str = Field(min_length=16)
    media_type: str
    language: str = "en"


class Advice(BaseModel):
    summary: str = Field(description="Two short sentences about what this finding means.")
    next_step: str = Field(description="One sentence: the single next thing to do.")
    caution: str = Field(description="One sentence naming who must confirm before spraying.")


@router.get("/model-status", summary="Whether a trained classifier is installed")
async def model_status() -> dict:
    return {"available": is_available(), "expectedPath": str(model_path())}


@router.get("/mandi", summary="Live mandi prices")
async def mandi(
    commodity: Optional[str] = Query(default=None, max_length=60),
    state: Optional[str] = Query(default=None, max_length=60),
    limit: int = Query(default=20, ge=1, le=100),
) -> dict:
    try:
        return await fetch_prices(commodity=commodity, state=state, limit=limit)
    except MandiRateLimited as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except MandiUnavailable as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach data.gov.in: {exc}")


@router.post("/diagnose", summary="Classify a crop photo with the trained model")
async def diagnose(request: DiagnoseRequest) -> dict:
    if request.media_type not in ALLOWED_MEDIA:
        raise HTTPException(status_code=415, detail=f"Unsupported image type '{request.media_type}'.")

    try:
        raw = base64.b64decode(request.image_base64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="The image data could not be decoded.")

    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"Image is over {MAX_BYTES // 1024} KB.")

    # No model means no diagnosis. There is deliberately no fallback path here:
    # a guessed disease name with a confidence number attached is worse than
    # nothing, because a farmer may act on it.
    try:
        result = classify(raw)
    except ModelUnavailable as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                f"No trained classifier is installed, so no diagnosis can be made. {exc} "
                "See backend/models/README.md."
            ),
        )
    except Exception:
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail="The classifier failed to run on this image.")

    # An unclear result is a valid outcome, not an error: the model ran, and the
    # honest answer is "retake the photo". No advice is generated, because there
    # is no finding to advise on.
    await bump("diagnoses")

    if result["status"] == "unclear":
        return {**result, "advice": None, "adviceAvailable": False}

    top = result["predictions"][0]
    advice = None

    # Advice is generated only from a label the model actually produced, and is
    # grounded on farmers.json — it never names a product or a dosage.
    if has_api_key():
        system = build_system_prompt("farmers", load_grounding("farmers"), request.language)
        user = (
            f"A trained classifier examined a crop photograph and returned "
            f"'{top['label']}' with confidence {top['confidence']:.0%}. "
            "Explain what that finding means and what the farmer should do next. "
            "Do not name any product, brand or dosage."
        )
        try:
            parsed: Advice = await complete_structured(system=system, user=user, output_format=Advice)
            advice = parsed.model_dump()
        except Exception:
            # Advice is the optional half of this response. The classification
            # already succeeded and is the part the farmer needs, so ANY failure
            # here degrades to adviceAvailable=false rather than losing the
            # diagnosis. A narrower except let an unexpected SDK error turn a
            # good inference into a 500.
            logger.exception("Advice generation failed; returning classification only")

    return {**result, "advice": advice, "adviceAvailable": advice is not None}


class FlagRequest(BaseModel):
    """A farmer telling us the model got it wrong."""

    predicted_label: str = Field(min_length=1, max_length=200)
    confidence: float = Field(ge=0.0, le=1.0)
    # The photo that produced the prediction. Kept so the case can be added to
    # a retraining set — a flag without the image is not much use.
    image_base64: str = Field(min_length=16)
    media_type: str
    note: Optional[str] = Field(default=None, max_length=300)


@router.post("/flag", summary="Report a wrong diagnosis")
async def flag(request: FlagRequest) -> dict:
    if request.media_type not in ALLOWED_MEDIA:
        raise HTTPException(status_code=415, detail=f"Unsupported image type '{request.media_type}'.")

    try:
        raw = base64.b64decode(request.image_base64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="The image data could not be decoded.")

    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"Image is over {MAX_BYTES // 1024} KB.")

    # Content hash as the filename: re-flagging the same photo overwrites rather
    # than piling up duplicates, and the ref is stable across restarts.
    digest = hashlib.sha256(raw).hexdigest()[:32]
    image_ref = f"flagged_images/{digest}{EXTENSIONS.get(request.media_type, '.bin')}"

    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "predicted_label": request.predicted_label,
        "confidence": round(request.confidence, 4),
        "image_ref": image_ref,
        "model": model_path().name,
    }
    if request.note:
        record["note"] = request.note

    try:
        FLAG_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        (DATA_DIR / image_ref).write_bytes(raw)
        # Append-only: one JSON object per line, so a partial write can never
        # corrupt earlier records the way rewriting a JSON array could.
        with FLAG_LOG.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    except OSError:
        logger.exception("Could not record the flag")
        raise HTTPException(status_code=500, detail="The report could not be saved.")

    return {"recorded": True, "imageRef": image_ref, "timestamp": record["timestamp"]}
