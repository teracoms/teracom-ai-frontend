# Memory Implementation Report — Frontend Package 6

**Scope:** Package 6 — Memory only, per `FRONTEND_ARCHITECTURE_V1.md` §C.10.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance — including a real Ollama-triggered auto-memory capture, not mocked — as both an admin and a non-admin (`member`) user.
**Depends on:** Package 1 (Authentication), Package 2 (Dashboard), Package 3 (Workers), Package 4 (Knowledge), Package 5 (Chat) — the session cookie, `getSessionToken()`, `AuthProvider`, `PortalNav`, `StatTile`, `EmptyState`, `settle`/`errorMessage`, the BFF-proxy pattern, and `lib/api/workers.js`'s `fetchWorkerList`/`fetchWorkerSummary`/`fetchWorkerMemories` are all reused as-is, unchanged.
**Out of scope (unchanged, not implemented):** Administration, Billing & Licensing.

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/portal/memory` | Cross-worker memory overview — total stat, worker-grouped browse, search |
| `/portal/memory/:workerId` | Per-worker memory view — that worker's memories + manual "add a memory" form |
| `/portal/memory/:workerId/:memoryId` | Read-only memory detail — full content, type, honest no-edit/delete note |
| `POST /api/portal/memory` | Same-origin BFF proxy → `POST /memory/store` |

This matches §C.10 and §C.3's route list (`/portal/memory`) exactly, extended with the two nested detail routes needed to satisfy this task's explicit "Worker memory views" and "Memory detail views" requirements as real, separate pages rather than folding everything into one screen.

---

## 2. Backend verification performed before writing any code

Per this task's explicit instruction ("review actual backend memory endpoints... do not assume APIs exist without verification"), the real backend source was read directly — `api/memory.py`, `api/memory_summary.py`, `schemas/memory.py`, `services/memory_service.py`, `services/memory_summary_service.py`, `services/auto_memory_service.py`, and `models/worker_memory.py` — before any frontend code was written, continuing the same discipline Packages 4 and 5 established (both found real, undocumented backend behaviour this way).

### Confirmed exactly as the architecture doc describes

- `POST /memory/store` — body `{worker_id, memory}` (`schemas/memory.py#MemoryStoreRequest`), ownership-checked via `get_owned_worker` (404/403), calls `services/memory_service.py#store_memory()`.
- `GET /memory/{worker_id}` — ownership-checked, returns the worker's `WorkerMemory` rows.
- `GET /memory-summary/` — `{total_memories: N}`, org-scoped via a join on `Worker.organisation_id`.
- **`memory_type` is always `"fact"`**, hardcoded in `store_memory()` regardless of source (manual or auto-captured) — confirmed directly in source, exactly as §C.10 states. No type-based filtering was built, per that same guidance.
- **No org-wide "all memories" endpoint exists** — confirmed by grepping every `api/*.py` file for `WorkerMemory` usage; the only reads are the per-worker list and the summary count. The overview page's per-worker fan-out (§3) is not a workaround for an endpoint that was missed — it genuinely does not exist.

### New findings, not stated by the architecture doc (found by reading source, exactly as this task instructed)

