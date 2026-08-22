"""Live mandi prices from data.gov.in (Agmarknet daily commodity prices)."""

import logging
from typing import Any, Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070"
URL = f"https://api.data.gov.in/resource/{RESOURCE}"
TIMEOUT = httpx.Timeout(12.0, connect=5.0)

# data.gov.in never sends a response body to httpx's default
# "python-httpx/x.y" agent — the connection opens and then hangs until the read
# times out. An explicit, descriptive agent gets an immediate 200.
HEADERS = {
    "User-Agent": "Sahayak/0.1 (AI for public good; OOSC 4.0)",
    "Accept": "*/*",
}


class MandiUnavailable(Exception):
    """data.gov.in was unreachable or rejected the request."""


class MandiRateLimited(MandiUnavailable):
    """The API key is being throttled — almost always the shared sample key."""


async def fetch_prices(
    *, commodity: Optional[str] = None, state: Optional[str] = None, limit: int = 20
) -> dict[str, Any]:
    params: dict[str, Any] = {
        "api-key": get_settings().data_gov_in_api_key,
        "format": "json",
        "limit": max(1, min(limit, 100)),
    }
    if commodity:
        params["filters[commodity]"] = commodity
    if state:
        params["filters[state]"] = state

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, headers=HEADERS) as client:
            response = await client.get(URL, params=params)
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            raise MandiRateLimited(
                "data.gov.in is rate-limiting this API key. The default is the shared "
                "sample key from data.gov.in's own documentation, which everyone uses. "
                "Register a free key at https://data.gov.in and set DATA_GOV_IN_API_KEY "
                "in backend/.env."
            ) from exc
        raise MandiUnavailable(f"HTTP {exc.response.status_code}") from exc
    except httpx.HTTPError as exc:
        raise MandiUnavailable(str(exc) or "network error") from exc
    except ValueError as exc:
        raise MandiUnavailable("data.gov.in returned a non-JSON response") from exc

    if isinstance(payload, dict) and payload.get("error"):
        raise MandiUnavailable(str(payload["error"]))

    records = payload.get("records", []) if isinstance(payload, dict) else []

    def number(value: Any) -> Optional[float]:
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    return {
        "records": [
            {
                "commodity": r.get("commodity"),
                "variety": r.get("variety"),
                "state": r.get("state"),
                "district": r.get("district"),
                "market": r.get("market"),
                "arrivalDate": r.get("arrival_date"),
                "minPrice": number(r.get("min_price")),
                "maxPrice": number(r.get("max_price")),
                "modalPrice": number(r.get("modal_price")),
            }
            for r in records
        ],
        "count": len(records),
        "unit": "₹ per quintal",
        "source": "data.gov.in — Agmarknet daily commodity prices",
        "usingSampleKey": get_settings().data_gov_in_api_key.startswith("579b464db66ec23bdd000001"),
    }
