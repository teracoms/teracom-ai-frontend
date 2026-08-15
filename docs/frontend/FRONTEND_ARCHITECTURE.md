# Teracom AI — Frontend Architecture V1

**Status:** Design document, largely implemented — Packages 1 (Auth), 2 (Dashboard), 3 (Workers), 4 (Knowledge, excluding connectors), 5 (Chat), 6 (Memory), 7 (Administration), and 8 (Knowledge Connectors) below are shipped as real, backend-verified features. Package 9 (Billing & Licensing) has a complete frontend UX built against illustrative reference data (`teracom-ai-backend` has zero billing/licensing support of any kind) — see `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` — not a real licensing system; §C.12 below remains the design target, not yet backed by any schema. See [[frontend-status]] for the current build state and [[roadmap]] for sequencing. Originally filed at repo root as `FRONTEND_ARCHITECTURE_V1.md`; relocated here 2026-08-15 as part of the Teracom Operating Knowledge Base — content below is unchanged from the original, "V1" in the title refers to this document's own version, not the current state of the build.
**Scope:** Extend `teracom-ai-frontend` (public marketing/commerce site) into the authenticated Teracom AI product surface, backed by `teracom-ai-backend`.
**Principle:** Everything below **extends** the existing Next.js app. Nothing in the current site is redesigned, replaced, or restyled. New screens reuse the existing layout shell, CSS design tokens, component conventions, and route patterns already established in the repository.

---

## Part A — Existing Frontend Analysis

### A.1 What the repository actually is today

`teracom-ai-frontend` (package name `teracom-commerce-platform-v3`) is a **Next.js 14 App Router** site, plain JavaScript (not TypeScript — `tsconfig.json` is present but unused; every file is `.js` with JSX, `allowJs: true`, `strict: false`). No UI framework or component library — hand-written semantic HTML/JSX styled entirely through one global stylesheet using CSS custom properties. No client-side state library, no data-fetching library (no SWR/React Query/Redux), no CSS-in-JS. Only client-side interactivity is a single `'use client'` component (`CheckoutButton`) using local `useState`.

Current dependencies: `next@14.2.15`, `react@18.3.1`, `stripe@17.3.1`, `zod@3.23.8`. No `axios`, no `.env` loader beyond Next's built-in, no auth library, no test runner configured.

This is a lean, hand-built marketing + commerce site, not yet a product application. That is the correct starting point to extend — it is not a legacy system to work around.

### A.2 Layout structure

- **Root shell** (`app/layout.js`): a single persistent `<Header /> {children} <Footer />` wrapper around every route. No nested layouts exist yet (no `app/**/layout.js` beyond root).
- **Page shape convention**: every page is one `<main>` containing one or more `<section className="section ...">` blocks, each wrapping a `.container` (max-width `1180px`, fluid gutters via `calc(100% - 44px)`).
- **Grid patterns reused across pages**: `.hero-layout` (copy + image, 2-col), `.two-column` (sticky left rail + content), `.showcase-grid` (image + copy, reversible), `.feature-grid` / `.product-grid` (responsive 3-col card grids), `.about-layout`, `.contact-card`. All collapse to 1-column under `980px` and `640px` breakpoints defined once in `globals.css`.
- **Sticky, blurred header** (`position: sticky; backdrop-filter: blur(22px)`) at `86px` height; footer is a static 2-column brand/links block.

**Implication for extension:** the authenticated product area needs its **own nested layout** (sidebar + topbar app shell) rather than reusing the marketing `<Header>/<Footer>`, but it must reuse the same CSS tokens, container width, radius, and card conventions so it reads as the same product family. See §C.2/C.3.

### A.3 Navigation structure

- Primary nav (`components/Header.js`) is a flat, 5-item list: `What We Do` (anchor), `SecurityOS AI`, `Expertise` (anchor), `Store`, `Portal` — plus a standalone `Open Store` CTA button. No dropdowns, no active-route highlighting, no mobile menu (nav is simply `display:none` under `980px` — mobile has no navigation affordance today, a pre-existing gap, not something introduced here).
- Footer nav duplicates a subset of the same links.
- `/portal` is **already reserved** in the current IA as the placeholder for "future SecurityOS AI access, subscription management, downloads, training resources and customer tools" (`app/portal/page.js`) — this is the exact extension point the backend's `portal_*` routers were clearly designed to serve. §C.3 builds directly on this.

### A.4 Colour palette (design tokens, `app/globals.css` `:root`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#050505` | Page background |
| `--panel` / `--panel2` | `#0d0d0d` / `#141414` | Defined but not yet used by any current component — available for card/panel surfaces |
| `--text` | `#fff` | Primary text |
| `--muted` | `#b7b7b7` | Secondary/body copy |
| `--soft` | `#777` | Tertiary (footer meta text) |
| `--line` | `rgba(255,255,255,.11)` | All borders/dividers |
| `--red` | `#ff1717` | Primary brand/accent, primary buttons, tick marks, badges |
| `--red2` | `#ff4b4b` | Hover state, eyebrow text |
| `--shadow` | `0 35px 100px rgba(255,23,23,.14)` | Image/hero elevation |

Near-black base, near-pure-white text, single red accent used sparingly (CTAs, eyebrows, list markers) — a deliberately high-contrast, single-accent dark theme. There is no light theme and no theming mechanism (no `data-theme`, no CSS-var overrides). Any new screens must consume these same seven tokens rather than introducing new colours.

### A.5 Typography & spacing