1. **Neither `POST /memory/store` nor `GET /memory/{worker_id}`/`GET /memory-summary/` carries any role check** — only `get_current_user` (+ worker-ownership for the two worker-scoped calls). Any authenticated org member can add a memory to any worker in their org, or read any worker's memories. This UI is accordingly **not** admin-gated for adding a memory, the same treatment Package 4 gave document upload.
2. **There is no update or delete endpoint for a memory anywhere in the backend.** `models/worker_memory.py`'s `WorkerMemory` has no route beyond create (`POST /memory/store`) and read (`GET /memory/{worker_id}`). This is a real gap, the same shape as Package 3's "no worker-update endpoint" finding — the memory detail page states this plainly rather than building an edit/delete affordance the backend can't back.
3. **`schemas/memory.py` defines an unused `MemoryCreate`/`MemoryResponse` pair with a `memory_type` field** that no route anywhere references (confirmed by grepping `api/` and `services/` for `MemoryCreate` — zero hits outside the schema file itself). Dead code in the backend, not consequential to this frontend, but worth noting so nobody mistakes it for a route that exists.
4. **`services/auto_memory_service.py`'s trigger list is exactly seven fixed, case-insensitive substring phrases**: `"my preferred"`, `"i prefer"`, `"our preferred"`, `"my vendor"`, `"our vendor"`, `"head office"`, `"our office"`. The check stops at the first match (`return True` immediately), so **at most one memory is created per chat message**, even if multiple trigger phrases appear in it.
5. **Auto-captured memories store the entire raw chat message as `memory_content`, not an extracted fact.** `process_memory_capture(worker_id, message, db)` calls `store_memory(worker_id, message, db)` — the full, unmodified user message, verbatim. **Verified live** (§8): sending the chat message *"Just so you know, our vendor for scheduling software is Calendly."* produced a memory row whose `memory_content` was that exact sentence, not a distilled fact like "Vendor: Calendly." This matters for UI design — a memory row can be an arbitrarily long, conversational sentence, not a short structured fact — so `MemoryListItem` truncates long content in list views (same 160-character truncation convention `KnowledgeCard` already established) and shows the full text only on the detail page.
6. **No timestamp exists anywhere on `WorkerMemory`** (no `created_at`) — consistent with every prior package's finding (Knowledge, Chat) that this data model has no time-ordering capability at all. Memories cannot be sorted by recency; they are shown in whatever order the backend returns them (primary-key/query order, not chronological).

None of findings 1–6 required or received any backend code changes — this package is frontend-only, per its explicit scope. They are documented here so the UI decisions they drove (no admin-gating on add, no edit/delete UI, plain-label `memory_type`, truncate-then-expand content, no "sort by recency") are traceable to a specific, verified reason rather than assumption.

---

## 3. Memory overview, worker memory views, memory detail (requirements #1–#3)

- **Overview** (`/portal/memory`) fetches `GET /memory-summary/` for the headline stat, then `GET /worker-list/` followed by one `GET /memory/{worker_id}` per worker (`Promise.all`, each call independently caught so one worker's failure doesn't drop the others) — the exact fan-out §C.10 prescribes, and the same bounded, per-item-endpoint technique Package 4's Knowledge→Workers reverse lookup already used. Workers with zero memories are simply omitted from the browse view (nothing to show), not rendered as empty placeholder groups.
- **Worker memory view** (`/portal/memory/:workerId`) is a dedicated, worker-scoped page — distinct from (and cross-linked with, see §6) the read-only Memory section Package 3 already built into the Worker detail page. This page adds the one piece Package 3 didn't have: the manual "add a memory" form.
- **Memory detail** (`/portal/memory/:workerId/:memoryId`) is derived, not fetched directly — there is no `GET /memory/{worker_id}/{memory_id}` endpoint (confirmed in §2), so this page fetches the worker's full memory list (already ownership-checked) and finds the matching id client-side-of-the-server-render, the same "derive detail from an existing per-item endpoint" technique Package 5's chat session detail page and Package 4's reverse lookup both established. A worker-not-found (404/403) and a memory-not-found-within-that-worker's-list are two distinct, correctly-labelled error states, not collapsed into one generic message.

---

## 4. Memory search and filtering (requirement #4)

Two separate, appropriately-scoped mechanisms, following the same "don't merge different query types into one box" principle Package 4 applied to Knowledge's list filter vs. semantic search:

- **Overview page** (`MemoryOverviewView`): a single search box filters every already-fetched memory's `memory_content` by substring match, hiding any worker group that has no remaining matches. No worker-name dropdown was added here (unlike Knowledge's source filter) — since the view is already grouped and labelled by worker, a redundant worker filter alongside the grouping itself would be surplus UI for no real gain.
- **No type-based filter anywhere** — per §C.10 and confirmed in §2, `memory_type` is always `"fact"`; building a facet for a field that never varies would be filtering theatre, not a real feature.

