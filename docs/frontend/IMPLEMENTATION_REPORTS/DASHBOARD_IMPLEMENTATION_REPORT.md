# Dashboard Implementation Report — Frontend Package 2

**Scope:** Package 2 — Dashboard only, per `FRONTEND_ARCHITECTURE_V1.md` §C.6.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance as both an admin and a non-admin user.
**Depends on:** Package 1 (Authentication) — the session cookie, `getSessionToken()`, `AuthProvider`, and the `(protected)` route group are reused as-is, unchanged.
**Out of scope (unchanged, not implemented):** Workers, Knowledge, Chat, Memory, Admin, Billing.

---

## 1. What was built

`/portal/dashboard` — an organisation-overview screen reachable from the existing `/portal` landing page and a new lightweight in-app nav — that displays:

1. **Worker count, knowledge count, memory count, chat session count** — four stat tiles sourced from one canonical backend call.
2. **Organisation summary** — organisation name and slug, with a graceful degraded state for non-admin users (the backend endpoint is admin-only).
3. **Platform statistics** — chat session and message totals.
4. **Recent activity** — three columns (Knowledge, Chat sessions, Memories) from the same activity feed the backend's own `/portal/activity` route serves.

Every section has its own loading state (via Next.js's `loading.js` convention), independent error handling (one endpoint failing doesn't take down the others), and its own empty state distinct from an error state.

---

## 2. Canonical backend source (requirement #3)

Per `FRONTEND_ARCHITECTURE_V1.md` §B.5.5, `teracom-ai-backend` exposes five-plus endpoints that return the same shape of organisation counts: `/dashboard/`, `/portal-dashboard/`, `/platform/summary`, `/system/overview`, `/stats/platform`. §C.6 designates **`GET /portal-dashboard/`** as the one to call from this screen, and explicitly says the other four "are not called from the frontend at all in V1." This implementation follows that exactly — `lib/api/dashboard.js` calls only:

| Backend endpoint | Used for | Why this one, not an alternative |
|---|---|---|
| `GET /portal-dashboard/` | Workers / Knowledge / Memories / Chat Sessions stat tiles | The architecture doc's designated canonical source for this screen — not `/dashboard/`, `/platform/summary`, `/system/overview`, or `/stats/platform`, which return the identical shape and are explicitly called redundant. |
| `GET /activity/` | Recent activity feed | §C.6 names this (or its identical twin `/portal/activity/`) as canonical; `/activity/` was picked as the shorter path, exactly as the architecture doc suggested. |
| `GET /analytics/chat` | "Platform statistics" (chat sessions/messages) | §C.6 explicitly names this as the one additional endpoint worth calling ("Chat-specific stat … → `GET /analytics/chat`") when a chat stat is surfaced on the dashboard. This is how the "platform statistics" requirement is satisfied **without** reintroducing the `/platform/summary`/`/stats/platform` duplication the architecture doc says to avoid. |
| `GET /organisations/` | Organisation summary | Not discussed in §C.6 (that section only covers workers/knowledge/memory/chat counts) but is the only backend endpoint that returns organisation name/slug, and requirement #4 explicitly asks for an organisation summary on this screen. Handled specially — see §3. |

No call is made to `/dashboard/`, `/platform/summary`, `/system/overview`, or `/stats/platform`. This was a deliberate exercise of requirement #3, not an oversight.

---

## 3. Handling `/organisations/` being admin-only

`api/organisations.py`'s `GET /organisations/` is gated with `require_role("admin")` backend-side — a non-admin signed-in user gets a `403`. Rather than let that fail the whole page or show a scary error banner for a large fraction of users, `lib/api/dashboard.js#fetchOrganisationSummary` lets the `403` propagate as an `ApiError`, and the page (`app/portal/(protected)/dashboard/page.js`) checks `isForbidden(error)` (from the new `lib/api/results.js`) to render a plain, informational `EmptyState` — *"Organisation details are restricted — only organisation admins can view organisation summary details"* — instead of an error. Verified live with both an admin and a `member`-role account (§6): the admin sees the organisation card; the member sees the restricted note, while every other section on the same page still renders normally.

---

## 4. Per-section resilience: `Promise.allSettled`, not one big `try/catch`

