# Administration Implementation Report — Frontend Package 7

**Scope:** Package 7 — Administration only, per `FRONTEND_ARCHITECTURE_V1.md` §C.11.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance as both an admin and a non-admin (`member`) user — including a live-reproduced backend bug (§2, §8).
**Depends on:** Package 1 (Authentication), Package 2 (Dashboard), Package 3 (Workers), Package 4 (Knowledge) — the session cookie, `getSessionToken()`/`decodeJwtPayload()`, `AuthProvider`, `PortalNav`, `StatTile`, `EmptyState`, `settle`/`errorMessage`/`isForbidden`, the BFF-proxy pattern, `lib/api/dashboard.js`'s `fetchOrganisationSummary` + `OrganisationSummaryCard`, and `lib/api/workers.js`'s `fetchWorkerList`/`fetchKnowledgeCatalogue`/`removeWorkerKnowledge` are all reused as-is, unchanged.
**Out of scope (unchanged, not implemented):** Billing & Licensing.

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/portal/admin` | Admin-gated landing — headline stats, nav cards to the three sub-areas |
| `/portal/admin/users` | User list (search/filter) + create form |
| `/portal/admin/organisation` | Read-only organisation profile (reused from Package 2) |
| `/portal/admin/permissions` | Org-wide knowledge↔worker permission matrix — audit, grant, revoke |
| `POST /api/portal/admin/users` | Same-origin BFF proxy → `POST /users/` |
| `POST /api/portal/admin/permissions` | Same-origin BFF proxy → `POST /permissions/` |

Removing a permission grant deliberately reuses the pre-existing `DELETE /api/portal/workers/[workerId]/knowledge` route from Package 3 rather than a new one — `/permissions/` has no delete route of its own (§2).

The entire `/portal/admin/**` tree is gated by one shared `app/portal/(protected)/admin/layout.js`, the same nested-layout technique `app/portal/(protected)/layout.js` already established for the session guard, applied here to role instead.

---

## 2. Backend verification performed before writing any code

Per this task's explicit instruction, `api/users.py`, `api/organisations.py`, and `api/permissions.py` — plus their schemas and the one service file `permissions.py` shares with Package 3 (`services/worker_knowledge_service.py`) — were read directly before any frontend code was written.

### Confirmed exactly as the architecture doc describes

- `POST /users/` — admin-gated, body `{organisation_id, first_name, last_name, email, password_hash, role}` (`schemas/user.py#UserCreate`). `organisation_id` is required by the schema but ignored server-side (`create_user()` always uses the caller's own token-derived org) — the same quirk Package 3 already documented for `WorkerCreate`. `password_hash` is a misleading field name only: the caller sends a **plain-text password**, and `auth/security.py#hash_password()` hashes it server-side. This form labels the field "Password."
- `GET /organisations/` — admin-gated, filters to the caller's own org, returns `{id, name, slug}` only — no plan/seat/billing field exists, confirming every prior package's repeated finding that no billing data model exists yet.
- `POST /permissions/` — admin-gated, body `{knowledge_id, worker_id}`, both ownership-checked, creates a `KnowledgePermission` row.
- **No user-role-change, deactivation, or delete endpoint exists** — confirmed by reading every route in `api/users.py`: create and list only. No edit/delete UI was built, per this task's "use existing backend APIs only" constraint.

### New findings, not stated by the architecture doc (found by reading source, exactly as this task instructed)

1. **`GET /users/` is admin-gated too**, not just the create route (`require_role("admin")` on both). This is a real, backend-enforced security boundary here — unlike Workers/Knowledge/Memory, where list reads are open to any authenticated org member. The Users page is correctly gated at both the UI layer (this package's admin layout) and, genuinely, the backend.
2. **`role` has no server-side enum** — a plain `str` column, checked only by `require_role`'s exact string match. The create-user form offers a select of `admin`/`member` (the two values every other role check in this app actually keys off) purely as a UI convenience; the backend would accept any string.
3. **No password policy exists** — `UserCreate.password_hash` is an unconstrained `str`; `hash_password()` hashes whatever is sent, empty string included if the frontend didn't stop it. This app's own validation requires a non-empty password (matching every other required-field convention here), but that is this frontend's own minimum, not one the backend enforces.
4. **`GET /permissions/` has no role check at all** (only `get_current_user`) — asymmetric with `POST /permissions/`, which is admin-only. Any authenticated org member can already read the full permission matrix; only creating a grant through this specific router is restricted.
5. **A genuine, live-reproduced backend bug: `POST /permissions/` has no deduplication check, unlike `POST /worker-knowledge/assign`.** `services/worker_knowledge_service.py#assign_knowledge()` (used by Package 3's per-worker assignment UI) checks for an existing `(worker_id, knowledge_id)` row first and returns it unchanged if found — idempotent. `api/permissions.py#create_permission()` has no such check: it unconditionally inserts a new `KnowledgePermission` row every call. **Verified live** (§8): calling `POST /permissions/` twice for the identical pair produced two different permission ids; a direct Postgres query confirmed two separate rows existed for the exact same `(worker_id, knowledge_id)`.
6. **A consequence of finding 5 that makes it more than cosmetic: "Remove" can silently fail to fully revoke access.** `services/worker_knowledge_service.py#remove_knowledge()` (the only delete path, reused from Package 3 — `/permissions/` has no delete route at all) does `.filter(worker_id, knowledge_id).first()` and deletes **one** matching row. With a duplicate present, clicking "Remove" once succeeds (`{"removed": true}`) but the worker **still has access** via the surviving duplicate. **Verified live**: after one remove call on a duplicated pair, a direct Postgres query showed exactly one row still present, and the permissions page correctly still listed the grant (see §3 for why the frontend still surfaces this honestly rather than masking it).

None of findings 1–6 were fixed here — this package is frontend-only, per its explicit scope, and finding 5/6 in particular is a backend defect this repository has no authority to patch. They shaped real, verifiable UI decisions (§3), not just prose.

---

## 3. How finding 5/6 shaped the Permissions matrix design

Rather than let the UI's own use ever create a duplicate, the assign form's document picker (`PermissionMatrix.js`) excludes any `(worker, knowledge)` pair already present in the fetched grant list for the currently-selected worker — computed client-side from the same data already on the page, the same "available minus already-assigned" technique `WorkerKnowledgeAssignment.js` (Package 3) already uses. This means **normal use of this screen can never itself create the duplicate** described in finding 5, even though a direct API call still can (verified in §8, deliberately, to confirm the gap is real and not closed by this frontend).

The remove flow was deliberately **not** changed to "keep removing until no matching row remains" or similar client-side compensation for finding 6. Silently looping a delete call to work around a known backend defect would hide the problem rather than surface it, and could mask a future, different reason the same symptom might occur. Instead: the grant list re-fetches after every remove (`router.refresh()`, standard pattern), so if a duplicate does exist (whether created via a direct API call or, hypothetically, a future site of reuse this frontend doesn't currently have), the admin sees the grant is still listed and can remove it again — the UI never claims something is gone when it isn't. This is the same "don't fake behaviour the backend doesn't actually provide" discipline every prior package applied to its own finding (Knowledge's delete bug, Chat's session id).

---

## 4. User management, organisation management, permissions and role management (requirements #1–#3)

- **Users** (`/portal/admin/users`): `UserListView` (client-side search across name/email + role filter, same pattern `WorkerListView`/`KnowledgeListView` established) plus `CreateUserForm`. Rendered as list rows, not cards with a "view detail" link — there is no per-user detail page, since there's nothing more to show or do once created (no update/delete endpoint, finding above), and a detail page that just repeated the list row would be dead weight.
- **Organisation** (`/portal/admin/organisation`): reuses `fetchOrganisationSummary` and `OrganisationSummaryCard` (Package 2) unchanged — this is the exact same `GET /organisations/` call and rendering Dashboard already built. §C.11/§C.3 name this as its own route despite the overlap, framed as the organisation's settings/profile page rather than a dashboard widget; both entry points cost nothing extra since they share the same function.
- **Permissions and role management** (`/portal/admin/permissions`): `GET /permissions/` returns raw `{id, knowledge_id, worker_id}` rows with no joined names (§2) — the page cross-references the already-fetched worker list and knowledge catalogue (both already available via Package 3's `lib/api/workers.js`) to build human-readable grant rows. "Role management" beyond what `CreateUserForm`'s role select already provides does not exist as a separate concept — there is no role-change endpoint (§2), so assigning a role only ever happens at user-creation time, consistent with what the backend can actually do.

---

## 5. Administration dashboard (requirement #4)

`/portal/admin`'s landing page shows two real, currently-available aggregates as `StatTile`s — total user count (`GET /users/`, length of the array — there is no dedicated users-count endpoint) and total permission-grant count (`GET /permissions/`, same technique) — plus three navigation cards to the sub-areas. No fabricated metric (e.g., "active this week") was added; both numbers are exactly what the two real endpoints return, nothing invented on top given the well-established "no timestamps anywhere" limitation every prior package has already documented for this data model.

---

## 6. User search and filtering (requirement #5)

`UserListView` filters the already-fetched user array client-side by name/email substring and a role dropdown — the same rationale as every prior list-view component: `GET /users/` accepts no query parameters at all, so this is the only option, and is fine at the list sizes a single organisation has today. The Permissions matrix also got a search box (worker/document substring) for consistency with every other list page in this app, though it wasn't explicitly required — the cost was negligible given `PermissionMatrix.js` already needed the underlying data in memory.

---

## 7. Portal navigation integration, component and route conventions (requirements #9–#10)

- `PortalNav` gained an "Admin" link — but conditionally, only when the signed-in user's role is `"admin"` (read via the existing `useAuth()` hook, already in scope since `PortalNav` renders inside `AuthProvider`). Every other package's nav link is unconditional; Admin is the first exception, because the entire section it points to is a genuine access wall for most users (§2, finding 1) — showing it to everyone would just be nav clutter pointing at a "requires admin access" message. Verified live (§8) that a non-admin's nav omits it entirely.
- The portal overview page's placeholder card (previously "Admin & Billing", pointing nowhere) is now split: "Administration" links to `/portal/admin` with copy describing only what's actually shipped (users, organisation, permissions) — no billing/plan/seat language, since that remains Package 9's unbuilt scope.
- Every new page follows the exact `page.js`/`loading.js`/`error.js` triple every prior package established. **Zero new CSS classes were needed** — every element reuses `.workers-toolbar`, `.activity-list`/`.activity-title`/`.activity-meta`, `.assignment-row`, `.badge`, `.stat-grid`/`.stat-grid-2`, `.contact-form`, `.assign-form`, `.form-error`/`.form-note`, `.feature-grid`/`.card-action`, and `.btn`/`.btn-secondary`/`.btn-small` — all pre-existing. This is the smallest total footprint of any package so far (Memory's report held that record at +4 CSS lines; this package needed none).

---

## 8. Loading, empty, and error states (requirements #6–#8), and validation

| State | Mechanism |
|---|---|
| **Loading** | `loading.js` for all four routes — the same skeleton-tile Suspense-fallback convention every prior package established. |
| **Error (per-section)** | The admin landing page independently handles a users-count failure and a permissions-count failure via `settle()`/`errorMessage()`. |
| **Error (restricted, not a raw 403)** | The shared admin layout renders one clear "This area requires admin access" message for the entire tree, rather than letting each page attempt a fetch and show a raw 403 — same treatment `/portal/workers/new` (Package 3) already gave its own admin-only page. |
| **Error (safety net)** | `error.js` for all four routes, same `reset()`-button pattern as every prior package. |
| **Empty (no users)** | `EmptyState` in `UserListView`. |
| **Empty (search yields nothing)** | A second, distinct `EmptyState` in `UserListView`, same distinction every prior list view drew. |
| **Empty (no permission grants)** | `EmptyState` in `PermissionMatrix`. |
| **Empty (organisation restricted/unavailable)** | Reused unchanged from Package 2's `OrganisationSummaryCard`. |

### Validation, run from a clean state (`rm -rf .next`)

```
$ npm run build   → ✓ Compiled successfully, 37 routes (including /portal/admin,
                     /portal/admin/users, /portal/admin/organisation,
                     /portal/admin/permissions, and the two new
                     /api/portal/admin/* proxy routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 81, pass 81, fail 0
```

10 new unit tests (`lib/api/admin.js`'s 4 functions, `parseUserPayload`, `parsePermissionPayload`), same mocked-`global.fetch` style as every prior package. All 71 tests from Packages 1–6 pass unchanged.

### End-to-end smoke test (real backend, not mocked)

A temporary organisation, two temporary users (`admin`, `member`), one temporary worker, and one temporary knowledge document were created for this test and fully deleted again afterward, along with every permission row the test generated (including the deliberately-created duplicate).

| Check | Result |
|---|---|
| `GET /portal/admin`, `/users`, `/organisation`, `/permissions` with no session | `307` → `/portal/login?next=...`, preserved for all four |
| Admin → `GET /portal/admin` | `200`; both stat tiles and all three nav cards render |
| Admin → `GET /portal/admin/users` | `200`; the seeded admin user listed |
| Admin → `POST /api/portal/admin/users` (real payload, via curl — same shape `CreateUserForm` sends) | `200`; user created, immediately visible in the list on reload |
| `POST /api/portal/admin/users` with blank required fields | `400 {"error": "First name, last name, email and password are all required."}` |
| Admin → `GET /portal/admin/organisation` | `200`; correct name/slug (Package 2's component, unmodified) |
| Admin → `GET /portal/admin/permissions` (no grants yet) | `200`; empty state, assign form populated with the real worker/document |
| Admin → `POST /api/portal/admin/permissions` | `200`; grant created, now listed |
| Admin → the matrix's assign form after that grant | Correctly showed "already has access to all of your organisation's knowledge" — confirms the UI-side dedup guard (§3) |
| **`POST /permissions/` called twice for the identical pair, directly against the backend** | Two different permission ids returned; **directly confirmed in Postgres**: 2 separate rows for the exact same `(worker_id, knowledge_id)` — finding 5, live-reproduced |
| One "Remove" call on the duplicated pair | `{"removed": true}`; **directly confirmed in Postgres**: 1 row still remained; the permissions page still correctly listed the grant afterward (not silently hidden) — finding 6, live-reproduced |
| A second "Remove" call | `{"removed": true}`; 0 rows remained, page showed the empty state |
| Member (non-admin) → `GET /portal/admin`, `/users`, `/permissions` | `200` for all three, but every one rendered "This area requires admin access" — confirms the shared layout gates the whole tree, not just the landing page |
| Member → `POST /api/portal/admin/users` directly (bypassing the UI gate) | `403 {"error": "Insufficient permissions"}` — confirms the backend's own `require_role("admin")` is the real enforcement here, not just this app's UI |
| Member → portal nav | "Admin" link correctly absent |

---

## 9. Files changed

### New files

```
lib/api/admin.js                                             fetchUsers / createUser /
                                                              fetchPermissions / createPermission
lib/api/__tests__/admin.test.js                              unit tests (mocks global.fetch)

app/api/portal/admin/users/route.js                          POST → createUser() BFF proxy
app/api/portal/admin/permissions/route.js                     POST → createPermission() BFF proxy

app/portal/(protected)/admin/layout.js                        shared admin-role gate for the whole tree
app/portal/(protected)/admin/page.js                          landing/dashboard (Server Component)
app/portal/(protected)/admin/loading.js                       Suspense fallback
app/portal/(protected)/admin/error.js                         error boundary safety net
app/portal/(protected)/admin/users/page.js                     user list + create (Server Component)
app/portal/(protected)/admin/users/loading.js                  Suspense fallback
app/portal/(protected)/admin/users/error.js                    error boundary safety net
app/portal/(protected)/admin/organisation/page.js               org profile (Server Component)
app/portal/(protected)/admin/organisation/loading.js            Suspense fallback
app/portal/(protected)/admin/organisation/error.js              error boundary safety net
app/portal/(protected)/admin/permissions/page.js                permission matrix (Server Component)
app/portal/(protected)/admin/permissions/loading.js             Suspense fallback
app/portal/(protected)/admin/permissions/error.js               error boundary safety net

components/portal/CreateUserForm.js                           create-user form (mirrors CreateWorkerForm.js)
components/portal/UserListView.js                             search/filter user rows (mirrors WorkerListView.js)
components/portal/PermissionMatrix.js                         audit + grant + revoke (mirrors WorkerKnowledgeAssignment.js)

docs/frontend/IMPLEMENTATION_REPORTS/ADMIN_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/validation.js` | Added `parseUserPayload`, `parsePermissionPayload` | Rejects incomplete submissions before they reach the backend, same style as every prior `parse*` helper |
| `components/portal/PortalNav.js` | Added a conditional "Admin" link (admin role only) | Requirement #9 — see §7 for why this is the first conditional nav link in the app |
| `app/portal/(protected)/page.js` | Split the old "Admin & Billing" placeholder card into an "Administration" card linking to `/portal/admin`; hero copy updated | Requirement #9, same treatment every prior package gave its own card; billing language removed since that remains unbuilt |

No file from Packages 1–6 was changed in behaviour — `lib/api/auth.js`, `lib/api/client.js`, `middleware.js`, `app/portal/(protected)/layout.js`, `AuthProvider`, `StatTile`, `EmptyState`, `OrganisationSummaryCard`, `lib/api/dashboard.js`, `lib/api/results.js`, `lib/api/workers.js`, and every Workers/Knowledge/Chat/Memory component are all reused exactly as they were.

---

## 10. Remaining risks / follow-ups

1. **`POST /permissions/` has no deduplication check, unlike `POST /worker-knowledge/assign`, and can leave a document silently un-revoked after "Remove."** The single most consequential finding of this package (§2 findings 5–6, §8). This frontend closes the gap for its own UI (the assign picker excludes already-granted pairs) but cannot close it for a direct API call, and cannot make a single "Remove" click guaranteed-complete if a duplicate already exists from outside this UI. Needs a backend-side fix: either `create_permission()` should check for an existing row first (mirroring `assign_knowledge()`'s already-correct behaviour), a unique constraint on `(worker_id, knowledge_id)` should be added to the `knowledge_permissions` table, or both.
2. **No user-role-change, deactivation, or delete endpoint exists.** A mis-assigned admin role, or a user who should lose access, cannot be corrected from this app — the same shape of gap Package 3 (no worker-update) and Package 6 (no memory update/delete) already found for other resources.
3. **No password policy is enforced backend-side.** This frontend requires a non-empty password as its own minimum; an empty or trivially weak password would otherwise be accepted and hashed as-is.
4. **`role` has no server-side enum** — any string is accepted by `require_role`'s exact match. The create-user form's `admin`/`member` select is a UI convenience, not a backend constraint; a role typo (e.g., a future direct API caller sending `"Admin"` with different casing) would silently create a user no `require_role("admin")` check would ever recognise as an admin.
5. **The permission matrix's cross-referencing (worker/knowledge names) is unpaginated**, fetching the full worker list and knowledge catalogue on every load — fine at today's scale, the same standing §B.5.7 gap every prior package has carried.
6. **All risks carried over from Packages 1–6 remain unchanged** (no CORS middleware, no refresh token, Knowledge's `DELETE /documents/{id}` FK bug, Chat's unresumable sessions, Memory's no-update/delete, Workers' no-update endpoint) — see the respective prior reports. None are specific to or worsened by this package.

---

## 11. Recommended next phase

With Packages 1–7 complete, the only two items remaining in `FRONTEND_ARCHITECTURE_V1.md`'s Part E sequencing are **Package 8 (Knowledge connectors "coming soon")** and **Package 9 (Billing & Licensing)**.

- **Package 8** is the lower-effort, lower-risk next step: `GET /connector-status/` already exists and (per Package 4's own review) returns hardcoded `"available"`/`"connected"` stub data for SharePoint/OneDrive/Teams — the task is exclusively to render these as clearly-labelled, disabled "coming soon" cards, matching the real (non-functional) backend state rather than implying a working OAuth connect flow. No new backend endpoint needed, no ambiguity about scope.
- **Package 9 (Billing & Licensing)** is the longest-lead-time item in the entire roadmap (flagged as such since Package 1) and has zero backend support today — no `organisations.plan` column, no Stripe↔backend bridge, no license-file mechanism. It cannot be completed frontend-only; the backend schema/endpoint conversation needs to happen first, and per [[roadmap]] should already be underway in parallel rather than starting only once Package 8 ships.

**Recommendation: do Package 8 next.** It is small, fully scoped, requires no backend changes, and clears the deck so that whenever Billing & Licensing's backend prerequisites land, Package 9 is the only remaining item — rather than leaving two unrelated, differently-blocked packages open at once. Before writing Package 8's code, read `api/connectors.py` and `api/connector_status.py` directly (not yet read by any prior package) to confirm exactly what each hardcoded response looks like — the same verify-before-building discipline that found real gaps in Packages 4, 5, 6, and 7.