Both are client-side, over data already fetched — the only option, since (per §2) no memory endpoint accepts any query parameter.

---

## 5. Memory statistics and summaries (requirement #5)

`GET /memory-summary/`'s `{total_memories}` is shown as a `StatTile` at the top of the overview page — reusing Package 2's `StatTile` component unchanged. No additional aggregate was invented; the backend has exactly one summary number for memory, and this page shows exactly that one number, not a fabricated breakdown (e.g., "memories this week") the data model (§2, finding 6) cannot actually support.

---

## 6. Portal navigation, cross-linking, and component/route conventions (requirements #9–#11)

- `PortalNav` gained a "Memory" link; the existing nested-route active-matching logic (`pathname.startsWith(href + '/')`) needed no changes, since it was already written generically for any future nested section.
- The portal overview page's Memory card now links to `/portal/memory`, with updated hero copy — the same treatment every prior package gave its own card.
- **Cross-link added to the Worker detail page** (Package 3): its existing read-only Memory section now has a "Manage in Memory" button linking to `/portal/memory/:workerId`. This is the only change to a prior package's file in this whole package, and it's additive (one `<Link>`, no existing markup altered) — verified live (§8) that it renders and points to the right worker.
- Every new route follows the exact `page.js`/`loading.js`/`error.js` triple every prior package established, and every list/detail page reuses `EmptyState`, `StatTile`, `.activity-list`/`.activity-title`/`.activity-meta`, `.assignment-row`, `.badge`, `.contact-form`, `.form-error`, `.form-note-banner`, `.document-content`, `.workers-toolbar`, and `.btn`/`.btn-secondary`/`.btn-small` — all pre-existing classes. The only new CSS is four small rules for the overview's worker-grouped layout (`.memory-groups`/`.memory-group`), the smallest CSS footprint of any package so far, directly reflecting how much was already reusable.

---

## 7. Loading, empty, and error states (requirements #6–#8)

| State | Mechanism |
|---|---|
| **Loading** | `loading.js` for all three routes — the same skeleton-tile Suspense-fallback convention every prior package established. |
| **Error (per-section)** | The overview page independently handles a `memory-summary` failure and a worker-fan-out failure via `settle()`/`errorMessage()` — one failing doesn't block the other from rendering. |
| **Error (whole-page, not-found)** | Both the per-worker page and the detail page collapse a `worker-summary` 404/403 into "Worker not found." The detail page additionally distinguishes a valid worker with no matching memory id as "Memory not found" — a different, correctly-labelled case, not conflated with the worker-not-found path. |
| **Error (safety net)** | `error.js` for all three routes, same `reset()`-button pattern as every prior package. |
| **Error (add-memory failure)** | `AddMemoryForm` surfaces a `.form-error` banner inline, same pattern as `CreateWorkerForm`. |
| **Empty (no memories org-wide)** | `EmptyState` on the overview page. |
| **Empty (search yields nothing)** | A second, distinct `EmptyState` on the overview page for "no memories match your search." |
| **Empty (a specific worker has no memories)** | `EmptyState` on the per-worker page, with copy noting both how memories get created (auto-capture) and how to add one manually (the form right above it). |

---

## 8. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, 31 routes (including /portal/memory,
                     /portal/memory/[workerId], /portal/memory/[workerId]/[memoryId],
                     and the new /api/portal/memory proxy route), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 71, pass 71, fail 0
```

### Unit tests (71 total; 5 new for this package)

New this package: `lib/api/memory.js` (`fetchMemorySummary`, `storeMemory`) and `lib/api/validation.js#parseMemoryPayload`, in the same mocked-`global.fetch` style as every prior package. All 66 tests from Packages 1–5 pass unchanged.

