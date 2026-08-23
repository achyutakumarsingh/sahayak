"""Lightweight usage counters.

A small JSON file rather than an in-memory dict, so the numbers survive a
backend restart during a demo. An asyncio lock serialises the read-modify-write
because several module routes bump it concurrently.

These are counts of requests served. They are not a measure of anyone being
helped, and nothing here identifies a person.
"""

import asyncio
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
STATS_FILE = DATA_DIR / "usage_stats.json"

COUNTERS = ("diagnoses", "schemeMatches", "questions")

_lock = asyncio.Lock()


def _empty() -> dict[str, int]:
    return {name: 0 for name in COUNTERS}


def read_stats() -> dict[str, int]:
    try:
        stored = json.loads(STATS_FILE.read_text(encoding="utf-8"))
    except (FileNotFoundError, ValueError):
        return _empty()
    # Unknown keys are dropped and missing ones default to zero, so an older or
    # hand-edited file cannot break the endpoint.
    return {name: int(stored.get(name, 0)) for name in COUNTERS}


async def bump(counter: str, amount: int = 1) -> dict[str, int]:
    if counter not in COUNTERS:
        raise ValueError(f"Unknown counter '{counter}'")

    async with _lock:
        stats = read_stats()
        stats[counter] += amount
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            STATS_FILE.write_text(json.dumps(stats, indent=2) + "\n", encoding="utf-8")
        except OSError:
            # A read-only disk should never take down the request that was
            # being counted.
            logger.exception("Could not persist usage stats")
        return stats
