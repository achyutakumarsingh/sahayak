"""Sahayak backend — Claude orchestration layer and the ONNX crop-disease model.

Only the health route exists so far; the module routers land alongside their
frontend screens.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Backend for Sahayak — AI for public good (OOSC 4.0, PS 5).",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)


@app.get("/", tags=["system"], summary="Service banner")
async def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "version": app.version,
        "docs": "/docs",
        "health": "/api/health",
    }