### End-to-end smoke test (real backend, real Ollama — not mocked)

`teracom-ai-backend` was started locally against the existing Postgres instance, with the local Ollama service already running. A temporary organisation, two temporary users (`admin`, `member`), and two temporary workers were created for this test and fully deleted again afterward, along with every memory/chat row the test generated.

| Check | Result |
|---|---|
| `GET /portal/memory`, `/:workerId`, `/:workerId/:memoryId` with no session | `307` → `/portal/login?next=...`, preserved for all three including the two-level-deep route |
| Admin → `GET /portal/memory` (no memories yet) | `200`; "No memories yet" empty state, stat tile present |
| Admin → `GET /portal/memory/:workerId` (no memories yet) | `200`; "No memories yet" empty state, add-memory form present |
| Admin → `POST /api/portal/memory` (manual memory, worker 1) | `200`; `{"memory": {...memory_type: "fact"...}}` |
| Admin → `POST /api/portal/chat` with a message containing the trigger phrase "our vendor" (worker 2) | `200`; real Ollama completion returned, and a second memory silently created server-side |
| Admin → `GET /portal/memory` again | `200`; **both** worker groups now render, each showing the right worker's own memory content and the correct total (`2`) stat |
| Auto-captured memory's stored content | Verified to be the exact, full raw chat message, not a distilled fact — confirming §2 finding 5 directly, not just from source inspection |
| Admin → `GET /portal/memory/:workerId/:memoryId` (the auto-captured one) | `200`; "Memory for Scheduler," full content, `fact` badge, and the "can't be edited or deleted" note all render |
| `GET /portal/memory/:bogus-worker-uuid` | `200`; "Worker not found," not a crash |
| `GET /portal/memory/:realWorkerId/:bogus-memory-uuid` | `200`; "Memory not found" (distinct from worker-not-found), not a crash |
| Member (non-admin) → `GET /portal/memory` | `200`; identical view to admin, both memories visible |
| Member → `POST /api/portal/memory` | `200`; succeeded — confirms finding 1 (no role gate) directly, not just from source |
| `POST /api/portal/memory` with a blank/whitespace-only memory | `400 {"error": "A worker and a memory are both required."}` — rejected before reaching the backend |
| Worker detail page (Package 3) → "Manage in Memory" link | Renders and points to `/portal/memory/:workerId` correctly |

---

## 9. Files changed

### New files

```
lib/api/memory.js                                          fetchMemorySummary / storeMemory
lib/api/__tests__/memory.test.js                            unit tests (mocks global.fetch)

app/api/portal/memory/route.js                              POST → storeMemory() BFF proxy

app/portal/(protected)/memory/page.js                        overview (Server Component)
app/portal/(protected)/memory/loading.js                     Suspense fallback
app/portal/(protected)/memory/error.js                       error boundary safety net
app/portal/(protected)/memory/[workerId]/page.js               per-worker memory view (Server Component)
app/portal/(protected)/memory/[workerId]/loading.js            Suspense fallback
app/portal/(protected)/memory/[workerId]/error.js              error boundary safety net
app/portal/(protected)/memory/[workerId]/[memoryId]/page.js     memory detail (Server Component)
app/portal/(protected)/memory/[workerId]/[memoryId]/loading.js  Suspense fallback
app/portal/(protected)/memory/[workerId]/[memoryId]/error.js    error boundary safety net

components/portal/MemoryListItem.js                          shared presentational memory row
components/portal/MemoryOverviewView.js                      worker-grouped browse + search (client)
components/portal/AddMemoryForm.js                            manual memory entry form (client)

docs/frontend/IMPLEMENTATION_REPORTS/MEMORY_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/validation.js` | Added `parseMemoryPayload` | Rejects a blank memory/worker_id before it reaches the backend, same style as every prior `parse*` helper |
| `components/portal/PortalNav.js` | Added a "Memory" link | Requirement #9 |
| `app/portal/(protected)/page.js` | Memory placeholder card now links to `/portal/memory`; hero copy updated to say Memory is ready | Requirement #9, same treatment every prior package gave its own card |
| `app/portal/(protected)/workers/[workerId]/page.js` | Its existing Memory section now has a "Manage in Memory" link to `/portal/memory/:workerId` | Requirement #9/#10 — one small, additive cross-link between Packages 3 and 6; no existing markup was altered |
| `app/globals.css` | +4 lines, additive only | New `.memory-groups`/`.memory-group` classes for the overview's worker-grouped layout — everything else reuses pre-existing classes (see §6) |

