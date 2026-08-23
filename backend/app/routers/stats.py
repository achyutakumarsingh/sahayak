"""Usage counters for the Impact strip on the home screen."""

from fastapi import APIRouter

from app.services.usage import read_stats

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/stats", summary="Requests served, by kind")
async def stats() -> dict:
    return {"stats": read_stats()}