The four backend calls are independent and unrelated (different endpoints, different failure modes — one is role-gated, the others aren't). `DashboardPage` fires all four concurrently with `Promise.allSettled` and resolves each into a `{ value, error }` pair via the new `lib/api/results.js#settle()`. This means, for example, a transient failure on `/analytics/chat` shows one inline error banner in the "Platform statistics" column while Workers/Knowledge/Memories/Chat Sessions, Organisation, and Recent Activity all still render normally from the same page load — rather than one failing call taking the whole page down.

---

## 5. Loading, error, and empty states (requirements #5–#7)

| State | Mechanism |
|---|---|
| **Loading** | `app/portal/(protected)/dashboard/loading.js` — Next.js automatically wraps the async `DashboardPage` Server Component in a Suspense boundary and shows this (a hero skeleton + 4 shimmering stat-tile placeholders using the new `.skeleton` CSS animation) while the four backend calls resolve. |
| **Error (per-section)** | Each of the four sections independently renders a `.form-error` banner (reusing the exact class introduced in Package 1's login form) with a message from `lib/api/results.js#errorMessage()` — distinguishes "can't reach the backend" (`ApiError.status === 0`) from a genuine backend error response. |
| **Error (safety net)** | `app/portal/(protected)/dashboard/error.js` — a Next.js `error.js` boundary for any genuinely unexpected exception during render (not the expected failure modes above, which are already caught inline). Includes a "Retry" button (`reset()`). |
| **Empty (per-list)** | `components/portal/EmptyState.js`, used inside `ActivitySection` for each of the three activity columns when that array is empty (e.g. "No conversations have been started yet.") and inside `OrganisationSummaryCard` for the restricted/unavailable cases. Distinct from an error: the request succeeded, there is just nothing to show. |

---

## 6. Files changed

### New files

```
lib/api/dashboard.js                             fetchPortalDashboard / fetchRecentActivity /
                                                  fetchChatAnalytics / fetchOrganisationSummary
lib/api/results.js                               settle() / errorMessage() / isForbidden() — pure,
                                                  unit-tested helpers shared by the dashboard page
lib/api/__tests__/dashboard.test.js               unit tests (mocks global.fetch)
lib/api/__tests__/results.test.js                 unit tests

components/portal/StatTile.js                     label/value/hint metric card
components/portal/EmptyState.js                   shared "nothing here yet" primitive
components/portal/ActivitySection.js              one activity category (title + list + empty state)
components/portal/OrganisationSummaryCard.js      org name/slug, or restricted/unavailable state
components/portal/PortalNav.js                    minimal in-portal nav (Overview / Dashboard)

app/portal/(protected)/dashboard/page.js          the dashboard screen (Server Component)
app/portal/(protected)/dashboard/loading.js        Suspense fallback (skeleton stat tiles)
app/portal/(protected)/dashboard/error.js          error boundary safety net

DASHBOARD_IMPLEMENTATION_REPORT.md                this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `app/portal/(protected)/layout.js` | Renders `<PortalNav />` above `{children}` | Requirement #8 — integrates Dashboard into `/portal` navigation for every page under the protected route group, not just this one. |
| `app/portal/(protected)/page.js` | The "Dashboard" placeholder card now links to `/portal/dashboard` via a `.btn.btn-secondary` (existing button class) | Requirement #8 — makes the previously inert placeholder card a real entry point. The other five placeholder cards (Workers/Knowledge/Chat/Memory/Admin) are untouched, since those packages don't exist yet. |
| `app/globals.css` | +36 lines, additive only | New `.portal-nav*`, `.stat-grid`/`.stat-tile`/`.stat-value`, `.dashboard-columns`, `.activity-columns`/`.activity-list`, `.empty-state*`, `.org-summary-card*`, and `.skeleton` classes — all built from the existing token set (`--line`, `--red`/`--red2`, existing radii/spacing scale, existing breakpoints). No existing rule was changed; nothing in the marketing site's styling was touched. |

No file from Package 1 was changed in behaviour — `lib/api/auth.js`, `lib/api/client.js`, `middleware.js`, the login/logout routes, and `AuthProvider` are all reused exactly as they were.

---

## 7. Validation

Run from a clean state (`rm -rf .next`, existing `node_modules`):

```
$ npm run build   → ✓ Compiled successfully, 20 routes (including new /portal/dashboard), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 31, pass 31, fail 0
```

### Unit tests (31 total; 12 new for this package)

New this package: `lib/api/dashboard.js` (4 fetch functions — correct path/method/token, and `fetchOrganisationSummary`'s array-unwrapping/empty/non-array/403-propagation behaviour) and `lib/api/results.js` (`settle`, `errorMessage`, `isForbidden`), all tested by mocking `global.fetch`, same technique as Package 1's `client.test.js`. The 19 tests from Package 1 (`client`, `jwt`, `validation`) are untouched and still pass.

### End-to-end smoke test (manual, against a live backend)

`teracom-ai-backend` was started locally (real Postgres, real JWT signing) and the built Next.js app run against it. Two temporary users were created directly in the database for this test — one `admin`, one `member` — and both deleted again immediately afterward; no test data was left behind.

| Check | Result |
|---|---|
| `GET /portal/dashboard` with no session | `307` → `/portal/login?next=%2Fportal%2Fdashboard` (middleware preserves the deep link) |
| Admin login → `GET /portal/dashboard` | `200`; stat tiles show real counts (Workers 1, Knowledge 4, Memories 2, Chat Sessions 0); Organisation card shows the real org name/slug; Platform statistics shows 0/0 (consistent with the 0 chat-session count from the other endpoint — a useful cross-check that both independent endpoints agree); Knowledge and Memories activity columns show real rows (`sample.txt`, `Architecture.txt`, `Preferred cloud vendor is Microsoft.`); Chat sessions column correctly shows the empty state, since the count for that org is 0 |
| Non-admin (`member`) login → `GET /portal/dashboard` | `200`; Organisation section shows *"Organisation details are restricted"* instead of an error; every other section (stat tiles, platform statistics, activity) renders identically to the admin view from the same underlying data |
| Rendered HTML | Confirmed `site-header`/`site-footer` still present (existing marketing chrome untouched), `portal-nav-link active` correctly applied to the Dashboard link when on `/portal/dashboard` |
| Compiled route bundle | Confirmed both `loading.js`'s and `error.js`'s text are present in the compiled `page.js` output, confirming Next.js picked up both file-convention boundaries for this route segment |

---

## 8. Remaining risks / follow-ups

1. **"Recent activity" isn't actually ordered by recency.** `teracom-ai-backend`'s `Knowledge`, `ChatSession`, and `WorkerMemory` models have **no timestamp column at all** (no `created_at`/`updated_at`), and `services/recent_activity_service.py` orders by `.order_by(X.id.desc())` — every ID is a random `uuid.uuid4()`, not a time-ordered UUID, so that ordering is not actually chronological. The dashboard displays whatever the backend returns and labels the section "Recent activity" (matching the architecture doc's and the old portal stub's existing language), but this is a backend data-model gap, not something the frontend can fix by calling the endpoint differently — it would need a real `created_at` column and an `ORDER BY created_at DESC` change server-side.
2. **`/organisations/` returning an array (not a single object) is a slightly awkward fit for a "current org" summary.** The endpoint is designed for admins to manage organisations generically and happens to be filtered to just the caller's own org server-side; `fetchOrganisationSummary` takes `[0]` defensively. This works today because the filter always returns 0 or 1 row, but there's no backend contract guaranteeing that shape stays a single-item array forever — worth a dedicated `GET /organisations/me` (or similar) if this becomes a heavier-used screen.
3. **The four dashboard backend calls are not cached or revalidated** — every page load re-fetches all four endpoints with `cache: 'no-store'` (inherited from `lib/api/client.js`, unchanged from Package 1). Fine at current scale; worth reconsidering (e.g. a short revalidation window) if the dashboard becomes a frequently-refreshed landing page under real load.
4. **No auto-refresh / polling.** The dashboard reflects the data at the moment of page load only; a user has to reload to see new activity. Not requested for this package and no realtime transport (WebSocket/SSE) exists on the backend today to build it against anyway.
5. **All risks carried over from Package 1 remain unchanged** (no CORS middleware on the backend, no refresh token, single-process login rate limiter, etc.) — see `AUTHENTICATION_IMPLEMENTATION_REPORT.md` §6. None of them are specific to or worsened by this package.
6. **`PortalNav` is intentionally minimal** (two links: Overview, Dashboard) rather than the fuller sidebar/topbar app shell `FRONTEND_ARCHITECTURE_V1.md` §C.2 describes for once Workers/Knowledge/Chat/Admin exist. Building that fuller shell now would mean adding nav entries for routes that don't exist yet — deliberately deferred to whichever package makes each of those routes real, per this task's explicit scope boundary.

None of the above block Package 3 (Workers) from starting — `lib/api/results.js`'s `settle`/`errorMessage`/`isForbidden` helpers, the `StatTile`/`EmptyState` primitives, and the `PortalNav` extension point are all designed to be reused as-is by the next package.
