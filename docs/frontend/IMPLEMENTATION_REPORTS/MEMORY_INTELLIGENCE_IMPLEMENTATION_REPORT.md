# Memory Intelligence Implementation Report — Phase 0 Package H

**Scope:** Package H — Knowledge & Memory Intelligence, spanning both this repository and `teracom-ai-backend` (sibling repository). No pre-existing `*_MVP_V1.md` design document existed for this package (same situation as Package G) — see the backend report's §1 for the three design forks resolved with the user before any code was written.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance and a real local Ollama instance, as both an admin and a `member` (non-admin) user.
**Depends on:** Packages 1–9 and Package G — session cookie/`getSessionToken()`/`AuthProvider`, `PortalNav`, `StatTile`/`EmptyState`, `settle`/`errorMessage`, the BFF-proxy pattern, `decodeJwtPayload` (Package 9's role-check-before-fetch precedent), `lib/api/workers.js`'s `fetchWorkerList`, and `lib/api/ctoOrchestration.js`'s `CtoOrchestrationPanel` are all reused as-is except where noted in §6.
**Out of scope (unchanged, not implemented):** Billing & Licensing (still a UX scaffold, Package 9); no edit/delete UI for any memory tier, raw or summarised (see backend report §11).

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/portal/admin/departments` | Admin-only: create departments, assign workers to them |
| `/portal/memory` (extended) | Now also lists departments (any member) and links to Organisation Memory (admin only) |
| `/portal/memory/organisation` | Admin-only organisation-wide memory view + add form + summary panel |
| `/portal/memory/department/:departmentId` | Any org member can view; only an admin can add (form self-hides otherwise) |
| `/portal/memory/:workerId` (extended) | Gained a long-term summary panel, same as the other two tiers |
| `/portal/cto` (extended) | `CtoOrchestrationPanel` now notes the memory hierarchy feeding its synthesis |
| `POST /api/portal/departments` | BFF proxy → `POST /departments/` |
| `PATCH /api/portal/workers/:workerId/department` | BFF proxy → `PATCH /workers/{id}/department` |
| `POST /api/portal/organisation-memory` | BFF proxy → `POST /organisation-memory/store` |
| `POST /api/portal/department-memory` | BFF proxy → `POST /department-memory/store` |
| `POST /api/portal/memory-summaries` | BFF proxy → `POST /memory-summaries/generate` |

## 2. Backend verification performed before writing any code

Per this series' established discipline (every prior package that skipped this step later found real, undocumented backend behaviour), `teracom-ai-backend`'s new Package H source was read directly as it was built alongside this frontend work — `models/{department,organisation_memory,department_memory,memory_summary}.py`, `schemas/*`, `services/{department_service,organisation_memory_service,department_memory_service,memory_retrieval_service,memory_summary_generation_service,memory_governance_service}.py`, `api/{departments,organisation_memory,department_memory,memory_summaries}.py`, and the modified `api/workers.py`/`cto_orchestration_service.py`.

Confirmed directly, driving the frontend's own design:

- **Departments are not tier-gated; the memory built on top of them is.** `POST /departments/` requires only `require_role("admin")` — no `memory_enrichment` check. This is why `CreateDepartmentForm`/`DepartmentListView` render on any tier, but `AddOrganisationMemoryForm`/`AddDepartmentMemoryForm`/`MemorySummaryPanel` can all legitimately 403 with "Memory Enrichment is not available on this organisation's current tier" even for an admin, and every BFF route for those three simply passes that status through rather than re-implementing the check.
- **`PATCH /workers/{id}/department` accepts an explicit `null` to clear an assignment** (`schemas/department.py#WorkerDepartmentAssignment`) — `AssignWorkerDepartmentControl`'s "No department" option sends `department_id: null`, not an omitted field, and the BFF route (`app/api/portal/workers/[workerId]/department/route.js`) distinguishes "no `department_id` key at all" (400) from "`department_id: null`" (valid) rather than collapsing both to the same case.
- **`GET /memory-summaries/` takes `scope`/`scope_id` as query parameters, not a path or body** — `fetchMemorySummaries()` uses `backendFetch`'s `searchParams` option, the same mechanism `lib/api/knowledge.js`'s search already established, not a new pattern.
- **A summary's access rule mirrors its scope's own read rule exactly** (`api/memory_summaries.py#_check_scope_access()`) — organisation-scope generation is admin-only even though department- and worker-scope generation is open to any org member with ownership, so `MemorySummaryPanel` (the one shared component used at all three tiers) surfaces whatever 403 the backend returns rather than trying to predict per-scope eligibility client-side.
- **No org-wide "all departments' memory" or "all summaries" endpoint exists** — same "no aggregate endpoint, fan out per item" shape Package 6 already established for worker memory. The `/portal/memory` overview page's departments section lists departments (one call) and links into each department's own memory page, rather than fetching every department's memory up front.

None of these findings required backend changes from this side — the frontend behaviour described above (which forms render on which tier, how a 403 is surfaced, the query-vs-body-vs-path shape) is traceable directly to this verification, not assumption.

## 3. Organisational memory architecture, department-level memory, worker-level memory (requirements #1–#3)

- **Organisation memory** (`/portal/memory/organisation`) is a standalone page, not nested under `/portal/admin` — it carries its own restricted-message gate (identical shape to `admin/layout.js`'s) since it isn't covered by that layout's tree, and checks the role itself (`decodeJwtPayload(token)?.role !== 'admin'`) before fetching anything, the same belt-and-braces precedent Package 9's billing pages established for the Next.js layout/child-render leak (a parent layout rendering a restricted message instead of `{children}` does not stop a child `page.js`'s own Server Component from still executing its data fetches — see `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §9). A non-admin never triggers the real `GET /organisation-memory/` call at all.
- **Department memory** (`/portal/memory/department/:departmentId`) is deliberately *not* admin-gated at the page level — any org member can view it, matching the backend's own read rule. `AddDepartmentMemoryForm` is the one place a role check happens, client-side, via `useAuth().user.role !== 'admin'` returning `null` (the same convenience-gate posture `PortalNav.js` already uses for its own conditional Admin link) — a presentation-layer convenience, not the real enforcement, which stays backend-side.
- **Department management** (`/portal/admin/departments`) lives under the existing `/portal/admin` tree and its role-gating layout, but — following the same Package 9 precedent — also checks the role itself before fetching, rather than relying solely on the parent layout.
- **Worker memory** (`/portal/memory/:workerId`) is unchanged except for one additive section: a `MemorySummaryPanel` for that worker's own scope, using the exact same shared component the other two tiers use.

## 4. Memory retrieval for orchestration decisions & CTO integration (requirements #4, #8)

This is backend logic (`services/memory_retrieval_service.py`, wired into `services/cto_orchestration_service.py#execute_chain()` — see the backend report §6/§9) with one frontend surface: `CtoOrchestrationPanel.js` gained a short, factual note ("the executive synthesis now draws on each involved worker's own memory plus their department's memory; organisation-wide memory is included too when you... are an organisation admin") stating what already happens, matching Package G's own restrained "transparency without overbuilding" UI philosophy rather than adding a new control or visualisation the underlying mechanism doesn't need. This was verified true, not just documented — see §8's live admin-vs-member CTO chain check.

## 5. Governance-aware memory access (requirement #5)

The three-tier ladder (worker: open; department: read-open/write-admin; organisation: admin-only both ways) is enforced backend-side and surfaced consistently on the frontend:

- **Admin-only pages** (`/portal/memory/organisation`) show a restricted message and never fetch, for a non-admin.
- **Admin-only actions on an open page** (`AddDepartmentMemoryForm` on `/portal/memory/department/:id`) simply don't render for a non-admin, rather than rendering a form that would 403 on submit.
- **Admin-only cross-links** — the `/portal/memory` overview's "View Organisation Memory" / "Manage Departments" links only render when `decodeJwtPayload(token)?.role === 'admin'`, so a non-admin visiting that page never sees a link to a page they'd be turned away from.
- **Entitlement-gated actions** (any of the three new write/generate BFF routes, on a sub-Enterprise organisation) 403 for an admin too — this is a licence-tier gate, not a role gate, and every relevant form surfaces the backend's own message rather than assuming "admin" always means "allowed."

## 6. Memory summaries and long-term retention (requirement #6)

`MemorySummaryPanel.js` is the one new component built to be shared across all three tiers (`scope`/`scopeId` props), rather than three near-duplicate components — consistent with this codebase's own precedent for scope-parametrised shared UI. "Generate Summary" calls the real backend (a genuine Ollama call, verified live in §8, not mocked) and `router.refresh()`s to reload the server-fetched summary list afterward, the same pattern `AddMemoryForm`/`AddOrganisationMemoryForm`/`AddDepartmentMemoryForm` already use for their own submissions. No edit/delete affordance exists for a summary (or any raw memory) — per the backend's own additive-only retention model (§11 of the backend report).

## 7. Portal navigation and component/route conventions (requirement #7 — surfacing memory visibility)

- No new top-level `PortalNav` link was added — `/portal/admin/departments` follows the same convention as Users/Organisation/Permissions (reachable from within `/portal/admin`, not the main nav), and the two new `/portal/memory/*` sub-routes are reachable from the existing `/portal/memory` overview page and the worker/department detail pages themselves, the same "nested route, not a new nav entry" treatment Package 6 gave its own worker-detail sub-pages.
- The portal overview page's Memory card copy was updated to mention department/organisation memory and summaries, the same one-line update every prior package gave its own card.
- Every new route follows the exact `page.js`/`loading.js`/`error.js` triple every prior package established, and reuses `EmptyState`, `StatTile`, `.activity-list`/`.activity-title`/`.activity-meta`, `.assignment-row`, `.badge`, `.contact-form`, `.form-error`, `.btn`/`.btn-secondary`/`.btn-small` — all pre-existing classes. The only new CSS is three small rules (`.department-list-view`, `.memory-summary-panel`, `.memory-summary-list`), the same small-footprint discipline Package 6 established.

## 8. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, all new routes listed
                     (/portal/admin/departments, /portal/memory/organisation,
                     /portal/memory/department/[departmentId], and five new
                     /api/portal/* BFF routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 135, pass 135, fail 0
```

### Unit tests (135 total; 19 new for this package)

New: `lib/api/__tests__/{departments,organisationMemory,departmentMemory,memorySummaries}.test.js` (mocked-`global.fetch` style, matching every prior package) plus 8 new cases in `lib/api/__tests__/validation.test.js` for the four new parsers. All 116 tests from Packages 1–9/G pass unchanged.

### End-to-end smoke test (real backend, real Ollama — not mocked)

A temporary `teracom-ai-backend` instance (port 8001) and this frontend (port 3001, `BACKEND_API_URL` pointed at it) were started against the real dev Postgres and the genuinely-running local Ollama instance — no other dev servers were running at the time, confirmed beforehand. A temporary organisation, an admin user, a `member` user, one department, and one worker were created for this test and fully deleted again afterward, along with every memory/summary/execution/audit row and the seeded staff user; both temporary servers were stopped and confirmed down.

| Check | Result |
|---|---|
| Admin → `POST /api/portal/departments` | `200`; department created |
| Member → `POST /api/portal/departments` | `403` — admin-gated correctly |
| Admin → `PATCH /api/portal/workers/:id/department` | `200`; worker assigned |
| Admin → `GET /portal/admin/departments` | `200`; department name rendered from real data |
| Admin → `GET /portal/memory` | `200`; department link and both admin-only cross-links ("Manage Departments", "View Organisation Memory") present |
| Member → `GET /portal/memory` | `200`; identical page, **both** admin-only cross-links correctly absent |
| Admin → `POST /api/portal/organisation-memory` | `200`; memory stored |
| Member → direct `POST /organisation-memory/store` and `GET /organisation-memory/` | `403` on both — governance ladder confirmed at the backend, not just hidden in the UI |
| Admin → `GET /portal/memory/organisation` | `200`; the real stored memory content rendered |
| Member → `GET /portal/memory/organisation` | `200`; restricted message rendered, **no** fetch of the real (admin-only) content reached the page |
| Admin → `POST /department-memory/store`, Member → same | `200` admin / `403` member — write correctly admin-gated |
| Member → `GET /portal/memory/department/:id` | `200`; the admin-written memory rendered — read correctly open to any member |
| Admin → `POST /api/portal/memory-summaries` (worker scope, no memories yet) | `400 {"error": "No memories exist for this scope yet."}` |
| Admin → same, after adding a worker memory | `200`; a real, coherent Ollama-generated summary, condensing the one stored fact |
| Admin → `POST /memory-summaries/generate` (organisation scope) | `200`; a real summary correctly condensing both the organisation- and department-tier facts already stored |
| Member → same (organisation scope) | `403` |
| **CTO chain, admin-triggered**, real Ollama, department+organisation memory present | Individual hop hallucinated "New York City" for head office; **executive synthesis correctly overrode it to "Sydney"** (the real organisation-tier fact) and correctly kept "Dell servers" (the department-tier fact) — direct, reproduced confirmation that organisation-tier memory reaches the synthesis for an admin |
| **Same CTO chain, member-triggered** | Executive synthesis correctly picked up "Dell servers" (department tier, open to members) but **did not** correct the hallucinated head-office location — organisation-tier memory correctly excluded for a non-admin trigger |
| `GET /portal/cto` | `200`; the new memory-hierarchy note rendered |

---

## 9. Files changed

### New files

```
lib/api/departments.js                                       fetchDepartments / fetchDepartment / createDepartment / assignWorkerDepartment
lib/api/organisationMemory.js                                 fetchOrganisationMemories / storeOrganisationMemory
lib/api/departmentMemory.js                                    fetchDepartmentMemories / storeDepartmentMemory
lib/api/memorySummaries.js                                     fetchMemorySummaries / generateMemorySummary
lib/api/__tests__/departments.test.js                           unit tests
lib/api/__tests__/organisationMemory.test.js                    unit tests
lib/api/__tests__/departmentMemory.test.js                      unit tests
lib/api/__tests__/memorySummaries.test.js                       unit tests

app/api/portal/departments/route.js                            POST → createDepartment() BFF proxy
app/api/portal/workers/[workerId]/department/route.js            PATCH → assignWorkerDepartment() BFF proxy
app/api/portal/organisation-memory/route.js                     POST → storeOrganisationMemory() BFF proxy
app/api/portal/department-memory/route.js                      POST → storeDepartmentMemory() BFF proxy
app/api/portal/memory-summaries/route.js                        POST → generateMemorySummary() BFF proxy

app/portal/(protected)/admin/departments/page.js                 department management (Server Component, admin-gated)
app/portal/(protected)/admin/departments/loading.js              Suspense fallback
app/portal/(protected)/admin/departments/error.js                error boundary safety net
app/portal/(protected)/memory/organisation/page.js                organisation memory view (Server Component, admin-gated)
app/portal/(protected)/memory/organisation/loading.js             Suspense fallback
app/portal/(protected)/memory/organisation/error.js               error boundary safety net
app/portal/(protected)/memory/department/[departmentId]/page.js    department memory view (Server Component)
app/portal/(protected)/memory/department/[departmentId]/loading.js Suspense fallback
app/portal/(protected)/memory/department/[departmentId]/error.js   error boundary safety net

components/portal/CreateDepartmentForm.js                       admin department creation (client)
components/portal/DepartmentListView.js                          department + worker-assignment list (server)
components/portal/AssignWorkerDepartmentControl.js               per-worker department dropdown (client)
components/portal/OrganisationMemoryView.js                     read-only organisation memory list (server)
components/portal/AddOrganisationMemoryForm.js                    manual organisation memory entry (client)
components/portal/DepartmentMemoryView.js                       read-only department memory list (server)
components/portal/AddDepartmentMemoryForm.js                     manual department memory entry, admin-only render (client)
components/portal/MemorySummaryPanel.js                          shared generate/view summary panel, all three scopes (client)

docs/backend/PHASE_0_PACKAGE_H_MEMORY_INTELLIGENCE_IMPLEMENTATION_REPORT.md   backend report
docs/frontend/IMPLEMENTATION_REPORTS/MEMORY_INTELLIGENCE_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/validation.js` | Added `parseDepartmentPayload`, `parseOrganisationMemoryPayload`, `parseDepartmentMemoryPayload`, `parseMemorySummaryRequestPayload` | Requirements #1/#2/#6 |
| `lib/api/__tests__/validation.test.js` | 8 new test cases for the above | Test coverage |
| `components/portal/CtoOrchestrationPanel.js` | +1 short factual note on the memory hierarchy now feeding synthesis | Requirement #8 |
| `app/portal/(protected)/memory/page.js` | Added a Departments index + admin-only Organisation Memory/Manage Departments cross-links | Requirements #1/#2/#7 |
| `app/portal/(protected)/memory/[workerId]/page.js` | Added a `MemorySummaryPanel` for worker scope | Requirement #6 |
| `app/portal/(protected)/page.js` | Updated the Memory card's copy | Requirement #7, same treatment every prior package gave its own card |
| `app/globals.css` | +5 lines, additive only | `.department-list-view`/`.memory-summary-panel`/`.memory-summary-list` classes |

No file from Packages 1–9/G was changed in behaviour beyond the `CtoOrchestrationPanel` note and the `/portal/memory`/`/portal/memory/[workerId]`/portal-overview additions above — every other pre-existing component, page, and `lib/api/*` module is reused exactly as it was.

---

## 10. Remaining risks / follow-ups

1. **No user↔department or user↔worker membership model exists.** "Department member" read access is, in practice, "member of the owning organisation" — a real member of a completely unrelated department can still read a department's memory once entitled. Not a frontend gap: this frontend accurately reflects backend behaviour rather than building a UI implying a finer-grained membership check that doesn't exist. See backend report §1/§11.
2. **No memory row of any kind (worker, department, organisation, or summary) can ever be corrected or removed once created.** Same standing limitation Package 6 already flagged for `WorkerMemory`, now extended in kind (not compounded in severity) to the two new tiers and to summaries. A wrong or stale entry is permanent from this app's perspective.
3. **Department is not yet a CTO delegation-routing signal**, only a memory-scoping one — `_pick_worker_for_subtask()`'s keyword-overlap heuristic is unchanged, so assigning a worker to a department does not currently influence which worker a CTO plan picks for a subtask.
4. **All risks carried over from Packages 1–9/G remain unchanged** (no chat session resumability, no worker-update/delete endpoint, the `DELETE /documents/{id}` FK-violation bug, etc.) — see the respective prior reports. None are specific to or worsened by this package.

---

## 11. Recommended next package

With Package H, every layer of the target architecture (Human → Orchestrator → Department Heads → Workers) now has a corresponding memory tier and a governance rule for it. The clearest next step is closing risk #2 above at the source — a real update/delete (or explicit archive) endpoint for `WorkerMemory` (and, now, the two new tiers) — since every package touching memory since Package 6 has carried this same gap forward without addressing it. A second, smaller candidate is using department assignment as an actual CTO delegation signal (risk #3), now that the data model to do so finally exists.
