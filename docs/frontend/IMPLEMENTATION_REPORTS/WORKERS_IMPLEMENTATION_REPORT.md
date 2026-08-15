# Workers Implementation Report — Frontend Package 3

**Scope:** Package 3 — Workers only, per `FRONTEND_ARCHITECTURE_V1.md` §C.7.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance as both an admin and a non-admin (`member`) user.
**Depends on:** Package 1 (Authentication) and Package 2 (Dashboard) — the session cookie, `getSessionToken()`, `AuthProvider`, `PortalNav`, `StatTile`, `EmptyState`, and the `settle`/`errorMessage`/`isForbidden` helpers from `lib/api/results.js` are all reused as-is, unchanged.
**Out of scope (unchanged, not implemented):** Knowledge (list/upload/detail/connectors), Chat, Memory (standalone cross-worker browser), Administration, Billing & Licensing.

---

## 1. Starting point

A filesystem check at the start of this task (matching `docs/governance/CURRENT_SPRINT.md`'s tracking) found the data-access and component layer for Workers already built in a prior pass, but entirely unrouted:

- `lib/api/workers.js` — 9 functions, 9 passing unit tests.
- `components/portal/{WorkerCard,WorkerListView,CreateWorkerForm,WorkerKnowledgeAssignment,EditWorkerForm}.js` — all present.
- `lib/api/validation.js#parseWorkerPayload` — already implemented and tested.

No `app/portal/(protected)/workers/` route directory existed, `PortalNav` had no Workers entry, and no BFF proxy routes existed for the client components (`CreateWorkerForm` and `WorkerKnowledgeAssignment`) to call — both already assumed `/api/portal/workers` and `/api/portal/workers/:workerId/knowledge` endpoints that had not been built yet. This package's job was to finish wiring all of that into something reachable, plus the two proxy routes, plus validation.

---

## 2. What was built

### Routes

| Route | Purpose |
|---|---|
| `/portal/workers` | Worker list — search/filter, empty state, create CTA (admin only) |
| `/portal/workers/new` | Create worker form (admin only; restricted notice for non-admins) |
| `/portal/workers/:workerId` | Worker detail — stats, purpose/instructions, edit (admin only), knowledge assignment, memory |
| `POST /api/portal/workers` | Same-origin BFF proxy → `POST /workers/` |
| `POST/DELETE /api/portal/workers/:workerId/knowledge` | Same-origin BFF proxy → `POST /worker-knowledge/assign` / `DELETE /worker-knowledge/remove` |

Every route lives under the existing `app/portal/(protected)/` group, so `middleware.js`'s cookie-presence check and `app/portal/(protected)/layout.js`'s `GET /auth/me` re-validation already guard all three pages with no changes needed to either file.

### Backend calls, matching §C.7 exactly

`GET /worker-list/` (list) · `POST /workers/` (create) · `GET /worker-summary/{id}` + `GET /worker-activity/{id}` + `GET /worker-knowledge/{id}` + `GET /memory/{worker_id}` (detail, four independent calls) · `GET /knowledge/` (assignment picker source) · `POST /worker-knowledge/assign` / `DELETE /worker-knowledge/remove` (assign/remove). No call is made to `GET /workforce/summary` — §C.7 explicitly reserves that for a possible future org-wide rollup view, not this page.

### Detail page: stacked sections, not literal tabs

§C.7 describes the detail view as "a tabbed view assembled from four calls." This implementation assembles the same four calls but renders them as stacked `.section` blocks (Stats → Purpose/Instructions → Edit → Knowledge → Memory) on one page, the same layout convention `app/portal/(protected)/dashboard/page.js` already established, rather than introducing a client-side tab component. No new interaction pattern, no new CSS, no client JS needed beyond what the individual client components (`EditWorkerForm`, `WorkerKnowledgeAssignment`) already require — a deliberate simplification consistent with this task's "don't add abstractions beyond what's needed" constraint, since a stacked single-page view satisfies the same functional requirement (summary/knowledge/memory/activity all visible) without inventing tab-state management this app has no precedent for.

### Admin gating without an extra network call

Three places need to know if the signed-in user is an org admin (list page's Create CTA, the `/new` page, the detail page's Edit section). Rather than call `GET /auth/me` a second time per page, these read `role` directly off the already-decoded session JWT via the existing `decodeJwtPayload()` helper from `lib/api/jwt.js` (built in Package 1, previously only used for cookie expiry). This is presentation-layer only, per §C.5 — every gated write still goes through the backend's own `require_role("admin")` check regardless of what the UI shows, verified directly in §6.

---

## 3. Knowledge assignment integration (requirement #7)

`WorkerKnowledgeAssignment` (pre-existing) takes `assigned` (from `GET /worker-knowledge/{id}`) and `available` (the full org catalogue from `GET /knowledge/`, minus whatever's already assigned, computed by the detail page). Mutations go through the two new BFF proxy routes, then `router.refresh()` re-runs the page's server-side fetches so the list reflects real state — no optimistic local state to keep in sync.

**Bug found and fixed during smoke testing:** the component's original empty-state copy — "All of your organisation's knowledge is already assigned to this worker" — was shown whenever `available.length === 0`, which is also true when the *entire organisation* has zero knowledge documents (a very likely state before Package 4/Knowledge exists, or for a new org). That message is actively wrong in that case. Fixed to branch on `assigned.length` too:

```
available.length > 0        → show the assign form
available.length === 0
  && assigned.length > 0    → "All of your organisation's knowledge is already assigned..."
  && assigned.length === 0  → "No knowledge documents exist yet in your organisation — upload one to assign it here."
```

Verified live (§6): with zero knowledge in the org, the new message renders; after seeding one document, the assign form appears with it selectable, and after assigning it, the "already assigned" message correctly takes over.

---

## 4. Search and filtering (requirement #8)

`WorkerListView` (pre-existing) filters the already-fetched worker array client-side by name/role substring match and status. No changes were needed here — per `FRONTEND_ARCHITECTURE_V1.md` §B.5.7, `GET /worker-list/` accepts no query parameters at all (no backend-side filtering/sorting/pagination exists), so client-side filtering of the full array is the only option today, and is fine at current per-organisation data volumes. Verified the toolbar renders with the new `.workers-toolbar` styling (previously unstyled — see §5).

---

## 5. Loading, empty, and error states (requirements #9–#11)

| State | Mechanism |
|---|---|
| **Loading** | `loading.js` for both `/portal/workers` (skeleton card grid) and `/portal/workers/:workerId` (skeleton stat grid), following the exact convention `dashboard/loading.js` established — Next.js wraps the async page in Suspense automatically. |
| **Error (per-section)** | Detail page fires its four calls with `Promise.allSettled` + the existing `settle()`/`errorMessage()` helpers, same as the dashboard — one endpoint failing renders a `.form-error` banner in that section only, the rest of the page still renders. The one exception is `GET /worker-summary/{id}` itself failing (see below). |
| **Error (whole-page, not-found)** | If `worker-summary` 404s or 403s (the backend's `get_owned_worker` ownership check — a worker that doesn't exist or belongs to another org return the same way), the detail page shows one "Worker not found" message rather than degrading a single section, since every other call on that page is scoped to the same worker ID. Both statuses are collapsed into the same message so a cross-tenant ID can't be distinguished from a nonexistent one. |
| **Error (safety net)** | `error.js` for both routes, same `reset()`-button pattern as `dashboard/error.js`. |
| **Empty (no workers)** | `EmptyState` inside `WorkerListView`, with copy that differs by role ("Create your first AI worker" vs. "An organisation admin needs to create your first AI worker"). |
| **Empty (search yields nothing)** | A second, distinct `EmptyState` in `WorkerListView` for "no workers match your search" vs. "no workers exist" — these are different situations and were already distinguished in the pre-existing component. |
| **Empty (no knowledge assigned)** | `EmptyState` inside `WorkerKnowledgeAssignment`. |
| **Empty (no knowledge exists org-wide)** | New — see §3. |
| **Empty (no memories)** | `EmptyState` on the detail page's Memory section. |
| **Restricted (non-admin on `/new`)** | Rendered as an informational notice (not an error), same pattern as `OrganisationSummaryCard`'s restricted state from Package 2. |

---

## 6. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, 23 routes (including /portal/workers,
                     /portal/workers/new, /portal/workers/[workerId], and the two
                     new /api/portal/workers* proxy routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 45, pass 45, fail 0
```

### Unit tests (45 total; 9 pre-existing for `lib/api/workers.js`, all passing unchanged — no new units were added by this package, which only added route/page/proxy wiring and one component-level bugfix that isn't independently unit-testable without a page-level harness)

### End-to-end smoke test (real backend, not mocked)

`teracom-ai-backend` was started locally against the existing Postgres instance (`teracom_ai` database, real JWT signing, real `sentence-transformers` embedding load) — this is the same real backend the Auth and Dashboard packages were validated against, not a stub. A temporary organisation and two temporary users (one `admin`, one `member`) were created directly in the database for this test and fully deleted again afterward, along with the temporary worker and knowledge row created during the test — no test data was left behind.

| Check | Result |
|---|---|
| `GET /portal/workers`, `/new`, `/:id` with no session | `307` → `/portal/login?next=...` (middleware preserves the deep link for all three, including the two-level-deep detail route) |
| Admin login → `GET /portal/workers` | `200`; empty state ("No workers yet") with a working "Create Worker" link |
| Admin → `GET /portal/workers/new` | `200`; form renders |
| Admin → `POST /api/portal/workers` (via curl, same payload shape `CreateWorkerForm` sends) | `200`; `{"worker": {...}}` returned, worker persisted in Postgres |
| Admin → `GET /portal/workers` again | `200`; newly created worker now appears in the list |
| Admin → `GET /portal/workers/:id` | `200`; name/role/status, purpose, instructions, stat tiles (knowledge/memory/chat-session/knowledge-assignment counts), Edit form, and Knowledge/Memory sections all render from real backend data |
| Knowledge assignment round-trip | Seeded one `knowledge` row directly in Postgres (Knowledge module itself is out of scope, so this only exercises the Worker-side of the relationship) → detail page correctly showed "No knowledge documents exist yet" before seeding, then the assign form with it selectable after seeding → `POST /api/portal/workers/:id/knowledge?knowledgeId=...` → `200`, item now shows under "Assigned knowledge" with its source → `DELETE .../knowledge?knowledgeId=...` → `200`, item removed, "No knowledge assigned" empty state returns |
| Member (non-admin) login → `GET /portal/workers` | `200`; existing worker still visible, but no "Create Worker" link |
| Member → `GET /portal/workers/new` | `200`; renders "Creating a worker requires admin access" instead of the form |
| Member → `GET /portal/workers/:id` | `200`; worker detail visible, but no "Update worker details" (Edit) section |
| Member → `POST /api/portal/workers` directly (bypassing the UI gate entirely) | `403 {"error": "Insufficient permissions"}` — confirms the backend's own `require_role("admin")` is the actual enforcement, not the frontend gate, exactly as §C.5 requires |
| `GET /portal/workers/:bogus-uuid` | `200`; "Worker not found" message, not a crash or a raw 404 |
| Backend unreachable (before backend was started) | `app/portal/(protected)/layout.js`'s existing "Portal unavailable" fallback correctly covers the new Workers routes too — no change was needed there |

---

## 7. Files changed

### New files

```
app/api/portal/workers/route.js                          POST → createWorker() BFF proxy
app/api/portal/workers/[workerId]/knowledge/route.js      POST/DELETE → assign/removeWorkerKnowledge() BFF proxy

app/portal/(protected)/workers/page.js                     worker list (Server Component)
app/portal/(protected)/workers/loading.js                  Suspense fallback (skeleton card grid)
app/portal/(protected)/workers/error.js                    error boundary safety net
app/portal/(protected)/workers/new/page.js                 create worker page (admin-gated)
app/portal/(protected)/workers/[workerId]/page.js           worker detail (Server Component)
app/portal/(protected)/workers/[workerId]/loading.js        Suspense fallback (skeleton stat grid)
app/portal/(protected)/workers/[workerId]/error.js          error boundary safety net

docs/frontend/IMPLEMENTATION_REPORTS/WORKERS_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `components/portal/PortalNav.js` | Added a "Workers" link; active-link matching now also matches nested paths (`/portal/workers/*`), not just exact matches | Requirement #2 — Workers is the first section with sub-routes, so the exact-match-only logic from Package 2 would never highlight it on `/new` or `/:workerId` |
| `components/portal/WorkerKnowledgeAssignment.js` | Split the "nothing to assign" empty state into two distinct messages (see §3) | Requirement #10 — the single pre-existing message was factually wrong for an org with zero knowledge documents, found during smoke testing |
| `app/portal/(protected)/page.js` | Workers placeholder card now links to `/portal/workers`; hero copy updated to say Workers is ready, not "being rolled out" | Requirement #2 — makes the previously inert card a real entry point, same treatment Package 2 gave the Dashboard card |
| `app/globals.css` | +12 lines, additive only | New `.workers-toolbar`, `.btn-small`, `.form-note-banner`, `.assignment-row`, `.assign-form`, `.worker-detail-columns` classes, all built from the existing token set — the pre-existing components referenced several of these class names with no matching CSS at all. No existing rule was changed. |

No file from Package 1 or 2 was changed in behaviour — `lib/api/auth.js`, `lib/api/client.js`, `middleware.js`, `app/portal/(protected)/layout.js`, `AuthProvider`, `StatTile`, `EmptyState`, and `lib/api/results.js` are all reused exactly as they were. `lib/api/workers.js`, `lib/api/validation.js#parseWorkerPayload`, and the five worker components were reused as-is with the one bugfix noted above.

---

## 8. Remaining risks / follow-ups

1. **No worker-update or worker-delete endpoint exists backend-side.** `EditWorkerForm` remains deliberately non-persisting (fully editable, honest "saving isn't available yet" notice on submit) — this was already true before this package and is a backend gap, not something wired incorrectly here.
2. **No "list sessions for a worker" or org-wide memory endpoint exists**, so the detail page shows memory/activity as counts and a flat per-worker memory list only — consistent with what §C.7/§C.9/§C.10 already say the backend can support.
3. **Client-side-only search/filter and no pagination**, per the backend's lack of any list query parameters (§B.5.7) — fine at current scale, called out here so it isn't mistaken for an oversight if a future org accumulates hundreds of workers.
4. **Role gating is presentation-only**, as it must be given the backend's single-string role check and no plan/seat enforcement (§C.5) — verified in §6 that the backend still rejects a non-admin's direct `POST /api/portal/workers` call regardless of what the UI shows.
5. **The detail page uses stacked sections instead of literal tabs** (see §2) — a deliberate simplification; revisit only if a future package's detail page (e.g. Knowledge's document detail) needs enough content that stacking becomes unwieldy, at which point a shared tab primitive would amortize better across multiple pages than building one just for this page today.
6. **All risks carried over from Packages 1–2 remain unchanged** (no CORS middleware on the backend, no refresh token, single-process login rate limiter, `/organisations/` returning an array, no timestamp-based activity ordering, etc.) — see the Authentication and Dashboard reports. None are specific to or worsened by this package.

None of the above block Package 4 (Knowledge) from starting — the BFF-proxy pattern (`app/api/portal/workers/*`), the admin-gating-via-JWT approach, and the stacked-detail-page layout are all designed to be reused as-is by the next package.
