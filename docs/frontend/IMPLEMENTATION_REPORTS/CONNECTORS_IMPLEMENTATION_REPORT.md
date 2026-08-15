# Knowledge Connectors Implementation Report — Frontend Package 8

**Scope:** Package 8 — Knowledge Connectors only, per `FRONTEND_ARCHITECTURE_V1.md` §C.8.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance as both an admin and a non-admin (`member`) user.
**Depends on:** Package 1 (Authentication), Package 4 (Knowledge) — the session cookie, `getSessionToken()`, `AuthProvider`, `PortalNav`, `EmptyState`, `errorMessage`, the BFF-proxy pattern, and the existing `/portal/knowledge` list page are all reused as-is, unchanged.
**Out of scope (unchanged, not implemented):** Billing & Licensing.

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/portal/knowledge/connectors` | Connector status overview — SharePoint, OneDrive, Teams, each a disabled "coming soon" card |

No BFF proxy route was added — this package is entirely read-only (a single `GET` call), with no client-initiated mutation of any kind, since (§2) there is no reachable action to trigger.

This matches §C.3's route (`/portal/knowledge/connectors`) and §C.8's explicit instruction exactly: "disabled 'coming soon' cards, matching the real backend state... rather than implying a working OAuth connect flow that doesn't exist."

---

## 2. Backend verification performed before writing any code

Per this task's explicit instruction, `api/connectors.py` and `api/connector_status.py` were read directly, along with `services/connector_status_service.py` and every file under `services/connectors/` — before any frontend code was written, continuing the same discipline every package since Package 4 has applied.

### Confirmed exactly as the architecture doc describes

- `GET /connector-status/` → `{sharepoint: "available", onedrive: "available", teams: "available"}` — a hardcoded literal (`services/connector_status_service.py#connector_status()`), not derived from any real check.
- `GET /connectors/{sharepoint,onedrive,teams}` → three near-duplicate endpoints, each returning `{connector: "<name>", status: "available"}` for that one connector — the identical shape as the aggregate endpoint, one connector at a time.
- Confirmed: **100% stub, no OAuth, no Microsoft Graph call, no real sync of any kind anywhere in the request path.**

### New findings, not stated by the architecture doc (found by reading source, exactly as this task instructed)

1. **None of the four connector-related endpoints are role-gated or organisation-scoped.** All four depend only on `get_current_user` — no `require_role`, and critically, **the response never reads `current_user["organisation_id"]` at all**. Every organisation and every user sees the byte-for-byte identical response. This is different from every other "read" endpoint in this app (worker lists, knowledge lists, memory, permissions), which are all at least filtered to the caller's own organisation even when not role-gated. Verified live: an admin and a non-admin account in the same freshly-created test organisation both received the identical `{"sharepoint": "available", ...}` payload.
2. **`services/connectors/{sharepoint,onedrive,teams}_connector.py` define a `SharePointConnector`/`OneDriveConnector`/`TeamsConnector` class each, with real-looking `connect()` and `sync()` methods** (`connect()` returns `{connector, status: "connected"}`, `sync()` returns `{connector, status: "sync_started"}`) — but **these classes are never instantiated or imported anywhere outside their own directory**, confirmed by grepping the entire backend for `SharePointConnector`, `OneDriveConnector`, `TeamsConnector`, and `from services.connectors` — zero matches outside `services/connectors/` itself. `api/connectors.py` and `api/connector_status.py` return their hardcoded literals directly; they do not call these classes at all. This is not merely "no OAuth implemented inside the methods" — the methods themselves are entirely unreachable from any HTTP route.
3. **Even `BaseConnector.status()` — the one method that would represent real status if it were used — returns `{"status": "not_implemented"}`, and no subclass overrides it.** This directly contradicts the "available" every live endpoint claims: the actual connector-class hierarchy's own honest answer, if it were ever wired up, would be "not implemented," not "available." The live API's "available" comes from a completely separate, hardcoded dict in `connector_status_service.py` that bypasses this class hierarchy entirely.

**Consequence for this package's design:** there is no reachable endpoint for "connect," "disconnect," or "sync" — only three near-identical status-reporting endpoints exist, and all three report a status that has no relationship to any real integration state. This confirms requirement #4 (disabled "coming soon" cards) is not just the safer choice but the *only* choice that doesn't misrepresent what the backend can do — a "Connect" button, even a disabled one with no handler, would still imply a connect action exists to eventually enable; none does anywhere in this backend today.

---

## 3. UX Vision rubric applied (per `docs/governance/UX_VISION.md` §6)

`docs/governance/UX_VISION.md` (approved 2026-08-15, ADR-012) states Package 8 onward should be evaluated against its three-tier rubric (natural language → wizard → form) before defaulting to a form, and that the outcome should be recorded here (§6 rule 5).

