"""Live sea conditions from Open-Meteo. Free, no API key.

Two endpoints are needed, not one: the Marine API carries wave, swell and
period, but wind speed and gusts live on the standard forecast API. Both are
Open-Meteo and both are keyless, so they are fetched concurrently and merged.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

import httpx

MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
TIMEOUT = httpx.Timeout(10.0, connect=5.0)

DATA = Path(__file__).resolve().parents[2] / "data" / "coastal_districts.json"


class UpstreamError(Exception):
    """Open-Meteo was unreachable or returned something unusable."""


@lru_cache(maxsize=1)
def districts() -> list[dict[str, Any]]:
    return json.loads(DATA.read_text(encoding="utf-8"))["districts"]


def find_district(slug: str) -> Optional[dict[str, Any]]:
    return next((d for d in districts() if d["slug"] == slug), None)


async def fetch_conditions(district: dict[str, Any]) -> dict[str, Any]:
    marine_params = {
        "latitude": district["latitude"],
        "longitude": district["longitude"],
        "current": "wave_height,wave_period,swell_wave_height,wind_wave_height",
        "timezone": "Asia/Kolkata",
    }
    wind_params = {
        "latitude": district["latitude"],
        "longitude": district["longitude"],
        "current": "wind_speed_10m,wind_gusts_10m,wind_direction_10m",
        "wind_speed_unit": "kmh",
        "timezone": "Asia/Kolkata",
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            marine_response = await client.get(MARINE_URL, params=marine_params)
            marine_response.raise_for_status()
            wind_response = await client.get(FORECAST_URL, params=wind_params)
            wind_response.raise_for_status()
    except httpx.HTTPError as exc:
        raise UpstreamError(str(exc)) from exc

    marine = marine_response.json().get("current", {})
    wind = wind_response.json().get("current", {})

    # A marine grid point over land returns nulls rather than an error.
    if marine.get("wave_height") is None:
        raise UpstreamError(
            f"No marine data for {district['slug']} — the sample point may be over land."
        )

    return {
        "district": district["slug"],
        "observedAt": marine.get("time"),
        "waveHeight": marine.get("wave_height"),
        "wavePeriod": marine.get("wave_period"),
        "swellHeight": marine.get("swell_wave_height"),
        "windWaveHeight": marine.get("wind_wave_height"),
        "windSpeed": wind.get("wind_speed_10m"),
        "windGusts": wind.get("wind_gusts_10m"),
        "windDirection": wind.get("wind_direction_10m"),
        "units": {
            "waveHeight": "m",
            "wavePeriod": "s",
            "swellHeight": "m",
            "windWaveHeight": "m",
            "windSpeed": "km/h",
            "windGusts": "km/h",
            "windDirection": "°",
        },
        "source": "Open-Meteo Marine API + Open-Meteo Forecast API",
    }