- Font: `Inter` (loaded via generic font stack, not `next/font` — no font optimisation currently in place).
- Headings use `clamp()` fluid sizing (e.g. hero `h1`: `clamp(44px,6vw,82px)`) with tight, negative letter-spacing (`-.055em` to `-.07em`) — a consistent "large, tight, confident" display-type convention.
- Body copy is `18–19px`, `line-height:1.6` on `<body>`.
- Section rhythm: `.section` = `120px` vertical padding, `.section-spacious` = `150px`, both collapsing to `90px` under `980px`. `.alt` sections swap to `#090909` to create alternating-band page rhythm — this is the site's primary way of separating content blocks (not cards-on-white, not dividers).

### A.6 Component patterns

Small, flat set of reusable primitives, all class-driven (no component-level CSS modules):

- **Buttons**: `.btn` base + `.btn-primary` (solid red, glow shadow) / `.btn-secondary` (translucent outline) — pill-shaped (`border-radius:999px`), `14px 22px` padding, `800` weight, `translateY(-2px)` hover lift.
- **Eyebrow label**: `.eyebrow` — small caps, red, wide letter-spacing, used above every section heading.
- **Cards**: `.feature-grid article` / `.product-card` — `1px` `--line` border, `rgba(255,255,255,.04)` fill, `28px` radius, `30px` padding. `.product-card` adds a `.badge` (pill, red-tinted) and `.price` (`28px/900`).
- **Tick list**: `.tick-list` — custom clip-path checkmark bullets, used for feature enumeration.
- **Logo wall**: `.logo-wall` — bordered pill/card grid for partner/technology logos (static text today in `page.js`; a richer version with real logos and links already exists as the unused `ExpertisePartners.js` component — see §A.9).
- **Contact form**: plain uncontrolled `<form action="/api/leads" method="post">`, styled inputs (`#0b0b0b` fill, `18px` radius) — no client validation, no React state.
- **Checkout button**: the one client component in the codebase — `useState` loading flag, `fetch` → redirect to Stripe-hosted checkout URL, `alert()` on error. This is the *only* existing precedent for a client-side data-fetching interaction, and it is a useful minimal pattern (loading state, try/catch/finally, no wrapper library) to carry forward.

### A.7 Branding patterns

- Wordmark: `teracom-logo.png`, used at `245px` (header) and `260–178px` responsive (footer) — always paired with the "AI • Security • Technology" tagline in the footer.
- Tone: technical-industry, security-first, dark/premium — hero copy repeatedly frames Teracom as the midpoint between "traditional security company" and "AI startup."
- SVG hero illustrations (`hero-technology.svg`, `securityos-dashboard.svg`, `consulting-visual.svg`, `store-preview.svg`) are abstract dashboard/tech visuals, not photography — reinforcing the product (not services-brochure) feel that the new authenticated app should continue.

### A.8 Page patterns

Every marketing page follows the same shape: **hero → repeating `.section` blocks (alternating `.alt` background) → contact/CTA**. Concretely:

| Route | Pattern |
|---|---|
| `/` | Hero → intro statement → 3-item "what we do" list → SecurityOS AI showcase → partner logo wall → consulting showcase (reversed) → store showcase → about → contact form |
| `/securityos-ai` | Hero (product variant, no image split needed but has one) → 6-item `.feature-grid` capability list |
| `/store` | Hero → `.product-grid` mapped from `lib/products.js`, each card wired to `CheckoutButton` |
| `/portal` | Hero (placeholder) → 3-item `.feature-grid` of "reserved for future" cards — **this is the literal stub the new authenticated app replaces with real content, not a redesign target** |
| `/checkout/success`, `/checkout/cancel` | Minimal single-section confirmation pages |

### A.9 Notable existing-but-unused asset

`components/ExpertisePartners.js` is a fully-built, more capable version of the homepage's static `.logo-wall` (real partner logos, links, graceful `onError` fallback to text) but **is not imported anywhere**. It is not part of this architecture's scope to fix, but it is evidence the codebase already has a slightly more advanced component sitting unused — worth reusing (not rebuilding) if/when the homepage logo wall is ever revisited.

### A.10 Full current route inventory

```
/                              marketing homepage
/securityos-ai                 product page
/store                         commerce catalog (Stripe Checkout)
/portal                        placeholder stub (extension point)
/checkout/success              Stripe redirect target
/checkout/cancel               Stripe redirect target
/api/checkout          POST    creates Stripe Checkout Session
/api/leads             POST    logs a lead, redirects home
/api/webhooks/stripe   POST    Stripe webhook → Zoho contact/invoice
/api/admin/import-feed POST    token-gated supplier feed importer
/robots.txt            GET     static robots response
/sitemap.xml           GET     static sitemap response
```

---

## Part B — Backend Review (`teracom-ai-backend`)

### B.1 Stack

FastAPI (`main.py`, ~45 routers registered individually via `include_router`), SQLAlchemy 2.0-style ORM models, PostgreSQL (`DATABASE_URL`), JWT auth (`python-jose`, HS256), password hashing (`passlib`/bcrypt), Chroma (embedded persistent vector store) for RAG, `sentence-transformers` (`all-MiniLM-L6-v2`, CPU) for embeddings, Ollama (local LLM, default model `llama3`) for chat generation. No message queue, no cache layer, no background worker/task runner — everything is synchronous, in-request-thread.

### B.2 Domain model

Five core tables, all UUID-keyed:

