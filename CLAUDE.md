# Sahayak — AI for Public Good (OOSC 4.0, Problem Statement 5)

## Mission
One platform, eight modules, each serving a specific underserved community
in India (farmers, fishermen, artisans, vendors, citizens navigating public
services, persons with disabilities, rural students, disaster-vulnerable
communities). Flagship module (Farmers) includes a real trained image
classifier for crop disease detection — not just an LLM call.

## Stack
Frontend: Next.js (App Router) + Tailwind CSS, PWA-enabled, EN + HI minimum.
Backend: FastAPI (Python) — serves both the Claude-orchestration layer and
the ONNX disease-detection model.
Storage: SQLite for the prototype round (Postgres if time allows).
LLM: Claude API (Claude Sonnet) for every "agent" module.

## Design tokens
Use the exact CSS variables in the design-system prompt below. Flat cards,
1px hairline borders (never box-shadow), mono face reserved for
labels/metadata/numbers only, text+arrow CTAs as the default button style.

## Non-negotiables
- Every module that gives scheme/eligibility/medical-adjacent advice must
  show a visible disclaimer and must ground its answer in the curated
  dataset provided — never let the model invent scheme details or medical
  claims.
- Every screen must work in English and Hindi.
- Every screen must be usable by keyboard and screen reader.
- Mock/sample data (e.g. disaster alerts) must be visibly labeled as sample
  data in the UI, not presented as live.

## The eight modules
[paste the /01 table from this plan here]


- Farmers (flagship) — crop disease diagnosis from a photo via the trained model, plus Claude-generated advice, mandi price lookup, and weather-aware sowing tips.
- Fishermen — sea-condition dashboard (Open-Meteo Marine API: wave height, wind, swell) translated into a plain-language safety verdict.
- Artisans & Small Producers — upload a product photo, Claude generates a title, description, price band and tags in the local language.
- Micro-Entrepreneurs & Vendors — daily demand/inventory note, expense-income log, and a scheme matcher.
- Public Services Navigator — conversational eligibility checker grounded strictly on a curated JSON of real government schemes.
- Persons with Disabilities — voice-first mode (speech in/out) and a large-text/high-contrast mode applied across every module.
- Rural Education — doubt-solving chat grounded on a small corpus of real NCERT chapter excerpts, with citations.
- Disaster & Climate Resilience — alert banner (clearly labeled sample data for the demo) plus an AI-generated, hazard-specific preparedness checklist.

## Hover style (supersedes the earlier "never box-shadow" note for hover only)
Interactive surfaces (Card, Button, module tiles) use a soft cursor-tracking
accent glow on hover — a radial light in the accent color that follows the
mouse position, inspired by colecta.ai. Keep it subtle: low opacity (12-18%),
soft blur, no scale/transform, no change to layout. This is decorative, not
functional — it must never be the only signal of an interactive/focus state
(focus-visible outlines stay mandatory for keyboard users). Static surfaces
(non-interactive cards, panels) stay flat with no glow.
