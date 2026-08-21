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

## App shell

`src/components/shell/` — one shell wraps every locale route.

| Piece                | Notes                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| `AppShell`           | Sidebar from `lg` up, compact top bar + bottom tabs below it           |
| `Sidebar`            | All eight modules, language, accessibility, account                    |
| `BottomNav`          | Home · Modules · More, with the modules and settings sheets            |
| `Sheet`              | Mobile sheet built on `<dialog>` — the browser supplies modal semantics, focus trapping and Escape |
| `ModuleNav`          | Shared link list, marks the current module with `aria-current="page"`  |
| `AccessibilityMenu`  | The two persistent toggles                                             |
| `AccountPanel`       | Session state and sign in / sign out                                   |

**Mobile nav is three tabs, not eight.** At 360px, eight targets come out
under the 44px minimum with labels too small to read. Modules live one tap
away in a sheet that lists all eight, which keeps every target comfortably
above the minimum.

## Preferences and session

Both live in `localStorage` and are read through `useSyncExternalStore`
(`src/components/providers.tsx`), so React hydrates with the server snapshot
and re-renders with the stored value — no mismatch, no `setState` in an
effect, and two open tabs stay in step via the `storage` event.

- **Large text** sets `data-text-size="large"` on `<html>`, which re-maps both
  the type scale *and* the spacing tokens. Measured: body 15px → 19px, card
  padding 20px → 26px. Scaling type without spacing would make the layout
  tighter exactly for the reader who asked for more room.
- **Voice mode** is a placeholder. It persists and shows a standing note that
  speech is not connected yet, so the setting never implies a capability the
  app does not have.
- `PreferencesScript` re-applies both in `<head>` before first paint, so large
  text does not flash in at the default size on every navigation.

> **Storage keys live in `src/lib/storage.ts`, not in `providers.tsx`.** That
> file is a `"use client"` module, and when a server component imports a plain
> constant from one, Next hands back a client-reference proxy instead of the
> value — the inline script shipped as
> `localStorage.getItem(undefined)` and silently lost every saved preference
> across navigations.

## Sign-in stub

`/{locale}/sign-in` — any 10-digit number and any 4–6 digit code creates a
session. **No SMS is sent and no number is verified**; the session is
`localStorage` only. The screen carries a `Disclaimer` saying exactly that, in
both locales. Replace `SignInForm`'s `signIn(phone)` call with a real
verification exchange when there is a backend for it.

## Grounded agent pattern

Every non-flagship module shares one endpoint and one component. What differs
per module is a role line and a grounding file — not code.

**Backend** — `POST /api/agent/{module}` with `{messages, language}`, replying
as an SSE stream.

```
backend/
├── grounding/{module}.json      curated corpus — the only source of truth
└── app/
    ├── routers/agent.py         the route, streaming, error mapping
    ├── schemas/agent.py         request validation
    └── services/
        ├── grounding.py         loads + caches the corpus (.json or .md)
        ├── prompts.py           per-module role line + the shared rules
        └── claude.py            AsyncAnthropic client
```

`GET /api/agent/modules` lists which modules have a corpus and whether a key is
configured.

The system prompt tells the model to answer **only** from the corpus and to
reply with a fixed refusal string otherwise, to answer in the requested
language, and to keep to 40–80 words of plain, practical wording for readers
with limited literacy. Requests run at `effort: "low"` — these are grounded
lookups, not reasoning tasks — with `max_tokens` capped at 700.

**Frontend** — drop `ChatPanel` into any module page with a slug:

```tsx
<ChatPanel module="fishermen" locale={locale} dict={dict} />
```

It renders the message list, streaming output, input, and a `Disclaimer` slot
(default grounding disclaimer; override with `disclaimer`, or pass `null`).
`src/lib/agent-stream.ts` reads the SSE body directly — `EventSource` cannot
issue a POST.

**Refusals are the feature, not a failure.** A module whose corpus does not
cover a question must say so. `services` and `education` ship with
*intentionally empty* corpora for exactly this reason: scheme records and NCERT
excerpts have to be curated from official sources before those modules can
answer anything, and until then refusing is the correct behaviour.

> **Every grounding file is a placeholder.** Each carries
> `"status": "placeholder"` and a note saying so. Replace them with curated,
> sourced data before showing any module to real users.

### Adding a module to the pattern

1. Write `backend/grounding/<slug>.json`.
2. Add a role line to `MODULE_ROLES` in `app/services/prompts.py`.
3. Drop `<ChatPanel module="<slug>" … />` into the module page.

### Testing the stream without a key

`ANTHROPIC_BASE_URL` points the SDK at any Anthropic-compatible host, so the
streaming path can be exercised against a local stub. Without a key the
endpoint returns a 503 naming exactly what to set.

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
| `--accent-hover`| `#B33D13` | `#FF9064` | `bg-accent-hover` |

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

**Hover glow.** Interactive surfaces — `Card interactive`, `Button` (both
variants), module tiles — carry a cursor-tracking accent glow, the one place
hover exceeds the flat rule. It is a radial gradient, not a shadow, and it
never scales or transforms.

- Opt in with `data-glow`: `"surface"` (accent tint), `"solid"` (accent-ink
  tint, for a solid accent fill where an accent glow would be invisible), or
  `"text"` (widens past a padding-less box without touching layout).
- `PointerGlow` in the layout is a single delegated document listener that
  writes `--mouse-x` / `--mouse-y`, batched into one `requestAnimationFrame`.
  Using one listener instead of an `onMouseMove` per component keeps `Card`
  and `Button` as server components shipping no JavaScript of their own.
- Alpha rides in the colour through the `--accent-rgb` / `--accent-ink-rgb`
  channel tokens: `rgb(var(--glow-rgb) / .15)`. `color-mix()` would need an
  `@supports` fallback, and the fallback lightningcss emits **drops the
  percentage entirely**, painting a full-strength accent blob over the content.
- **Decorative and mouse-only.** Every state it dresses is also carried by a
  border shift, an underline or a focus-visible outline. Coarse pointers,
  high-contrast mode and `forced-colors` get no glow at all; reduced motion
  drops the tracking and falls back to a flat 8% tint. Keyboard focus keeps its
  outline and gets no glow.
- Static cards and panels stay flat.

**Accessibility modes.** `data-text-size="large"` and `data-contrast="high"` on
`<html>` re-map the tokens globally, so the Persons with Disabilities module
needs no per-component overrides.

> **Layers matter.** The element resets (`*`, `html`, `body`, `::selection`,
> the `:focus-visible` baseline) live inside `@layer base`. Unlayered, they
> outrank *every* Tailwind utility regardless of specificity — which silently
> killed `border-transparent`, `border-accent`, `border-warn/45` and `Card`'s
> hover border shift. Keep new global element rules in `@layer base`.

> **Dark Reader.** The locale layout sets `<meta name="darkreader-lock">`.
> Sahayak ships its own light and dark themes; without the lock, the extension
> re-colours the page on top of them and injects attributes into `<html>` that
> cause a React hydration mismatch.

### Base components

`frontend/src/components/ui/` — import from `@/components/ui`:

| Component       | Notes                                                            |
| --------------- | ---------------------------------------------------------------- |
| `Card`          | Flat, 1px border, 8px radius. `tone` surface/sunken/bare; `interactive` adds the border shift and the hover glow |
| `Button`        | `variant="primary"` (solid accent, deepens on hover) or `"text"` (default, + arrow). Renders `<a>` when given `href` |
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