Applying the rubric: **none of the three tiers apply, because there is no task to accomplish.** Natural language and wizards are both ways of *guiding a user through taking an action*; per §2, no connector action (connect, sync, configure) is reachable through any backend endpoint at all. A wizard for connecting SharePoint would have to walk a user through an OAuth flow that doesn't exist, and "ask a worker to connect SharePoint" would have nothing for the backend to act on. This page is a **read-only status display**, not a form, wizard, or NL surface — it was not built as a form because building a form was the fastest option; it has no input fields, no submission, and no actionable UI element beyond a single, genuinely-disabled button per card. This is recorded here as this package's rubric outcome: **not applicable to any of the three tiers — a status view with no available action**, and worth revisiting only once (if) a real connect flow is built backend-side, at which point the wizard tier would be the natural fit for walking a user through OAuth.

---

## 4. Connector overview, status views, management interface (requirements #1–#3)

- **Overview** (`/portal/knowledge/connectors`): a single `GET /connector-status/` call (the canonical aggregate source — the three near-duplicate per-connector endpoints are deliberately not called, the same "pick one, don't call every near-duplicate" principle Package 2 established for the dashboard's five overlapping aggregates) renders one card per connector.
- **Status views**: each `ConnectorCard` shows the backend's own literal status string ("available") alongside a "Coming Soon" badge and explanatory copy — the raw backend value is shown for transparency (not hidden), but is not treated as or labelled "connected"/"working," since §2 established it means nothing about real integration state.
- **Management interface**: given §2/§3, the only honest "management interface" is a clearly-disabled affordance with an explanation, not a working connect/configure flow. Each card's action button has the HTML `disabled` attribute (verified live — not just CSS-dimmed, a genuinely non-interactive element) and reads "Not Yet Available."
- The connector list itself is **derived from the response object's keys** (`Object.entries(statuses)`), not a hardcoded `['sharepoint', 'onedrive', 'teams']` array in the frontend — if the backend ever adds or removes a connector, this page reflects that automatically rather than silently drifting out of sync. Known connector ids (`sharepoint`, `onedrive`, `teams`) get a curated label/description; any unrecognised id still renders with a sensible title-cased fallback rather than breaking.

---

## 5. Disabled/"coming soon" cards, loading, error, empty states (requirements #4, #5–#7)

| State | Mechanism |
|---|---|
| **Disabled card** | `ConnectorCard` — dimmed (`.connector-card{opacity:.7}`), a "Coming Soon" badge, and a genuinely `disabled` button, not a styled-to-look-disabled link. |
| **Loading** | `loading.js` — the same skeleton-tile Suspense-fallback convention every prior package established. |
| **Error** | An inline `.form-error` banner if `GET /connector-status/` itself fails (network/5xx), plus `error.js` as the safety-net boundary for a genuinely unexpected exception — same two-layer pattern every prior package uses. |
| **Empty** | If the response object has no keys at all (not expected given the hardcoded backend, but not assumed away either — see below), `EmptyState` renders "No connectors are registered" rather than a blank grid. |

The empty-state path is not purely theoretical box-ticking: because the connector list is derived from the response's own keys rather than a hardcoded frontend array, an empty `{}` response — which nothing in the current backend produces, but nothing prevents either — is a real, reachable code path this page handles correctly, verified by inspection of the conditional logic (`connectors.length === 0`), not left as a dead branch.

---

## 6. Portal navigation integration, component and route conventions (requirements #8–#9)

- **No new top-level `PortalNav` entry was added.** Per `FRONTEND_ARCHITECTURE_V1.md` §C.3, `/portal/knowledge/connectors` is a nested sub-route of Knowledge (the same relationship `/portal/knowledge/upload` already has, built in Package 4), not a sibling top-level domain like Workers/Chat/Memory/Admin. `PortalNav`'s existing "Knowledge" link already highlights as active on this route with zero code changes — its `isActive()` check (`pathname.startsWith('/portal/knowledge/')`) was already generic, verified live.
- **Integration point**: a "Connectors" button was added to `/portal/knowledge`'s hero actions, alongside the existing "Upload Document" button — the same place and visual treatment Package 4 used to surface its own sub-page.
- Every convention from prior packages is reused as-is: the `page.js`/`loading.js`/`error.js` triple, `.product-grid`/`.product-card` (via `ConnectorCard`), `.badge`, `EmptyState`, `errorMessage()`. Four small, additive CSS rules were needed (`.connector-card`, `.connector-card .btn:disabled`, `.connector-status`, `.connector-status span`) for the dimmed/disabled visual treatment requirement #4 explicitly calls for — no existing rule was changed.

---

## 7. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, 38 routes (including
                     /portal/knowledge/connectors), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 82, pass 82, fail 0
```

One new unit test (`lib/api/connectors.js#fetchConnectorStatus`, mocked `global.fetch`, same style as every prior package's lib tests). All 81 tests from Packages 1–7 pass unchanged.

### End-to-end smoke test (real backend, not mocked)

A temporary organisation and two temporary users (`admin`, `member`) were created for this test and fully deleted again afterward.