No file from Packages 1–5 was changed in behaviour beyond the one-line cross-link above — `lib/api/auth.js`, `lib/api/client.js`, `middleware.js`, `app/portal/(protected)/layout.js`, `AuthProvider`, `StatTile`, `EmptyState`, `lib/api/results.js`, and every Workers/Knowledge/Chat component are all reused exactly as they were.

---

## 10. Remaining risks / follow-ups

1. **No update or delete endpoint exists for a memory** (§2, finding 2) — the single biggest capability gap for this package. A wrong or stale manually-added memory, or an auto-captured one that mis-fired on an unrelated sentence containing a trigger phrase, can never be corrected or removed from this app. This is a backend gap to raise, not a frontend omission — building a fake "delete" that silently no-ops, or one that 404s on every attempt, would be worse than not offering it at all.
2. **Auto-capture can mis-fire on ordinary conversation.** Because the trigger check is a plain substring match on 7 fixed phrases with no NLP/intent understanding (§2, finding 4), any message containing e.g. "our office" for an unrelated reason ("is our office open Friday?") creates a memory verbatim. Combined with risk 1 (no delete), a mis-fired capture is permanent. Worth raising alongside risk 1 as one combined backend conversation: smarter capture criteria and a way to remove a bad entry are two halves of the same underlying gap.
3. **No timestamp/recency ordering exists** (§2, finding 6) — consistent with every prior package's finding on this data model; memories cannot be sorted or filtered by when they were captured.
4. **The overview page's per-worker fan-out has no pagination** and re-fetches every worker's full memory list on every page load — fine at today's scale (small orgs, few workers), the same standing §B.5.7 gap every prior package has carried, not worsened here.
5. **All risks carried over from Packages 1–5 remain unchanged** (no CORS middleware on the backend, no refresh token, the `DELETE /documents/{id}` FK-violation bug from Package 4, `POST /chat/`'s unretrievable session id from Package 5, no worker-update endpoint, etc.) — see the respective prior reports. None are specific to or worsened by this package.

---

## 11. Recommended next package

**Package 7 — Administration**, per §C.11: an admin-gated landing (`/portal/admin`), user management (`GET /users/` + `POST /users/`, create + list only — no role-change/deactivate/delete endpoints exist, a gap to flag rather than build around), a read-only organisation profile (`GET /organisations/`, admin-only backend-side, already handled gracefully as a restricted state by Package 2's `OrganisationSummaryCard`), and a knowledge↔worker permissions matrix (`GET /permissions/` + `POST /permissions/` for bulk/audit view, duplicating the same relationship Package 3's per-worker assignment UI already manages for the common case).

Before writing any Administration code, read `api/users.py`, `api/organisations.py`, and `api/permissions.py` directly (not yet read in detail by any prior package) — the same discipline this package and Packages 4–5 applied, given how consistently it has surfaced real, undocumented backend behaviour (Knowledge's delete bug, Chat's session-resumability gap, and this package's auto-capture-stores-the-whole-message finding). Administration is also the first package handling actual user-account data (creation, roles) rather than AI-domain objects (workers/knowledge/chat/memory), so the security implications of what `POST /users/` actually accepts and enforces are worth confirming from source before exposing a form for it.
