"""Loads the per-module grounding corpus.

Every non-flagship module answers strictly from the file that matches its
slug. A module with no grounding file has nothing to answer from, so the
endpoint refuses rather than letting the model fall back on its own memory.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Optional

GROUNDING_DIR = Path(__file__).resolve().parents[2] / "grounding"

# .json is the curated form; .md is allowed for prose corpora such as the
# NCERT excerpts the education module will use.
SUFFIXES = (".json", ".md")


class GroundingNotFound(Exception):
    """No grounding file exists for the requested module."""


def available_modules() -> list[str]:
    if not GROUNDING_DIR.is_dir():
        return []
    found = {
        path.stem
        for path in GROUNDING_DIR.iterdir()
        if path.suffix in SUFFIXES and not path.name.startswith(".")
    }
    return sorted(found)


def _find(module: str) -> Optional[Path]:
    for suffix in SUFFIXES:
        candidate = GROUNDING_DIR / f"{module}{suffix}"
        if candidate.is_file():
            return candidate
    return None


@lru_cache(maxsize=32)
def load_grounding(module: str) -> str:
    """Return the module's grounding corpus as text for the system prompt.

    Cached: these files are read on every request and change only on deploy.
    Call load_grounding.cache_clear() after editing one in development.
    """
    path = _find(module)
    if path is None:
        raise GroundingNotFound(module)

    raw = path.read_text(encoding="utf-8")

    if path.suffix == ".json":
        # Re-dump so malformed JSON fails loudly here rather than silently
        # feeding the model a broken corpus.
        parsed = json.loads(raw)
        return json.dumps(parsed, ensure_ascii=False, indent=2)

    return raw