- **`organisations`** — `id, name, slug`. No plan/tier/seat/status field of any kind.
- **`users`** — `id, organisation_id, first_name, last_name, email(unique), password_hash, role(free string)`. No `is_active`, no `last_login`, no email verification flag.
- **`workers`** — `id, organisation_id, name, role, purpose, instructions, status`. A "worker" is an AI agent persona (name/role/purpose/instructions = system-prompt components), not a human staff record.
- **`knowledge`** — `id, organisation_id, title, content(text), source`. Content is stored inline in Postgres *and* embedded into Chroma; there is no separate binary/file table (`upload.py` writes the raw file to disk under `uploads/` and extracts text into `knowledge.content` — the original file is not otherwise referenced again).
- **`knowledge_permissions`** — join table, `(worker_id, knowledge_id)` — this is how a knowledge item becomes visible to a given worker's chat context.
- **`chat_sessions`** (`worker_id, user_id, title`) / **`chat_messages`** (`session_id, role, message`) — one worker can have many sessions; each session belongs to exactly one user.
- **`worker_memories`** — `worker_id, memory_type, memory_content` — free-text memory rows attached to a worker (not to a user or session).

Everything is tenant-scoped by `organisation_id`, enforced consistently at the query layer (every list/detail endpoint filters by `current_user["organisation_id"]`, and `auth/organisation.py`'s `get_owned_worker` / `get_owned_knowledge` / `get_owned_session` helpers 403 on cross-tenant access). This isolation model is solid and the frontend can rely on it.

### B.3 Authentication & authorization model

- `POST /auth/login` — takes `email` and `password` as **unbound plain parameters**, which FastAPI resolves as **query parameters**, not a JSON body (there is no `LoginRequest` Pydantic model). Returns `{access_token, token_type: "bearer"}`. Access token is a JWT (`sub`, `email`, `role`, `exp`), default 60-minute expiry, **no refresh token, no rotation, no logout/revocation endpoint**.
- `GET /auth/me` — returns the decoded identity (`id, email, role, organisation_id`) for the bearer token.
- `auth/dependencies.get_current_user` — validates the bearer JWT and re-loads the user row (so a deleted user is rejected even with a still-valid token).
- `auth/roles.require_role(role)` — **exact string equality** against `user.role`; there is no role hierarchy (an `"owner"` would fail a check that requires `"admin"`) and no central enum of valid role values — `role` is whatever string was written at user-creation time.
- Login brute-force protection: in-process sliding-window limiter (`auth/rate_limit.py`), 5 attempts / 15 min window / 15 min lockout, keyed on `(client IP, email)`. Explicitly documented as **process-local** — resets on restart, not shared across multiple workers/instances.
- Recent hardening (per `FINAL_SECURITY_REMEDIATION.md`, 2026-08-14): upload path traversal fixed, filename sanitisation, extension allow-list, streaming size-limit enforcement, secrets externalised to `.env`, malformed-password-hash no longer crashes login. This backend has already been through one security-hardening pass and treats it as a live concern.

### B.4 Full endpoint inventory (grouped by product surface)

| Group | Endpoints |
|---|---|
| **Auth** | `POST /auth/login`, `GET /auth/me` |
| **Organisations / Users** (admin-only writes) | `POST /organisations/`, `GET /organisations/`, `POST /users/`, `GET /users/` |
| **Workers** | `POST /workers/` (admin), `GET /workers/`, `GET /worker-list/`, `GET /worker-summary/{id}`, `GET /worker-activity/{id}`, `GET /workforce/summary` |
| **Worker ↔ Knowledge** | `POST /worker-knowledge/assign`, `DELETE /worker-knowledge/remove`, `GET /worker-knowledge/{worker_id}` |
| **Knowledge / Documents** | `POST /knowledge/` (admin, indexes into Chroma), `GET /knowledge/`, `GET /documents/`, `GET /documents/{id}`, `DELETE /documents/{id}`, `POST /documents/reindex/{id}`, `GET /recent-documents/`, `GET /knowledge-summary/`, `GET /knowledge-growth/`, `GET /knowledge-assignments/summary` |
| **Upload** | `POST /upload/` (multipart, `worker_id` + `file` → extract → `Knowledge` row → assign to worker → embed), `GET /upload-history/`, `GET /upload-metrics/` |
| **Connectors** | `GET /connectors/{sharepoint,onedrive,teams}`, `GET /connector-status/` — **all hardcoded stub responses** (`"status": "available"` / `"connected"`); `services/connectors/*` classes exist but are never wired to any real Microsoft Graph/OAuth call |
| **Chat / Memory** | `POST /chat/` (builds context → Ollama → persists session+messages, single blocking call, no streaming), `POST /chat-sessions/{worker_id}`, `GET /chat-sessions/{session_id}`, `GET /conversation-summary/{session_id}`, `POST /memory/store`, `GET /memory/{worker_id}`, `GET /memory-summary/` |
| **Permissions** | `POST /permissions/` (admin), `GET /permissions/` |
| **Search** | `POST /search/` — Chroma semantic search scoped to the caller's organisation |
| **Dashboards / Aggregates** (5 near-duplicate endpoints) | `GET /dashboard/`, `GET /portal-dashboard/`, `GET /platform/summary`, `GET /system/overview`, `GET /stats/platform` — all return overlapping `{workers, knowledge, memories, chat_sessions, [knowledge_permissions]}` counts for the caller's org |
| **Activity** | `GET /activity/`, `GET /portal/activity` (identical — both call `get_recent_activity`, last 10 knowledge/chats/memories) |
| **Portal-prefixed mirrors** | `GET /portal/dashboard`, `GET /portal/workers`, `GET /portal/knowledge` — thin, portal-scoped duplicates of the equivalent base endpoints |
| **Analytics** | `GET /analytics/chat` (session + message counts) |
| **Health** | `GET /health/` (org-scoped counts + `"status":"healthy"` — not a true liveness probe) |

### B.5 Key architectural gaps (carried into Part C and the readiness assessment)

1. **No CORS middleware anywhere in `main.py`.** A frontend on a different origin will be blocked by the browser until this is added backend-side.
2. **Login credentials travel as query-string parameters**, not a JSON body — they will land in server access logs and any intermediary proxy logs. Needs a `LoginRequest` body model backend-side before going live; the frontend cannot fully mitigate this from its side.
3. **No refresh tokens / no logout endpoint.** Sessions hard-expire at 60 minutes with no silent renewal path.
4. **Single-string role check**, no role taxonomy, no `is_active`/deactivation concept for users.
5. **Five to eight endpoints return near-identical aggregate payloads** (`/dashboard`, `/portal-dashboard`, `/platform/summary`, `/system/overview`, `/stats/platform`, `/portal/dashboard`). The frontend must pick one canonical source per screen rather than mirroring all of them (see §C.6).
6. **Connectors (SharePoint/OneDrive/Teams) are 100% stubbed** — no OAuth, no real sync. The frontend must present these as "coming soon," not wire up a real connect flow yet.
7. **No pagination, filtering, or sorting on any list endpoint** — every list is `SELECT * WHERE organisation_id = ...` with no `LIMIT`/`OFFSET` (except the two hardcoded "recent" endpoints, limited to 10). This will not scale past a small number of records per org.
8. **Chat is fully synchronous, non-streaming** — one HTTP request blocks until Ollama returns the full completion. No SSE/WebSocket. The chat UI must be designed around a single request/response with a loading indicator, not token-by-token streaming, until/unless the backend adds streaming.
9. **No billing, subscription, plan, seat, or entitlement concept exists anywhere in the backend.** Organisations have no plan field; nothing in `teracom-ai-backend` knows about Stripe, seats, or feature limits. This is entirely new ground — see §C.12.
10. **No dependency manifest** (`requirements.txt`/`pyproject.toml`) is committed; the venv is populated ad hoc. Not a frontend concern directly, but relevant to deploy/readiness.

---

## Part C — Extended Frontend Architecture (V1)

### C.1 Guiding principle

The public marketing/commerce site (`/`, `/securityos-ai`, `/store`, `/checkout/*`) is **untouched**. Everything new is additive: a new authenticated app section, reusing the existing design tokens, container/section conventions, button/card/badge classes, and the existing Next.js App Router + Route Handler patterns already proven in this codebase (the site already has four `app/api/*` Route Handlers acting as a BFF layer — that pattern is extended, not introduced).

### C.2 Folder structure (additions only — existing files unchanged)

```
app/
  layout.js                     [unchanged] marketing root shell
  page.js, securityos-ai/, store/, checkout/*   [unchanged]
  portal/
    layout.js                   NEW — authenticated app shell (sidebar + topbar),
                                 replaces the current portal/page.js stub content
    page.js                     UPDATED CONTENT ONLY — portal home/overview
                                 (redirects to /portal/dashboard once real)
    login/page.js                NEW — auth entry point
    dashboard/page.js            NEW
    workers/
      page.js                    NEW — worker list
      [workerId]/page.js         NEW — worker detail (summary, activity, knowledge, memory tabs)
      new/page.js                NEW — create worker (admin only)
    knowledge/
      page.js                    NEW — document/knowledge list
      [documentId]/page.js       NEW — document detail (content, source, assigned workers, reindex)
      upload/page.js             NEW — upload flow
      connectors/page.js         NEW — SharePoint/OneDrive/Teams status ("coming soon" state)
    chat/
      page.js                    NEW — worker picker / session list
      [workerId]/[sessionId]/page.js   NEW — chat interface
    memory/page.js                NEW — cross-worker memory browser
    admin/
      page.js                     NEW — admin landing (role-gated)
      users/page.js                NEW — user management
      organisation/page.js         NEW — organisation profile
      permissions/page.js          NEW — knowledge↔worker permission matrix
    billing/page.js                NEW — plan, seats, invoices, upgrade CTA

  api/
    checkout/, leads/, webhooks/stripe/, admin/import-feed/   [unchanged]
    auth/
      login/route.js              NEW — proxies POST /auth/login, sets httpOnly cookie
      logout/route.js             NEW — clears the cookie (backend has no revoke endpoint yet)
      session/route.js            NEW — returns the decoded session for client components
    portal/
      [...proxy routes as needed — see C.4]

components/
  Header.js, Footer.js, CheckoutButton.js, ExpertisePartners.js   [unchanged]
  portal/
    AppShell.js, Sidebar.js, Topbar.js         NEW — authenticated shell chrome
    DataTable.js, StatTile.js, EmptyState.js   NEW — shared list/metric primitives
    WorkerCard.js, KnowledgeCard.js            NEW — reuse .product-card / .feature-grid
                                                     visual language, not new visual systems
    ChatThread.js, ChatComposer.js             NEW
    RoleGate.js                                NEW — client-side role/plan gating helper

lib/
  products.js, stripe.js, zoho.js, feed-importer.js   [unchanged]
  api/
    client.js         NEW — server-only fetch wrapper (base URL, auth header, error mapping)
    auth.js           NEW — cookie read/write, session decode helpers
    workers.js, knowledge.js, chat.js, memory.js, dashboard.js,
    admin.js, billing.js                        NEW — one thin module per domain,
                                                       each wrapping the specific backend
                                                       endpoints chosen in §C.4–C.12
  config.js            NEW — reads NEXT_PUBLIC_SITE_URL (existing) + new
                              BACKEND_API_URL / BACKEND_API_URL server-only var
```

No existing file's content is rewritten by this plan except `app/portal/page.js` (today's placeholder copy is replaced by a redirect/overview once the real dashboard exists) and `app/layout.js` is **not** touched — the new `app/portal/layout.js` nested layout overrides chrome only for `/portal/**`, exactly as Next.js App Router intends.

