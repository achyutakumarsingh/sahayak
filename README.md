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
│       ├── components/ui/   Base components (Card, Button, SectionHeader, …)
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
Tailwind through `@theme inline`, so utilities resolve to the live CSS
variables and re-theme at runtime.

| Token          | Light     | Dark      | Tailwind utility  |
| -------------- | --------- | --------- | ----------------- |
| `--bg`         | `#FAF9F5` | `#14120F` | `bg-bg`           |
| `--surface`    | `#FFFFFF` | `#1C1A16` | `bg-surface`      |
| `--surface-2`  | `#F3F1EA` | `#201D18` | `bg-surface-2`    |
| `--text`       | `#14120F` | `#F3F1EA` | `text-ink`        |
| `--text-2`     | `#6B675F` | `#9A958A` | `text-ink-2`      |
| `--border`     | `#E4E0D6` | `#2C2A24` | `border-border`   |
| `--accent`     | `#CA4516` | `#FF7A45` | `text/bg-accent`  |
| `--accent-ink` | `#FFFFFF` | `#14120F` | `text-accent-ink` |

`--text` and `--text-2` map to the `ink` / `ink-2` colour names in Tailwind so
the utilities read `text-ink` rather than `text-text`. The CSS variables keep
the names from the spec. Derived on top: `--accent-wash` and the status tones
`--ok` / `--warn` / `--danger` / `--info`.

**Theming.** Light is the default on `:root`. Dark comes from either
`prefers-color-scheme` or an explicit `data-theme`, and because the dark block
is keyed on the attribute alone it also applies to a *nested* element — which
is how `/styleguide` renders both palettes on one page.

**Fonts.** Inter Tight for display and body, JetBrains Mono for labels,
metadata and numbers only, both via `next/font/google`. Noto Sans Devanagari
sits behind Inter Tight in the sans stack — Inter Tight has no Devanagari
coverage, so Hindi would otherwise fall back to a system face.

**House rules.** Flat cards, 1px borders, 8px radius, **never box-shadow**.
Text + arrow is the default CTA; solid accent is reserved for the single
primary action on a screen.

**Accessibility modes.** `data-text-size="large"` and `data-contrast="high"` on
`<html>` re-map the tokens globally, so the Persons with Disabilities module
needs no per-component overrides.

### Base components

`frontend/src/components/ui/` — import from `@/components/ui`:

| Component       | Notes                                                            |
| --------------- | ---------------------------------------------------------------- |
| `Card`          | Flat, 1px border, 8px radius. `tone` surface/sunken/bare, `interactive` for hover+focus-within |
| `Button`        | `variant="primary"` (solid accent) or `"text"` (default, + arrow). Renders `<a>` when given `href` |
| `SectionHeader` | Mono `/01` eyebrow + title, optional description and action slot  |
| `StatusDot`     | Coloured dot + mono label. The label carries the meaning, not the colour |
| `LanguageSwitch`| en/hi toggle; real links, works without JavaScript                |
| `Disclaimer`    | Bordered note for advice output (`tone="advice"`) and mock data (`tone="sample"`) |

### Styleguide

<http://localhost:3000/en/styleguide> renders every component against both
palettes side by side. Swatch hex values are read live from the DOM, so they
cannot drift from `globals.css`. The route is `noindex`, and a link appears in
the site footer in development only.

> **Contrast.** Every text pair in both themes meets WCAG AA (4.5:1), and the
> focus ring clears 2.4.11 (3:1) at 4.56:1 light / 6.72:1 dark. Two tokens were
> tuned to get there: the light accent is `#CA4516` rather than the `#E85C2B`
> this palette started from — same hue and saturation, 10% darker, because the
> original measured 3.50:1 and the accent carries small text in `Button`, the
> `/01` eyebrow and the flagship label; and `--warn` is `#9F5F11`, tuned
> against `--surface-2`, the tightest case, since `Disclaimer` puts its label
> on a sunken panel. Dark mode was already clear at 6.7–8.3:1 and is unchanged.
>
> One documented constraint: `--accent` as *small text* on `--surface-2`
> measures 4.25:1. No component does this today — sunken panels use `--text-2`
> or a status tone. Keep accent small text on `--bg` or `--surface`.

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
