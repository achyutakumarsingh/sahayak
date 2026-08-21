# Sahayak — AI for Public Good

**OOSC 4.0 · Problem Statement 5**

One platform, eight modules, each built for a specific underserved community in
India. Every screen works in English and Hindi, on a keyboard, and with a screen
reader. The flagship Farmers module carries a real trained image classifier for
crop-disease detection — not just an LLM call.

---

## Repository layout

```
sahayak/
├── frontend/          Next.js 16 (App Router) · TypeScript · Tailwind v4 · PWA
│   └── src/
│       ├── app/[locale]/    Locale-scoped routes — one folder per module
│       ├── components/      Shared UI (header, module card, module stub)
│       ├── i18n/            Locale config + en/hi dictionaries
│       └── lib/             Module registry, API helper
├── backend/           FastAPI · Claude orchestration + ONNX model server
│   └── app/
│       ├── main.py          App factory, CORS, router wiring
│       ├── config.py        Settings loaded from backend/.env
│       └── routers/         One router per module (health.py today)
└── scripts/           Setup helpers
```

## Prerequisites

| Tool    | Version  | Check                |
| ------- | -------- | -------------------- |
| Node.js | ≥ 20     | `node -v`            |
| Python  | ≥ 3.11   | `python3 --version`  |

On macOS: `brew install node python@3.13`

## First-time setup

```bash
git clone <this-repo> sahayak && cd sahayak

npm install     # root tooling (concurrently)
npm run setup   # frontend deps + backend venv + .env files from the examples
```

`npm run setup` copies `backend/.env.example` → `backend/.env`. Open that file
and add your Claude API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at <https://console.anthropic.com/settings/keys>. The health endpoint
works without one; the agent modules will not.

## Run both servers

```bash
npm run dev
```

| Service  | URL                              |
| -------- | -------------------------------- |
| Frontend | <http://localhost:3000>          |
| Backend  | <http://localhost:8000>          |
| API docs | <http://localhost:8000/docs>     |
| Health   | <http://localhost:8000/api/health> |

`/` redirects to `/en` or `/hi` based on your `Accept-Language` header, and the
choice is remembered in a cookie.

### Running them separately

```bash
npm run dev:frontend    # next dev on :3000
npm run dev:backend     # uvicorn --reload on :8000
```

Or drive the backend directly:

```bash
cd backend
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

### Verify the backend

```bash
curl http://localhost:8000/api/health
# {"status":"ok"}
```

## All scripts

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run setup`     | Install frontend deps, build the venv, seed `.env`  |
| `npm run dev`       | Start frontend + backend together                   |
| `npm run build`     | Production build of the frontend                    |
| `npm start`         | Serve the production build + backend                |
| `npm run lint`      | ESLint over the frontend                            |
| `npm run typecheck` | `tsc --noEmit` over the frontend                    |
| `npm run health`    | `curl` the health endpoint                          |

## The eight modules

| Route            | Module                        | What it does                                                                 |
| ---------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| `/farmers`       | Farmers *(flagship)*          | Crop-disease diagnosis from a photo, plus treatment advice, mandi prices, sowing tips |
| `/fishermen`     | Fishermen                     | Sea conditions from the Open-Meteo Marine API as a plain-language safety verdict |
| `/artisans`      | Artisans & Small Producers    | Product photo → listing title, description, price band and tags in the local language |
| `/vendors`       | Micro-Entrepreneurs & Vendors | Demand/inventory note, income–expense log, scheme matcher                     |
| `/services`      | Public Services Navigator     | Eligibility checker grounded strictly on curated government-scheme data       |
| `/accessibility` | Persons with Disabilities     | Voice-first mode plus large-text and high-contrast modes across every module  |
| `/education`     | Rural Education               | Doubt-solving tutor grounded on NCERT chapter excerpts, with citations        |
| `/disaster`      | Disaster & Climate Resilience | Hazard alert banner (labelled sample data) and an AI preparedness checklist   |

Every route is currently a **stub** rendering the module name and its
one-line description in both locales.

## Internationalisation

Routes live under `src/app/[locale]/`, where `locale` is `en` or `hi`.

- Add a string: put it in **both** `src/i18n/dictionaries/en.json` and
  `hi.json`. `en.json` is the source of truth for the `Dictionary` type, so a
  key missing from `hi.json` is a type error.
- Add a locale: extend `locales` in `src/i18n/config.ts`, add its dictionary,
  and register the loader in `src/i18n/get-dictionary.ts`.
- Devanagari renders through Noto Sans Devanagari, wired in the locale layout.

## PWA

- Manifest is generated at `/manifest.webmanifest` by `src/app/manifest.ts`.
- `public/sw.js` serves static assets cache-first and documents network-first,
  falling back to `public/offline.html`.
- The worker **only registers in production builds** — it would fight hot
  reload in dev. To test it: `npm run build && npm start`, then check
  DevTools → Application → Service Workers.

## Design system

Tokens live at the top of `frontend/src/app/globals.css` and are exposed to
Tailwind through `@theme inline`, so `bg-surface`, `text-muted`,
`border-hairline` and friends resolve to the CSS variables.

House rules, enforced by the `.card`, `.label`, `.meta` and `.cta` component
classes in the same file:

- Flat cards with **1px hairline borders — never box-shadow**.
- The mono face is reserved for labels, metadata and numbers.
- The default CTA is **text + arrow**, not a filled pill.
- `[data-text-size="large"]` and `[data-contrast="high"]` on `<html>` re-map the
  tokens for the Accessibility module — no per-component overrides needed.

> **Note:** `CLAUDE.md` refers to "the exact CSS variables in the design-system
> prompt below", but that prompt block is not in the file. The tokens here were
> derived from the stated constraints. Drop in the real values when you have
> them — everything downstream reads the variables, so nothing else changes.

## Non-negotiables

Carried from `CLAUDE.md`, and they apply to every module added from here:

1. Any scheme, eligibility or medical-adjacent answer shows a **visible
   disclaimer** and is grounded in the curated dataset — the model never
   invents scheme details or medical claims.
2. Every screen works in **English and Hindi**.
3. Every screen is usable by **keyboard and screen reader**.
4. Mock data (e.g. disaster alerts) is **visibly labelled as sample data**.

## Adding a module

1. Add the slug to `frontend/src/lib/modules.ts`.
2. Add `modules.<slug>` copy to both dictionaries.
3. Create `frontend/src/app/[locale]/<slug>/page.tsx` (copy an existing stub).
4. Add `backend/app/routers/<slug>.py` and include it in `app/main.py`.