### C.3 Route structure

```
Public (existing, unchanged)
  /  /securityos-ai  /store  /checkout/success  /checkout/cancel

Authenticated product area (new, under /portal — the existing reserved IA slot)
  /portal                      overview / redirect to dashboard
  /portal/login                 auth entry (no session) → redirects if already authenticated
  /portal/dashboard              org-wide metrics
  /portal/workers                worker list
  /portal/workers/new            create worker            [role: admin]
  /portal/workers/:workerId      worker detail (tabs: summary / knowledge / memory / activity / chat)
  /portal/knowledge               knowledge list
  /portal/knowledge/upload        upload → ingest flow
  /portal/knowledge/:documentId   document detail
  /portal/knowledge/connectors    connector status ("coming soon")
  /portal/chat                    worker/session picker
  /portal/chat/:workerId/:sessionId   live chat
  /portal/memory                  cross-worker memory browser
  /portal/admin                   admin landing              [role: admin]
  /portal/admin/users              user management            [role: admin]
  /portal/admin/organisation        organisation profile       [role: admin]
  /portal/admin/permissions         knowledge↔worker permission matrix  [role: admin]
  /portal/billing                  plan / seats / invoices / upgrade
```

`/portal/**` is protected by the nested `app/portal/layout.js`, which performs a **server-side session check** (reads the httpOnly cookie set by `/api/auth/login`) before rendering any child route, redirecting to `/portal/login?next=…` if absent/expired. This mirrors the existing convention of doing real work in Route Handlers (as `checkout`/`leads`/`webhooks` already do) rather than introducing a new client-side routing library.

