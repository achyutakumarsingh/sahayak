"""Crop-disease classifier — real ONNX inference.

The flagship module must run an actual trained model, not an LLM guess. This
loads an ONNX graph from backend/models/ and runs it. When no model file is
present the endpoint reports that plainly; it never falls back to inventing a
diagnosis, because a wrong spray costs a farmer a season.
"""

import io
import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Optional

import numpy as np
import onnxruntime as ort
from PIL import Image

from app.config import get_settings

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

# A result is only reported as a diagnosis when the top class is confident on
# its own AND clearly ahead of the runner-up.
#
# The margin matters because the model has no out-of-distribution detection: a
# softmax always sums to 1, so an image the model has never seen anything like
# still gets divided among the eight classes it knows, and one of them can come
# out looking confident. A small top1-vs-top2 gap is the clearest signal we can
# read from the output that the model is torn rather than sure.
#
# This is a filter, not a guarantee. Softmax confidence is not calibrated, and
# an off-distribution photo can still produce a large top1 and a large margin
# (pure noise scores ~0.89 on this model). It removes the "torn between two
# classes" failures; it does not make the classifier safe on non-leaf images.
# That is why the screen still tells the farmer a photo cannot confirm a
# disease, whatever the numbers say.
CONFIDENCE_FLOOR = 0.55
MARGIN_FLOOR = 0.20


class ModelUnavailable(Exception):
    """No usable classifier is installed."""


def model_path() -> Path:
    return BACKEND_DIR / get_settings().crop_model_path


def labels_path() -> Path:
    return model_path().with_suffix(".labels.json")


def is_available() -> bool:
    return model_path().is_file() and labels_path().is_file()


@lru_cache(maxsize=1)
def _labels() -> list[str]:
    if not labels_path().is_file():
        raise ModelUnavailable(f"Missing labels file at {labels_path().name}")
    parsed = json.loads(labels_path().read_text(encoding="utf-8"))
    labels = parsed["labels"] if isinstance(parsed, dict) else parsed
    if not isinstance(labels, list) or not labels:
        raise ModelUnavailable("Labels file must contain a non-empty list.")
    return [str(label) for label in labels]


@lru_cache(maxsize=1)
def _session() -> ort.InferenceSession:
    if not model_path().is_file():
        raise ModelUnavailable(f"No model file at {model_path()}")
    # CPU only: this has to run on whatever the demo laptop is.
    return ort.InferenceSession(str(model_path()), providers=["CPUExecutionProvider"])


def _input_size(session: ort.InferenceSession) -> tuple[int, int]:
    """Read HxW off the graph so a differently-shaped model still works."""
    shape = session.get_inputs()[0].shape
    dims = [d if isinstance(d, int) else None for d in shape]
    if len(dims) == 4 and dims[2] and dims[3]:
        return int(dims[2]), int(dims[3])
    return 224, 224


def _preprocess(raw: bytes, size: tuple[int, int]) -> np.ndarray:
    image = Image.open(io.BytesIO(raw))
    image = image.convert("RGB").resize((size[1], size[0]), Image.BILINEAR)
    array = np.asarray(image, dtype=np.float32) / 255.0
    array = (array - IMAGENET_MEAN) / IMAGENET_STD
    # HWC -> NCHW
    return np.transpose(array, (2, 0, 1))[np.newaxis, ...].astype(np.float32)


def _softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - np.max(logits)
    exp = np.exp(shifted)
    return exp / np.sum(exp)


def classify(raw: bytes, top_k: int = 3) -> dict:
    """Run inference. Raises ModelUnavailable when nothing is installed."""
    session = _session()
    labels = _labels()

    outputs = session.run(None, {session.get_inputs()[0].name: _preprocess(raw, _input_size(session))})
    scores = np.asarray(outputs[0]).reshape(-1)

    if scores.size != len(labels):
        raise ModelUnavailable(
            f"Model outputs {scores.size} classes but the labels file lists {len(labels)}."
        )

    # Treat the output as logits unless it already looks like a distribution.
    probabilities = scores if np.isclose(scores.sum(), 1.0, atol=1e-3) and scores.min() >= 0 else _softmax(scores)
    ranked = np.argsort(probabilities)[::-1]

    top1 = float(probabilities[ranked[0]])
    top2 = float(probabilities[ranked[1]]) if ranked.size > 1 else 0.0
    margin = top1 - top2

    if top1 < CONFIDENCE_FLOOR:
        status, reason = "unclear", "low_confidence"
    elif margin <= MARGIN_FLOOR:
        status, reason = "unclear", "ambiguous"
    else:
        status, reason = "ok", None

    return {
        "status": status,
        "reason": reason,
        "predictions": [
            {"label": labels[i], "confidence": round(float(probabilities[i]), 4)}
            for i in ranked[:top_k]
        ],
        "topConfidence": round(top1, 4),
        "margin": round(margin, 4),
        "thresholds": {"confidence": CONFIDENCE_FLOOR, "margin": MARGIN_FLOOR},
        "model": model_path().name,
        "inputSize": list(_input_size(session)),
    }
