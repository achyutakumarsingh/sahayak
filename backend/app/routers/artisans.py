"""Photo-to-listing for the Artisans module."""

import base64
import binascii
import logging
from typing import List

import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import get_settings
from app.services.claude import complete_structured, get_client, has_api_key
from app.services.grounding import load_grounding
from app.services.prompts import build_listing_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/artisans", tags=["artisans"])

ALLOWED_MEDIA = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB decoded


class Listing(BaseModel):
    title_en: str = Field(description="One line: the object and its material, in English.")
    title_local: str = Field(description="The same title in the requested language.")
    description_en: str = Field(description="Exactly three short sentences, in English.")
    description_local: str = Field(description="Exactly three short sentences, in the requested language.")
    price_min_inr: int = Field(description="Lower end of the suggested band, in rupees.")
    price_max_inr: int = Field(description="Upper end of the suggested band, in rupees.")
    tags_en: List[str] = Field(description="Exactly five lowercase tags, no '#'.")
    tags_local: List[str] = Field(description="The same five tags in the requested language.")


class ListingRequest(BaseModel):
    # Base64 without the data: URL prefix; the frontend strips it.
    image_base64: str = Field(min_length=16)
    media_type: str
    language: str = "en"


@router.post("/listing", summary="Generate a marketplace listing from a photo")
async def listing(request: ListingRequest) -> dict:
    if request.media_type not in ALLOWED_MEDIA:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type '{request.media_type}'. Use JPEG, PNG, WebP or GIF.",
        )

    try:
        raw = base64.b64decode(request.image_base64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="The image data could not be decoded.")

    if len(raw) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image is {len(raw) // 1024} KB. The limit is {MAX_BYTES // 1024} KB.",
        )

    if not has_api_key():
        raise HTTPException(
            status_code=503,
            detail=(
                "ANTHROPIC_API_KEY is not set, so a listing cannot be generated. "
                "Add a real key to backend/.env and restart the backend."
            ),
        )

    system = build_listing_prompt(load_grounding("artisans"), request.language)
    content = [
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": request.media_type,
                "data": request.image_base64,
            },
        },
        {
            "type": "text",
            "text": (
                "Write a marketplace listing for the object in this photograph. "
                "Give the title, a three-sentence description, a suggested price "
                "band in rupees, and five tags — each in English and in the "
                "requested language."
            ),
        },
    ]

    try:
        parsed: Listing = await complete_structured(
            system=system, user=content, output_format=Listing, max_tokens=1400
        )
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=502, detail="The Claude API key was rejected.")
    except anthropic.APIStatusError as exc:
        logger.exception("Listing generation failed")
        raise HTTPException(status_code=502, detail=f"Claude API error ({exc.status_code}).")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=502, detail="Could not reach the Claude API.")

    return {"listing": parsed.model_dump(), "model": get_settings().anthropic_model}