| Check | Result |
|---|---|
| `GET /portal/knowledge/connectors` with no session | `307` → `/portal/login?next=%2Fportal%2Fknowledge%2Fconnectors` |
| `/portal/knowledge` → "Connectors" button | Present, links correctly |
| Admin → `GET /portal/knowledge/connectors` | `200`; SharePoint, OneDrive, and Microsoft Teams cards all render with "Coming Soon" badges, backend status text, and disabled action buttons |
| Rendered HTML | Confirmed the action button carries the literal HTML `disabled` attribute (`<button ... disabled="">`), not merely CSS styling made to look inactive |
| Direct `GET /connector-status/` call | `{"sharepoint": "available", "onedrive": "available", "teams": "available"}` — confirmed the exact hardcoded shape from source |
| Member (non-admin) → `GET /portal/knowledge/connectors` | `200`; identical view to admin — confirms finding 1 (no role gate, no org-scoping) directly, not just from source |

---

## 8. Files changed

### New files

```
lib/api/connectors.js                                        fetchConnectorStatus
lib/api/__tests__/connectors.test.js                          unit test (mocks global.fetch)

app/portal/(protected)/knowledge/connectors/page.js            connector overview (Server Component)
app/portal/(protected)/knowledge/connectors/loading.js          Suspense fallback
app/portal/(protected)/knowledge/connectors/error.js            error boundary safety net

components/portal/ConnectorCard.js                             disabled "coming soon" card

docs/frontend/IMPLEMENTATION_REPORTS/CONNECTORS_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `app/portal/(protected)/knowledge/page.js` | Added a "Connectors" button to the hero actions, alongside the existing "Upload Document" button | Requirement #8 — the only navigation integration needed, since Connectors is a Knowledge sub-page, not a new top-level nav entry (§6) |
| `app/globals.css` | +4 lines, additive only | New `.connector-card`, `.connector-card .btn:disabled`, `.connector-status`, `.connector-status span` classes for the dimmed/disabled card treatment requirement #4 calls for. No existing rule was changed. |

No file from Packages 1–7 was changed in behaviour — `lib/api/auth.js`, `middleware.js`, `app/portal/(protected)/layout.js`, `AuthProvider`, `PortalNav`, `EmptyState`, `lib/api/results.js`, and every other prior package's file are all reused exactly as they were.

---

## 9. Files changed, test results, remaining risks, recommended next phase

### Files changed
See §8 above — 6 new files, 2 modified files, 0 deleted files.

### Test results
`npm run build` → 38 routes, 0 errors. `npm run lint` → 0 warnings/errors. `npm test` → 82/82 passing (1 new). Live smoke test against a real backend confirmed every finding in §2 directly (no role gate, no org-scoping, hardcoded identical response across accounts) and every UI state (disabled cards, redirect-with-`next`, member parity).

### Remaining risks

1. **The entire connector surface is non-functional by design, and this is a backend-only limitation this frontend cannot close.** No OAuth, no Microsoft Graph integration, no real sync exists anywhere in `teracom-ai-backend` today (§2). This is unchanged from what Package 4 and the architecture doc already flagged — this package's job was accurately representing that reality, not building around it.
2. **Connector status is not organisation-scoped even in principle** — every org sees the identical hardcoded response (§2, finding 1). If a real integration is ever built, the backend will need to start reading `current_user["organisation_id"]` to report genuinely per-org connection state; today there is no per-org state to report at all.
3. **The `services/connectors/*.py` class hierarchy is unreachable dead code** (§2, finding 2–3) that could mislead a future backend developer into thinking a connect/sync mechanism partially exists — worth flagging to whoever owns the backend repo as either a starting point to wire up for real, or dead code to remove, rather than leaving it in an ambiguous, half-built state indefinitely.
4. **All risks carried over from Packages 1–7 remain unchanged** (no CORS middleware, no refresh token, Knowledge's `DELETE /documents/{id}` FK bug, Chat's unresumable sessions, Memory's no-update/delete, Workers' no-update endpoint, Administration's permission-duplication bug) — see the respective prior reports. None are specific to or worsened by this package.

### Recommended next phase

With Packages 1–8 complete, **Package 9 — Billing & Licensing** is the only item remaining in `FRONTEND_ARCHITECTURE_V1.md`'s original Part E sequencing, and per `docs/governance/UX_VISION.md` and the newly-approved `licensing-model-v1`, its scope is now considerably better specified than when Package 1 first flagged it as the longest-lead-time item. It still cannot be completed frontend-only — no `organisations.plan` column, no Stripe↔backend bridge, no license-file mechanism exists in `teracom-ai-backend` today. The backend schema/endpoint conversation for this should already be underway in parallel (flagged as the standing "most urgent non-code gap" since Package 1); if it is not, that conversation — grounded in the now-approved `licensing-model-v1`'s renewal window, grace period, Locked Mode, hardware-bound licensing, and human-approval requirements — is the correct next step before any Package 9 frontend code is written. Before writing any Package 9 code, read whatever backend billing/organisation-schema work exists at that time directly (the same verify-before-building discipline applied in Packages 4 through 8), since a backend schema that doesn't yet exist cannot be assumed into a frontend implementation.