### C.4 API integration layer

**Server-first, not a public SPA client.** Because the backend token is a bare 60-minute JWT with no refresh, the browser never holds the raw token. Pattern:

1. `app/api/auth/login/route.js` (Route Handler, extends the existing `app/api/*` pattern) receives credentials from the `/portal/login` form, calls the backend's `POST /auth/login` **server-side** (so the query-string-credentials issue in §B.5.2 never touches the browser's URL bar or client-visible network tab), and on success sets the returned JWT as an **httpOnly, `Secure`, `SameSite=Lax` cookie**. This is the standard BFF-cookie pattern and is the only reasonable option given the backend has no refresh token to rotate client-side.
2. `lib/api/client.js` is a **server-only** module (Server Components, Route Handlers, Server Actions) that reads the cookie, attaches `Authorization: Bearer <token>`, calls `BACKEND_API_URL`, and normalises errors (401 → redirect to login; 403 → render a permission-denied state; 429 from the login limiter → surface the `Retry-After`). Every domain module in `lib/api/*` (`workers.js`, `knowledge.js`, …) is a thin set of functions built on this one client — one function per backend endpoint actually used, not a generic REST wrapper.
3. Client Components (e.g. the chat composer, upload progress) that must call the backend directly do so through a small set of **same-origin Next.js Route Handlers under `app/api/portal/*`** that proxy to the backend server-side — the browser only ever talks to the Next.js origin, never directly to `BACKEND_API_URL`. This sidesteps the backend's missing-CORS gap (§B.5.1) entirely without needing that backend fix to be a hard blocker for the frontend build, and is consistent with the existing `CheckoutButton` → `/api/checkout` precedent already in the repo.
4. Environment variables (extends the existing `.env.example` convention): `BACKEND_API_URL` (server-only, no `NEXT_PUBLIC_` prefix — must never reach the browser bundle).

### C.5 Authentication flow

```
1. User submits email/password at /portal/login (plain form, styled with existing
   .contact-form input conventions — no new input component needed)
2. Route Handler app/api/auth/login/route.js → POST {BACKEND_API_URL}/auth/login
   (server-side call; credentials never appear in a browser-visible URL)
3. On 200: set httpOnly cookie (teracom_session), decode+cache {id, email, role,
   organisation_id} for the shell to render nav/role gating; redirect to `next` or
   /portal/dashboard
4. On 401: render inline error. On 429: surface lockout message + retry countdown
   (backend already returns Retry-After — surface it, don't re-derive it)
5. app/portal/layout.js (Server Component) checks the cookie on every request under
   /portal/**; expired/missing → redirect to /portal/login
6. No silent refresh exists (backend has none). At ~60 minutes the next server-rendered
   /portal/** request naturally 401s and redirects to login with `next` preserved —
   this is treated as expected behaviour for V1, not a bug to work around client-side.
7. Logout: app/api/auth/logout/route.js clears the cookie. The backend has no token
   revocation endpoint, so the JWT itself remains valid until natural expiry — acceptable
   for V1 given short (60 min) expiry, flagged in the readiness assessment as a
   backend follow-up (§D) rather than something the frontend can fix alone.
```

