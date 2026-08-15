# Knowledge Implementation Report — Frontend Package 4

**Scope:** Package 4 — Knowledge only, per `FRONTEND_ARCHITECTURE_V1.md` §C.8.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance as both an admin and a non-admin (`member`) user.
**Depends on:** Package 1 (Authentication), Package 2 (Dashboard), Package 3 (Workers) — the session cookie, `getSessionToken()`/`decodeJwtPayload()`, `AuthProvider`, `PortalNav`, `StatTile`, `EmptyState`, `settle`/`errorMessage`/`isForbidden`, the BFF-proxy pattern, and `lib/api/workers.js`'s `fetchKnowledgeCatalogue`/`fetchWorkerList`/`fetchWorkerKnowledge` are all reused as-is, unchanged.
**Out of scope (unchanged, not implemented):** Chat, Memory (standalone cross-worker browser), Administration, Billing & Licensing, and Knowledge connectors (SharePoint/OneDrive/Teams "coming soon" — that's Package 8 in this project's own numbering, a separate package from Knowledge; see `FRONTEND_STATUS.md`'s package table).

---

## 1. What was built

Per §C.8 and Part E step 4 ("Knowledge management, excluding connectors: list, upload, detail"):

| Route | Purpose |
|---|---|
| `/portal/knowledge` | Document list — stat chips, semantic search, client-side search/filter, empty state, Upload CTA |
| `/portal/knowledge/upload` | Multipart upload form (worker picker + file) with an upload-activity side panel |
| `/portal/knowledge/:documentId` | Document detail — full content, assigned-workers (read-only), reindex/delete actions |
| `POST /api/portal/knowledge/upload` | Same-origin BFF proxy → `POST /upload/` (multipart) |
| `DELETE /api/portal/knowledge/:documentId` | Same-origin BFF proxy → `DELETE /documents/{id}` |
| `POST /api/portal/knowledge/:documentId/reindex` | Same-origin BFF proxy → `POST /documents/reindex/{id}` |
| `POST /api/portal/knowledge/search` | Same-origin BFF proxy → `POST /search/` |

Connectors (`/portal/knowledge/connectors`) were **not** built — confirmed against `docs/frontend/FRONTEND_STATUS.md`'s package table, where Connectors is Package 8, a separate line item from Knowledge (Package 4). This isn't a scope gap; it's a different package.

### Backend calls, verified against the actual `teracom-ai-backend` source (not just the architecture doc)

Before writing any code, the actual backend repository (a sibling directory, not normally checked into this one, but available locally) was read directly — `api/knowledge.py`, `api/documents.py`, `api/upload.py`, `api/search.py`, their services and Pydantic schemas — rather than trusting the architecture doc's description alone. This surfaced two real discrepancies from what §C.8 implies, both handled below:

| Backend call | Used for | Exact response shape (confirmed from source) |
|---|---|---|
| `GET /knowledge/` | Full document catalogue | Array of `{id, organisation_id, title, content, source}` — reused via `lib/api/workers.js#fetchKnowledgeCatalogue`, not re-declared (see §2) |
| `GET /knowledge-summary/` | "Total Documents" stat | `{total_documents: N}` |
| `GET /knowledge-growth/` | "Knowledge Growth" stat | `{total_knowledge: N}` — **same underlying query as knowledge-summary** (see §6, risk 1) |
| `GET /knowledge-assignments/summary` | "Worker Assignments" stat | `{total_assignments: N}` |
| `GET /documents/{id}` | Document detail | The raw `Knowledge` row, ownership-checked via `get_owned_knowledge` (404/403, same pattern as `get_owned_worker`) |
| `DELETE /documents/{id}` | Delete action | `{deleted: bool}` — **not role-gated**, only `get_current_user` (see §4) |
| `POST /documents/reindex/{id}` | Reindex action | `{reindexed: bool}` — likewise not role-gated |
| `POST /upload/` | Upload | Multipart (`worker_id` Form + `file` File); response is `{filename, status}` **with no document id** (see §3) |
| `GET /upload-history/` | Upload page side panel | Array of `Knowledge` rows where `source == "upload"` |
| `GET /upload-metrics/` | Upload page side panel | `{uploaded_documents: N}` |
| `POST /search/` | Semantic search | `{results: [{id, title, snippet, distance}]}` (Chroma + sentence-transformers, org-scoped) |

No call was made to `POST /knowledge/` (the admin-only manual title/content/source create endpoint) — §C.8 doesn't call for a manual-create form, only upload, and building a second creation path the architecture doesn't ask for would duplicate Upload's job.

---

## 2. Reusing `fetchKnowledgeCatalogue`, not re-declaring it

Package 3 (Workers) already added `fetchKnowledgeCatalogue(token)` → `GET /knowledge/` to `lib/api/workers.js`, as the data source for the "assign existing knowledge to this worker" picker. That is the exact same endpoint and exact same shape this package's list page needs. Rather than add a second, identical `fetchKnowledgeList()` to the new `lib/api/knowledge.js`, the list page imports `fetchKnowledgeCatalogue` directly from `lib/api/workers.js`. This is a direct instance of the task's "reuse existing workers implementation" instruction, not just a general preference — `lib/api/knowledge.js` only adds the functions Workers didn't already have.

---

## 3. Upload response has no document id — a real backend constraint, not a frontend gap

`schemas/upload.py#UploadResponse` is `{filename: str, status: str}` only. `api/upload.py#upload_file` never returns the id of the `Knowledge` row `knowledge_ingestion_service.ingest_document()` creates. This was verified directly against the source before building `UploadKnowledgeForm`, not assumed from the architecture doc (which says a "post-success redirect to the new document's detail page" — not achievable with this response shape).

`UploadKnowledgeForm` therefore shows an inline success banner ("Uploaded `X` — knowledge created, assigned and indexed (N chars)") rather than attempting a redirect it cannot correctly target. The user can immediately see the new document by scrolling to `/portal/knowledge`'s list (the file input clears and the form stays on the page). This is the same kind of honest, backend-shape-driven limitation Package 3's `EditWorkerForm` already established a precedent for, not a bug.

---

## 4. Delete/Reindex are not role-gated backend-side — and a real backend defect found during smoke testing

`api/documents.py`'s `DELETE /documents/{id}` and `POST /documents/reindex/{id}` both depend only on `get_current_user` — **no `require_role` check at all**, unlike worker creation. Any authenticated org member can delete or reindex any document in their organisation via the real API.

`DocumentActions` still restricts the **Delete** button to admins in the UI (`canDelete` prop, sourced from the session JWT's `role` the same way Package 3 gated Worker creation/edit) as a presentation-only product convention for a destructive action — not a security boundary, since the backend doesn't enforce one here. **Reindex** (non-destructive, idempotent) is left available to every authenticated user, matching the backend's actual permissiveness rather than adding an unbacked restriction for a safe action. This was verified live: a `member` account's detail page shows Reindex but not Delete, while `POST /api/portal/workers` (Package 3's proxy) — a genuinely backend-enforced action — correctly still 403s for that same account, contrasting the two.

**Real bug found and characterized (not fixed — out of this frontend's authority):** `services/document_management_service.py#delete_document()` calls `db.delete(document); db.commit()` directly, with no cleanup of dependent `knowledge_permissions` rows first. Deleting a document while it is still assigned to at least one worker throws `sqlalchemy.exc.IntegrityError` (`ForeignKeyViolation` on `knowledge_permissions_knowledge_id_fkey`), which FastAPI's default handler turns into a bare `500 {"error": "Internal Server Error"}`. Since `POST /upload/` **always** assigns the document to a worker as part of ingestion, **every uploaded document is undeletable via `DELETE /documents/{id}` until its assignment is removed first** (via the relevant worker's Knowledge tab → Remove, from Package 3).

Verified the full mechanics live:
1. Uploaded a document assigned to a worker → `DELETE /api/portal/knowledge/:id` → `500 {"error": "Internal Server Error"}`, document still present afterward (transaction rolled back cleanly, no partial/corrupted state).
2. Removed the worker's assignment via Package 3's existing `DELETE /api/portal/workers/:workerId/knowledge` route → `200 {"removed": true}`.
3. Retried the same delete → `200 {"deleted": true}`, document gone from the list.

`DocumentActions` already surfaces whatever the backend returns as a `.form-error` banner (requirement #8), so this real 500 renders as a clear inline error rather than crashing the page or silently failing — the error-handling path was exercised against a genuine backend defect during smoke testing, not just a simulated failure. No frontend workaround (e.g. silently removing assignments before deleting) was added, since that would be a surprising, undocumented side effect of clicking "Delete" — this is flagged as a backend fix (`delete_document` should delete `knowledge_permissions` rows for the document first, in the same transaction) in §6.

---

## 5. Knowledge assignments (requirement #4) — read-only, computed from the worker side

`teracom-ai-backend` has no "which workers is this document assigned to" endpoint — only the reverse, `GET /worker-knowledge/{worker_id}` (Package 3). The document detail page computes the relationship itself: fetch the org's worker list (`fetchWorkerList`), then each worker's assigned-knowledge list (`fetchWorkerKnowledge`, already built), and keep the workers whose list contains this document's id. `KnowledgeAssignedWorkers` renders the result read-only, linking to each worker's own page — **mutating** an assignment stays exclusively a Worker-page action (`WorkerKnowledgeAssignment`, unchanged), so there is exactly one place in the app that does it, not two competing entry points for the same write.

This is an N+1 fan-out (one call per worker in the org), bounded by worker count. At the data volumes this project currently has (a handful of workers per org, §B.5.7's standing "no pagination anywhere" note), this is an acceptable, deliberate cost for a real read the backend has no bulk endpoint for — verified live that a worker with a real assignment shows up correctly (§1's smoke test). Flagged in §6 as a scale consideration, same treatment §B.5.7 already gives every other unpaginated list in this app.

---

## 6. Loading, empty, and error states (requirements #7–#9)

| State | Mechanism |
|---|---|
| **Loading** | `loading.js` for `/portal/knowledge`, `/portal/knowledge/upload`, and `/portal/knowledge/:documentId` — the same skeleton-tile Suspense-fallback convention `dashboard/loading.js` and the Workers package established. |
| **Error (per-section)** | List and upload pages fire their backend calls with `Promise.allSettled` + the existing `settle()`/`errorMessage()` helpers — one endpoint failing (e.g. `knowledge-growth`) renders a `.form-error` banner in that stat tile's place only, the rest of the page still renders. |
| **Error (whole-page, not-found)** | If `GET /documents/{id}` 404s or 403s (ownership check), the detail page shows one "Document not found" message, collapsing both statuses into the same copy so a cross-tenant id can't be distinguished from a nonexistent one — same precedent as the Workers detail page. |
| **Error (safety net)** | `error.js` for all three routes, same `reset()`-button pattern as every prior package. |
| **Error (destructive action failure)** | `DocumentActions` surfaces delete/reindex failures inline — verified against the real backend 500 in §4. |
| **Empty (no documents at all)** | `EmptyState` inside `KnowledgeListView`, prompting upload. |
| **Empty (search/filter yields nothing)** | A second, distinct `EmptyState` for "no documents match your search" — different situation from "none exist," same distinction Package 3's `WorkerListView` already drew. |
| **Empty (semantic search, no matches)** | `EmptyState` inside `KnowledgeSearch`, shown only after a real query returns zero results (not shown before any search has been run). |
| **Empty (no workers to upload to)** | `UploadKnowledgeForm` renders a note instead of a broken picker if the org has zero workers — upload always requires a target worker. |
| **Empty (no uploads yet)** | `EmptyState` in the upload page's side panel. |
| **Empty (document has no assigned workers)** | `EmptyState` inside `KnowledgeAssignedWorkers`. |

---

## 7. Search and filtering (requirement #6) — two distinct mechanisms, deliberately not merged

- **Client-side filter** (`KnowledgeListView`) — substring match on title/content plus a source dropdown, filtering the already-fetched array in the browser. Same rationale as Package 3's `WorkerListView`: `GET /knowledge/` accepts no query parameters at all (§B.5.7), so this is the only option for filtering the full list, and is fine at current per-organisation volumes.
- **Semantic search** (`KnowledgeSearch`) — a real call to `POST /search/` (Chroma vector search), returning ranked results with title/snippet/distance. This is the one genuinely new interaction pattern §C.8 calls for, and it is intentionally kept separate from the list filter rather than merged into one search box, since they query fundamentally different things (a substring match over local data vs. a semantic similarity search against the backend) and conflating them would misrepresent what either one actually does.

Verified live: uploaded a document containing "Acme Corp supplies CCTV cameras..." and queried "CCTV camera pricing" — returned the correct document with a real distance score (`0.573`), not a stub.

---

## 8. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, 27 routes (including /portal/knowledge,
                     /portal/knowledge/upload, /portal/knowledge/[documentId], and the
                     four new /api/portal/knowledge* proxy routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 59, pass 59, fail 0
```

### Unit tests (59 total; 14 new for this package)

New this package: `lib/api/knowledge.js` (10 functions — every fetch/mutation call, including the FormData-body upload path), `lib/api/validation.js#parseSearchQuery`, and one new `lib/api/client.js` test (`backendFetch` sends a `FormData` body as-is, with no `Content-Type` override, so the browser/undici sets the multipart boundary). All 45 tests from Packages 1–3 pass unchanged.

`lib/api/client.js#backendFetch` gained FormData support: when `body instanceof FormData`, it is sent as-is (no `JSON.stringify`, no forced `Content-Type` header) instead of always JSON-encoding. This is the one change to a pre-existing shared module in this package, and it's additive — every existing JSON caller is unaffected (verified by all pre-existing tests still passing).

### End-to-end smoke test (real backend, not mocked)

`teracom-ai-backend` was started locally against the existing Postgres instance (the same real backend Packages 1–3 were validated against). A temporary organisation, two temporary users (`admin`, `member`), one temporary worker, and one temporary uploaded document were created for this test and fully deleted again afterward (the document via the real delete flow itself, once its assignment was removed — see §4).

| Check | Result |
|---|---|
| `GET /portal/knowledge`, `/upload`, `/:id` with no session | `307` → `/portal/login?next=...`, preserved for all three including the two-level-deep detail route |
| Admin → `GET /portal/knowledge` (empty org) | `200`; "No knowledge documents yet" empty state, all three stat tiles render (`0`/`0`/`0`) |
| Admin → `GET /portal/knowledge/upload` | `200`; worker picker populated with the real created worker, "No uploads yet" side panel |
| Admin → `POST /api/portal/knowledge/upload` (multipart, real `.txt` file, curl — same shape `UploadKnowledgeForm` sends) | `200`; `{"filename": "vendor-pricing.txt", "status": "knowledge created, assigned and indexed (140 chars)"}` |
| Admin → `GET /portal/knowledge` again | `200`; new document now appears in the list |
| Admin → `GET /portal/knowledge/:id` | `200`; full content rendered, "Estimator / Estimation Assistant" correctly shown under Assigned Workers (the N+1 reverse lookup, §5), Reindex and Delete Document both visible |
| Admin → `POST /api/portal/knowledge/:id/reindex` | `200`; `{"reindexed": true}` |
| Admin → `POST /api/portal/knowledge/search` `{"query": "CCTV camera pricing"}` | `200`; real Chroma result with correct title, snippet, and a genuine distance score |
| Admin → `DELETE /api/portal/knowledge/:id` (document still assigned to a worker) | `500 {"error": "Internal Server Error"}` — the real backend FK-violation bug from §4, surfaced cleanly rather than crashing |
| Admin → remove the worker's knowledge assignment, then retry delete | `200 {"removed": true}`, then `200 {"deleted": true}` — document gone from the list |
| Member (non-admin) → `GET /portal/knowledge/:id` | `200`; Reindex visible, Delete Document **not** rendered |
| Member → upload a document | Succeeds — upload is correctly not admin-gated, matching the backend's actual permission model (§4) |
| Upload with a `.exe` file | `400 {"error": "File type '.exe' is not allowed. Allowed types: .docx, .pdf, .txt"}` — backend's real validation message surfaced as-is |
| Upload with a nonexistent `worker_id` | `404 {"error": "Worker not found"}` — backend's ownership check surfaced as-is |
| `GET /portal/knowledge/:bogus-uuid` | `200`; "Document not found" message, not a crash or a raw 404 |

---

## 9. Files changed

### New files

```
lib/api/knowledge.js                                       fetchKnowledgeSummary / fetchKnowledgeGrowth /
                                                             fetchKnowledgeAssignmentsSummary / fetchDocument /
                                                             deleteDocument / reindexDocument /
                                                             fetchUploadHistory / fetchUploadMetrics /
                                                             uploadKnowledgeDocument / semanticSearch
lib/api/__tests__/knowledge.test.js                         unit tests (mocks global.fetch)

app/api/portal/knowledge/upload/route.js                    POST → uploadKnowledgeDocument() BFF proxy
app/api/portal/knowledge/[documentId]/route.js               DELETE → deleteDocument() BFF proxy
app/api/portal/knowledge/[documentId]/reindex/route.js        POST → reindexDocument() BFF proxy
app/api/portal/knowledge/search/route.js                     POST → semanticSearch() BFF proxy

app/portal/(protected)/knowledge/page.js                     document list (Server Component)
app/portal/(protected)/knowledge/loading.js                  Suspense fallback
app/portal/(protected)/knowledge/error.js                    error boundary safety net
app/portal/(protected)/knowledge/upload/page.js               upload form + upload-activity panel
app/portal/(protected)/knowledge/upload/loading.js             Suspense fallback
app/portal/(protected)/knowledge/upload/error.js               error boundary safety net
app/portal/(protected)/knowledge/[documentId]/page.js          document detail (Server Component)
app/portal/(protected)/knowledge/[documentId]/loading.js        Suspense fallback
app/portal/(protected)/knowledge/[documentId]/error.js          error boundary safety net

components/portal/KnowledgeCard.js                          list card (mirrors WorkerCard.js)
components/portal/KnowledgeListView.js                       client-side search/filter (mirrors WorkerListView.js)
components/portal/KnowledgeSearch.js                         semantic search box + result cards
components/portal/UploadKnowledgeForm.js                     multipart upload form
components/portal/DocumentActions.js                         reindex/delete buttons
components/portal/KnowledgeAssignedWorkers.js                 read-only reverse-assignment list

docs/frontend/IMPLEMENTATION_REPORTS/KNOWLEDGE_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/client.js` | `backendFetch` now sends a `FormData` body as-is (no `JSON.stringify`, no `Content-Type` override) instead of always JSON-encoding | Requirement — `POST /upload/` is multipart; every other caller is unaffected (all pre-existing tests still pass) |
| `lib/api/validation.js` | Added `parseSearchQuery` | Requirement #6 — rejects a blank search submission before it reaches the backend, same dependency-free/testable style as `parseWorkerPayload` |
| `components/portal/PortalNav.js` | Added a "Knowledge" link; comment updated to note Knowledge is the second section (after Workers) with nested routes | Requirement #10 |
| `app/portal/(protected)/page.js` | Knowledge placeholder card now links to `/portal/knowledge`; hero copy updated to say Knowledge is ready, not "being rolled out" | Requirement #10, same treatment Packages 2–3 gave their own cards |
| `app/globals.css` | +8 lines, additive only | New `.stat-grid-3`, `.assign-form input[type="search"]`, `.document-content`, `.document-actions`, `.search-results li` classes, all built from the existing token set. No existing rule was changed. |

No file from Packages 1–3 was changed in behaviour beyond the `backendFetch` FormData addition above — `lib/api/auth.js`, `middleware.js`, `app/portal/(protected)/layout.js`, `AuthProvider`, `StatTile`, `EmptyState`, `lib/api/results.js`, `lib/api/workers.js`, and every Workers component are all reused exactly as they were.

---

## 10. Remaining risks / follow-ups

1. **`GET /knowledge-summary/` and `GET /knowledge-growth/` return the identical count today** (`total_documents` and `total_knowledge` are the same `COUNT(*)` query — `services/knowledge_summary_service.py` and `services/knowledge_growth_service.py` are functionally identical). §C.8 explicitly says to include both ("cheap to include, no reason to omit"), so both are called and shown as distinct stat tiles, but "Knowledge Growth" isn't actually a growth-over-time metric yet — it would need a real time-windowed query backend-side (and a `created_at` column, which per Package 2's report doesn't exist on any table) to mean something different from the total count. Flagged here rather than silently treating the two numbers as if they measured different things.
2. **`DELETE /documents/{id}` throws an unhandled `IntegrityError` → bare 500 for any document still assigned to a worker** (§4) — a real backend defect, not fixed here (out of this frontend task's authority; `services/document_management_service.py#delete_document()` needs to delete the document's `knowledge_permissions` rows in the same transaction before deleting the `Knowledge` row itself, or the `DELETE /documents/{id}` route needs to reject with a clear 409 "still assigned" instead of letting the DB throw). The frontend surfaces whatever the backend returns rather than masking it, so this is fully visible/reproducible today, not silently broken.
3. **The "assigned workers" reverse lookup is an N+1 fan-out** (§5) — one `GET /worker-knowledge/{id}` call per worker in the org, run from the document detail page. Bounded and acceptable at today's scale; would need a real `GET /knowledge/{id}/workers`-shaped endpoint backend-side if organisations grow to have many dozens of workers.
4. **Delete/Reindex role gating is presentation-only**, since the backend enforces no role check on either (§4) — consistent with §C.5's standing "frontend gating is not a security boundary" position, verified live that a non-admin can still reach both via a direct API call regardless of what the UI shows.
5. **No pagination on `GET /knowledge/`, `GET /upload-history/`, or the per-worker knowledge lookups** — same standing §B.5.7 gap every prior package has carried, not worsened or newly introduced here.
6. **All risks carried over from Packages 1–3 remain unchanged** (no CORS middleware on the backend, no refresh token, single-process login rate limiter, no worker-update endpoint, etc.) — see the Authentication, Dashboard, and Workers reports. None are specific to or worsened by this package.

None of the above block Package 5 (Chat) from starting — the BFF-proxy pattern now covers a multipart-body case in addition to JSON (reusable for any future file-upload need), and the "reverse relationship computed from an existing per-item endpoint" technique from §5 is directly reusable wherever Chat needs to show, e.g., which workers a session belongs to.