Role/plan gating in the UI (hide `/portal/admin/**` nav entries for non-admins, disable worker-creation CTA at plan seat limit) is **presentation-layer only** — since `auth/roles.require_role` is the sole backend enforcement and there is no plan/seat enforcement at all yet, the frontend must never treat its own gating as a security boundary; every gated action still relies on the backend's `require_role`/`get_owned_*` checks (which do work correctly) to actually reject unauthorized requests.

### C.6 Dashboard architecture

Given five overlapping aggregate endpoints (§B.5.5), V1 standardises on **one canonical call per screen** rather than calling all of them:

- **`/portal/dashboard` page** → `GET /portal-dashboard/` (the endpoint whose naming and prefix most directly signals "customer-portal-facing summary") for the four headline `StatTile`s (workers / knowledge / memories / chat sessions).
- Recent-activity feed on the same page → `GET /activity/` (equivalent to `/portal/activity`; either is fine since they call the identical service — `/activity/` is chosen for a shorter, already-generic path) for the last-10 knowledge/chat/memory items.
- Chat-specific stat (if surfaced on the dashboard) → `GET /analytics/chat`.
- `/platform/summary`, `/system/overview`, `/stats/platform`, `/dashboard/` (base) are **not called from the frontend at all in V1** — they are redundant with `/portal-dashboard/` for this dataset. If a future internal/ops view is needed, revisit which of these becomes canonical for that surface rather than adding a fourth caller of the same shape.
- Layout: four `StatTile`s in a `.feature-grid`-style responsive row (reusing the existing card visual language, not a new grid system) + a simple activity list below, no charting library introduced in V1 (the data shape today is pure counts, not time series — a charting dependency isn't justified yet).

### C.7 Worker management architecture

- **List** (`/portal/workers`) → `GET /worker-list/` (equivalent to `GET /workers/`; `/worker-list/` is preferred as the more purpose-built name) rendered as a `DataTable`/card list (name, role, status badge using the existing `.badge` class).
- **Create** (`/portal/workers/new`, admin-gated) → `POST /workers/`.
- **Detail** (`/portal/workers/:workerId`) is a tabbed view assembled from four calls, each already scoped/ownership-checked backend-side: `GET /worker-summary/{id}` (knowledge_count, memory_count), `GET /worker-activity/{id}` (chat_sessions, memories, knowledge_assignments), `GET /worker-knowledge/{id}` (assigned documents), `GET /memory/{worker_id}` (memory rows). No separate "workforce" call is needed on this screen — `GET /workforce/summary` is reserved for a possible future org-wide "workforce" rollup view, not the per-worker detail page.
- **Assign/remove knowledge** from the worker detail's Knowledge tab → `POST /worker-knowledge/assign`, `DELETE /worker-knowledge/remove`.
- Because there is **no worker-edit or worker-delete endpoint in the backend today**, V1's worker detail page has no edit/delete affordance — this is a backend gap, not a frontend omission (see §D).

### C.8 Knowledge management architecture

- **List** (`/portal/knowledge`) → `GET /knowledge/` for the full set; `GET /knowledge-summary/` and `GET /knowledge-growth/` feed small stat chips at the top of the same page (both are single-number endpoints — cheap to include, no reason to omit).
- **Upload** (`/portal/knowledge/upload`) → `POST /upload/` (multipart, `worker_id` + `file`). This single call does extract-text → create `Knowledge` row → assign permission → embed, all server-side — the frontend only needs an upload form + progress state (reusing the `CheckoutButton` loading-state pattern from §A.6) and a post-success redirect to the new document's detail page. `GET /upload-history/` and `GET /upload-metrics/` back a secondary "upload activity" panel on this page.
- **Document detail** (`/portal/knowledge/:documentId`) → `GET /documents/{id}` for content/source/metadata, with delete (`DELETE /documents/{id}`) and reindex (`POST /documents/reindex/{id}`) actions.
- **Connectors** (`/portal/knowledge/connectors`) → `GET /connector-status/` to render SharePoint/OneDrive/Teams as **disabled "coming soon" cards**, matching the real backend state (§B.5.6) rather than implying a working OAuth connect flow that doesn't exist. This is a case where the frontend must intentionally under-build relative to what the route names suggest, to avoid promising functionality the backend doesn't have.
- **Semantic search**: a search input against `POST /search/` can be added to the knowledge list page as a filter-style affordance (result cards show title/snippet/distance) — this is the one place a genuinely new interaction pattern (search-as-you-type) is introduced, and it should still be styled with existing input/card conventions, not a new design system.

### C.9 Chat architecture

- **Entry** (`/portal/chat`) lists workers (reusing the worker list component) plus, per worker, existing sessions via `GET /chat-sessions/{session_id}`-adjacent listing — note the backend has **no "list sessions for a worker" endpoint**, only "create a session" and "get one session's messages." V1's chat entry page therefore surfaces "start a new conversation" per worker as the primary path, and a session only becomes visible/resumable once created; a full session-history list per worker is a backend gap to flag (§D), not something the frontend can construct without a new endpoint.
- **Session creation**: `POST /chat-sessions/{worker_id}` (called once, lazily, on first message send — not eagerly on page load, to avoid creating empty sessions).
- **Sending a message**: `POST /chat/` with `{worker_id, message}`. This is a **single blocking request** (§B.5.8) — the composer shows a typing/loading indicator for the duration, not a token stream. `ChatComposer`/`ChatThread` are built around this request/response reality; no SSE/WebSocket client is introduced in V1.
- **History for a resumed session**: `GET /chat-sessions/{session_id}` (returns messages) and, optionally, `GET /conversation-summary/{session_id}` for a condensed summary shown above a long thread.
- The backend's `process_memory_capture` (keyword-triggered auto-memory: phrases like "my preferred", "our vendor", "head office") runs **silently, server-side, on every chat message** — the frontend does not need to (and cannot) control this; it should simply reflect newly-created memories the next time `/portal/memory` or the worker's memory tab is loaded, and optionally show a subtle "remembered" toast if the chat response indicates a memory was captured (would require a minor backend response-shape addition — not present today, so V1 omits this toast rather than inferring it unreliably).

### C.10 Memory architecture

- **`/portal/memory`** is a cross-worker memory browser: fetch `GET /worker-list/` then `GET /memory/{worker_id}` per worker (there is no org-wide "all memories" endpoint — only `GET /memory-summary/` for a single total count and `GET /memory/{worker_id}` for per-worker detail). V1 renders this as a worker-grouped list, not a flat global table, to match what the backend can actually answer efficiently.
- **`GET /memory-summary/`** feeds a single stat chip at the top of this page (and/or the main dashboard).
- **Manual memory entry**: `POST /memory/store` (`{worker_id, memory}`) — exposed as a small "add a memory" form on a worker's memory tab, useful for admins seeding context without relying on the keyword-trigger auto-capture.
- Memory rows currently have a `memory_type` field always set to `"fact"` by the store path (§B.2/`memory_service.py`) — the UI should not build type-based filtering/segmentation in V1, since the data never varies today; render `memory_type` as a plain label, not a faceted filter.

### C.11 Administration architecture

- **`/portal/admin`** is role-gated (`role === "admin"`, mirroring the backend's exact-match check — see the gating caveat in §C.5).
- **Users** (`/portal/admin/users`) → `GET /users/` (list, scoped to caller's org) and `POST /users/` (create; backend hashes the incoming `password_hash` field server-side despite its name — the frontend form field should be labelled/handled as a plain "password" input, the naming in the API is just a backend quirk, not something the UI needs to expose literally).
- **Organisation** (`/portal/admin/organisation`) → `GET /organisations/` (returns the caller's own org, filtered server-side) for a read-only profile view. `POST /organisations/` exists but creates a *new* organisation — V1 does not expose this in the authenticated app at all (self-service org creation is a signup-time/billing-time concern, see §C.12, not a setting inside an existing org's admin area).
- **Permissions** (`/portal/admin/permissions`) → `GET /permissions/` for the current knowledge↔worker matrix, `POST /permissions/` to add a grant. This duplicates the same relationship the worker detail page's Knowledge tab manages (§C.7) — V1 keeps both entry points (per-worker assignment is the common case; the admin matrix is for bulk/audit view) since both map to the same two backend endpoints with no extra cost.
- There is **no user-role-change, user-deactivation, or user-delete endpoint** in the backend — the admin users screen is create + list only in V1; anything more is a backend gap (§D).

### C.12 Billing and licensing architecture

This is the one area with **no existing backend support at all** (§B.5.9) — the commerce site's Stripe integration and the AI backend's organisation/user model are currently two completely disconnected systems. V1's job is to define the bridge, not just wrap existing endpoints.

**Current state (as-is):**
- `/store` lets *anyone*, unauthenticated, buy any product (including the `securityos-starter`/`securityos-pro` subscription SKUs) via `POST /api/checkout` → Stripe Checkout, with no organisation/user context attached at all.
- `app/api/webhooks/stripe/route.js` on `checkout.session.completed` only creates a Zoho contact + invoice — it never calls the AI backend.
- `/portal` (today's stub) literally says "Future Stripe customer portal integration."
- The AI backend's `organisations` table has no plan/seat/status field, and nothing in it has ever heard of Stripe.

**V1 target architecture:**

1. **Checkout must capture organisation identity.** For the two SecurityOS AI subscription SKUs specifically, `/store`'s checkout flow gains a lightweight pre-checkout step: if the buyer already has a Teracom AI session (cookie present), pass `organisation_id` through as Stripe Checkout `metadata`; if not, collect company name + email in the existing `.contact-form` style before redirecting to Stripe, so the webhook has something to provision against. Hardware/service SKUs are unaffected and keep the current anonymous flow.
2. **Webhook becomes the provisioning point.** `app/api/webhooks/stripe/route.js` gains a branch (alongside its existing Zoho call, not replacing it): on `checkout.session.completed` for a SecurityOS AI SKU, it calls a **new backend endpoint** — `POST /organisations/{id}/billing` (does not exist yet; a backend addition, not a frontend one) — to record `{stripe_customer_id, stripe_subscription_id, plan: "starter"|"professional", status: "active", seats}` against the organisation. If no `organisation_id` was captured at checkout (new customer), this same call first creates the organisation (`POST /organisations/`) and a first admin user, then emails login credentials — this "new customer, no account yet" path is the highest-complexity part of this whole architecture and should be the first thing prototyped, not assumed to fall out of the simpler pieces.
3. **Backend model addition required** (documented here as a dependency, not built by this frontend plan): `organisations` needs `plan`, `status`, `seat_limit`, `stripe_customer_id` columns (or a separate `billing` table keyed on `organisation_id`) before step 2 has anywhere to write to. **This is a backend schema change and is out of this document's authority to implement — flagged as the single hardest blocking dependency in §D/§E.**
4. **`/portal/billing` page** reads that new organisation-billing record (via a new `GET /organisations/{id}/billing`-equivalent, also backend work) to show current plan, seat usage (`worker count` vs `seat_limit` — reusing the existing `GET /worker-list/` count), and a link to the Stripe-hosted Customer Portal (Stripe supports generating a portal session server-side from a `stripe_customer_id` — this part is pure frontend/Stripe-SDK work once the customer ID is stored) for invoice history and plan changes. Zoho remains the invoicing system of record; this page does not attempt to duplicate Zoho invoice data.
5. **Feature gating is advisory only in V1.** Since the backend enforces no seat/plan limits today, the worker-creation screen can *warn* ("you're at 5/5 workers on the Starter plan") using the same `seat_limit` field, but the create action itself is not blocked client-side as a security measure — only the backend can make a limit real, and it doesn't yet (consistent with the gating caveat in §C.5).

**What this section deliberately does not do:** it does not invent a parallel billing database inside the frontend, and it does not attempt to make Stripe the source of truth for entitlements checked on every API call (that would require a Stripe API round-trip per request) — the intended model is Stripe as the *payment* system of record, a small denormalised billing record on the backend's `organisations` table as the *entitlement* source of truth the rest of the AI backend can check cheaply, and the webhook as the one sync point between them.

---

## Part D — Readiness Assessment

### Frontend readiness: **Ready to extend, with setup work**

- Strong, consistent, low-complexity foundation (single global stylesheet, no framework debt, no legacy state management to unwind).
- Zero existing auth, data-fetching, or client-state infrastructure — all of §C.4/C.5 is genuinely new construction, not a retrofit, but it has a clean, empty slot to go into (`/portal` is already reserved for exactly this).
- No design-system gap to close — the palette, type scale, spacing, and component set in §A are sufficient to build every new screen in §C without inventing new visual language.
- No TypeScript, no test runner, no lint config currently present — worth deciding (outside this document's scope) before the authenticated app grows past a handful of screens, since correctness risk rises faster in an app with forms, auth, and role gating than it did in a static marketing site.

### Backend readiness: **Functionally usable for a first integration; not production-safe as-is**

Solid: multi-tenant data isolation (org-scoped queries + ownership-check helpers) is implemented correctly and consistently everywhere it matters. RAG pipeline (Chroma + sentence-transformers + Ollama) is real and working, not a stub. Recent, genuine security hardening has already been done and documented (upload path traversal, brute-force login, secrets externalisation).

Blocking or near-blocking for a real frontend integration:
1. **No CORS middleware** — must be added before the browser can call the backend directly from any origin other than same-origin-via-proxy (§C.4 works around this for V1, but it should still be fixed backend-side).
2. **Login credentials as query parameters** — must become a JSON body before this goes anywhere near production traffic or shared logging infrastructure.
3. **No refresh token / no logout / no role hierarchy / no user deactivation** — acceptable to build V1 around (§C.5 designs for this reality) but should be a near-term backend roadmap item, not a permanent state.
4. **Zero billing/licensing data model** — this is the single largest genuine gap; §C.12 depends entirely on backend schema/endpoint additions that don't exist yet.
5. **Connectors are placeholder stubs** — fine to represent as "coming soon" in V1, not fine to leave mis-labelled as "available"/"connected" once real users can see it.
6. **No pagination anywhere** — not urgent at current data volumes, but will need addressing before any organisation accumulates more than a few dozen knowledge/chat records.
7. **Chat has no streaming** — acceptable for V1 UX (loading spinner), worth a backend roadmap item once user volume makes multi-second blocking waits noticeable.

### Combined verdict

There is enough here to build and ship **Dashboard → Workers → Knowledge → Chat → Memory → Admin** end-to-end against the backend as it exists today, using the BFF-proxy pattern in §C.4 to route around the missing CORS config. **Billing & Licensing (§C.12) cannot be completed frontend-only** — it requires backend schema and endpoint work first. Everything else in Part C can proceed in parallel with that backend work.

---

## Part E — Recommended Implementation Order

1. **Auth foundation** (§C.4/C.5): login Route Handler, httpOnly cookie session, `app/portal/layout.js` guard, `lib/api/client.js`. Nothing else can be meaningfully built or demoed without this.
2. **Dashboard** (§C.6): lowest endpoint complexity (one canonical aggregate call + one activity call), highest value as a "does the whole pipe work" smoke test for #1.
3. **Worker management** (§C.7): list/detail/create — establishes the `DataTable`/card/detail-tabs patterns every later screen (knowledge, admin) reuses.
4. **Knowledge management** (§C.8), excluding connectors: list, upload, detail — the upload flow is the first multi-step interaction (file → ingest → redirect) and worth validating early since chat quality depends on it.
5. **Chat** (§C.9): depends on workers (for the picker) and benefits from knowledge already existing (for a non-empty context) — sequenced after both.
6. **Memory** (§C.10): thin and low-risk; naturally follows chat since that's where memories are actually created.
7. **Administration** (§C.11): users/organisation/permissions — deliberately placed after the core product loop, since it's operationally important but not what a new org's first-run experience needs.
8. **Knowledge connectors "coming soon" state** (§C.8): cosmetic, can slot in anywhere after #4 once real copy/design for the disabled state is ready.
9. **Billing & Licensing** (§C.12): start the **backend schema/endpoint conversation in parallel with step 1**, not after step 7 — it is the longest-lead-time item in this entire plan (requires new columns/tables, a new webhook branch, and the "new customer with no account yet" provisioning path) and should not be a step-9 surprise. The frontend-only pieces of it (billing page UI, Stripe Customer Portal link) can be built once the backend billing record exists, but the design/schema decision should happen now.

Everything is additive to `/portal/**`; none of it requires touching `/`, `/securityos-ai`, `/store`, or `/checkout/**`.
