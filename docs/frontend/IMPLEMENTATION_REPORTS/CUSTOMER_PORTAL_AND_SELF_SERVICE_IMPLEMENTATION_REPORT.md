# Customer Portal & Self-Service Platform Implementation Report — Phase 0 Package O

**Scope:** Package O — Customer Portal & Self-Service Platform, spanning both this repository and `teracom-ai-backend` (sibling repository). No pre-existing `*_MVP_V1.md` design document existed for this package — see the backend report's §1 for the design decisions resolved with the user before any code was written, including the decision to originate a new, narrower-than-organisation identity plane and to name it `PortalContact` rather than reusing the already-overloaded word "customer."
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance, as an admin and two isolated portal contacts. No Ollama call is exercised anywhere in this package's own new code.
**Depends on:** Packages 1–9, G, H, I, J, K, L, M, and N — the BFF-proxy pattern, `settle`/`errorMessage`, `ContactDetailPage`/`CustomerHealthWidget` (extended, not replaced), `list_proposals_for_contact`-style backend service reuse, and Package N's `Project`/`Task` model (extended with one new FK, not duplicated).
**Out of scope (unchanged, not implemented):** self-service signup/password reset for `PortalContact` accounts; a multi-user-per-customer model; any customer-facing write capability on Proposal/Quote/Contract/OnboardingTask.

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/customer-portal` (new route group, own session plane) | The entire Customer Portal — dashboard, deals, onboarding, projects, support, communications, knowledge |
| `/customer-portal/login` | Portal-contact-only login, own cookie, own BFF auth routes |
| `/portal/support` | New: org-wide staff support inbox |
| `/portal/sales/:contactId` (extended) | Gains a portal-account panel and this contact's own support requests |
| `/portal/admin/departments` → `CustomerHealthWidget` (extended) | Gains portal-adoption/open-support-request counts |
| 6 new BFF routes | 2 customer-portal mutation routes (create support request, reply), 3 staff-side routes (create portal account, update status, reply), 1 already covered by existing GET-fetch convention |

## 2. Backend verification performed before writing any code

Per this series' established discipline, `teracom-ai-backend`'s new Package O source was read directly as it was built alongside this frontend work — `models/{portal_contact,support_request,support_request_message}.py`, `auth/portal_contact_{security,dependencies}.py`, `schemas/portal_contact_view.py`, `services/{portal_contact_view_service,support_request_service}.py`, and every new/modified router.

Confirmed directly, driving the frontend's own design:

- **`POST /portal-contact/login` takes a JSON body, not query parameters** — unlike the existing customer `/auth/login` quirk. `lib/api/portalContactAuth.js#loginWithPortalContactCredentials()` posts a plain JSON body directly.
- **The portal-contact session is a genuinely separate plane** — its own JWT `aud` claim, its own `GET /portal-contact/me`. This frontend mirrors that with its own cookie (`teracom_portal_contact_session`), its own route group (`/customer-portal`), and its own `PortalContactAuthProvider`/`usePortalContactAuth()` — never sharing code with `AuthProvider`/`useAuth()`.
- **`GET /crm/contacts/{id}/portal-account` returns `null`, not a 404, when no account exists yet** — `PortalAccountPanel` branches on `portalAccount` being falsy to show the admin-only creation form, not on catching an error.
- **Every `Portal*View` schema structurally omits `internal_cost_estimate`/`decision_notes`/internal user ids** — confirmed by reading the schema file directly, not inferred from behaviour. No frontend-side field-hiding logic was needed; the backend payload itself never contains these fields.
- **`GET /tasks/` (unfiltered) returns every task in the caller's organisation** — used deliberately in the department-page wiring to avoid a second per-project network round trip when computing task progress for department-linked projects, the same pattern already used elsewhere in this series.
- **Submitting an incident-type support request is a single `POST`, with no separate "convert to task" step** — `PortalSupportRequestList`'s form has no such affordance; the resulting `operations_task_id` is simply present on the response.

None of these findings required backend changes from this side (one backend gap — no GET route existed yet to check for an existing portal account — was found and fixed on the backend side during this same work, see backend report §3).

## 3. Customer Portal session plane (objective: distinct route group and cookie)

`middleware.js` gained a second, independent branch for `/customer-portal/:path*`, checking presence of the new cookie and redirecting to `/customer-portal/login` — structured as its own `if` block rather than a generalised, parameterised guard, since the two auth domains must never share a code path (mirrors the backend's own `get_current_user`/`get_current_portal_contact` separation). `app/customer-portal/(public)/login/page.js` and `app/customer-portal/(protected)/layout.js` mirror `app/portal/(public)/login/page.js`/`app/portal/(protected)/layout.js` exactly in structure.

## 4. Customer-facing dashboard, deals, onboarding, projects, knowledge (objectives #1-#6, #9, #11)

Eight thin `lib/api/portalContact*.js` modules, one per `GET /portal-contact/*` route, each a direct `backendFetch` wrapper — no client-side data transformation, since the backend's `Portal*View` schemas are already exactly what the UI needs. `deals/page.js` combines proposals/quotes/contracts in one page (objectives #3-#5), mirroring the staff-side `ContactDetailPage`'s own combined layout. `projects/page.js` renders each project's `task_progress` (`{total, done, percent}`) directly from the backend's own computed field — no client-side aggregation.

## 5. Support requests, incidents, and communications (objectives #7, #8, #10, #12)

`PortalSupportRequestList` (client) is the only form on the customer-facing side with a request-type selector — submitting `"incident"` uses the identical code path as `"support"`; the frontend has no separate incident-specific UI, matching the backend's own single unified model. `PortalSupportRequestThread` (client) is the reply UI, reused by neither side — the staff-facing `SupportRequestPanel` is a separate, self-contained component with its own expand-to-thread interaction, since staff need an inbox-style list-plus-inline-thread view rather than a dedicated per-request page. `communications/page.js` renders the backend's own aggregated timeline directly, with no client-side merging of separate data sources.

## 6. Staff-side integration (objective #12)

`PortalAccountPanel` (new) — added to `ContactDetailPage`, admin-gated creation form matching `CreateUserForm`'s own "admin sets the password directly" convention. `SupportRequestPanel` (new) — reused identically on `ContactDetailPage` (this contact's own requests) and the new org-wide `/portal/support` inbox (`showContactColumn` prop toggles the extra identifying column). `CustomerHealthWidget` gained two new list items for the pipeline summary's new fields — no new component, no layout restructuring.

## 7. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, all new routes listed
                     (/portal/support, the entire /customer-portal
                     tree, and 6 new /api/* BFF routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 258, pass 258, fail 0
```

### Unit tests (258 total; 16 new for this package)

New: `lib/api/__tests__/portalContact{Dashboard,Deals,Onboarding,Projects,Communications,Knowledge,SupportRequests,Accounts}.test.js`, `lib/api/__tests__/supportRequests.test.js`, and 8 new cases across `lib/api/__tests__/validation.test.js` for the four new parsers. **One cookie-touching module was deliberately left untested by `node:test`**: `lib/api/portalContactAuth.js` imports `next/headers`, which is not resolvable outside the Next.js runtime under the plain Node test runner — confirmed by attempting a test file for it first and observing `ERR_MODULE_NOT_FOUND`. This mirrors the pre-existing, unstated convention already followed for `lib/api/auth.js` itself, which has no direct unit test file for the same reason; both modules' pure network-calling functions are covered where they don't touch `cookies()`, and the cookie-setting behaviour itself is covered by the live e2e walkthrough below. All 242 tests from Packages 1–9/G/H/I/J/K/L/M/N pass unchanged.

### End-to-end smoke test (real backend — no Ollama needed)

A temporary `teracom-ai-backend` instance (port 8001) and this frontend (port 3001) were started against the real dev Postgres. Two contacts, each granted an independent `PortalContact` account, were exercised as both roles.

| Check | Result |
|---|---|
| `GET /customer-portal` (as portal contact A) | `200`; dashboard counts rendered from real data |
| `GET /customer-portal/deals` | `200`; the correct proposal rendered, `internal_cost_estimate` absent from the payload |
| Portal contact A → `/customer-portal/support/:idOfContactBsRequest` | `403`, rendered as "Request not found" — cross-contact isolation holds through the full stack |
| Portal contact → BFF `POST /api/customer-portal/support-requests` (`request_type: "incident"`) | `200`; the resulting `operations_task_id` traced to a real Task on `GET /portal/operations` |
| Staff `member` → BFF `POST /api/portal/support-requests/:id/messages` (reply) | `200`; reply visible on `/customer-portal/support/:id` on next load |
| Admin → BFF `POST /api/portal/crm/contacts/:id/portal-account` (second call, same contact) | `409` — the one-account-per-contact gate holds through the full BFF stack, not just the direct backend API |

All verification data was deleted from the real dev database afterward (see backend report §6 for the full cleanup); both temporary servers were stopped and confirmed down.

---

## 8. Files changed

### New files

```
lib/api/portalContactAuth.js                                loginWithPortalContactCredentials/fetchCurrentPortalContact/session cookie helpers
lib/api/portalContactDashboard.js                            fetchPortalContactDashboard
lib/api/portalContactDeals.js                                fetchPortalContactProposals/Quotes/Contracts
lib/api/portalContactOnboarding.js                           fetchPortalContactOnboardingTasks
lib/api/portalContactProjects.js                             fetchPortalContactProjects
lib/api/portalContactCommunications.js                       fetchPortalContactCommunications
lib/api/portalContactKnowledge.js                            fetchPortalContactKnowledge
lib/api/portalContactSupportRequests.js                      create/fetch/reply, portal-contact side
lib/api/supportRequests.js                                   fetch/update/reply, staff side
lib/api/portalContactAccounts.js                             createPortalAccountForContact/fetchPortalAccountForContact
lib/api/__tests__/portalContact{Dashboard,Deals,Onboarding,Projects,Communications,Knowledge,SupportRequests,Accounts}.test.js
lib/api/__tests__/supportRequests.test.js

app/api/customer-portal-auth/{login,logout,session}/route.js         mirrors /api/auth/* exactly
app/api/customer-portal/support-requests/route.js                    POST → createPortalContactSupportRequest() BFF proxy
app/api/customer-portal/support-requests/[requestId]/messages/route.js   POST → reply BFF proxy
app/api/portal/crm/contacts/[contactId]/portal-account/route.js      POST → createPortalAccountForContact() BFF proxy
app/api/portal/support-requests/[requestId]/status/route.js          PATCH → updateSupportRequestStatus() BFF proxy
app/api/portal/support-requests/[requestId]/messages/route.js        POST → staff reply BFF proxy

app/customer-portal/(public)/{layout,login/page}.js
app/customer-portal/(protected)/layout.js
app/customer-portal/(protected)/page.js                               Dashboard
app/customer-portal/(protected)/deals/page.js
app/customer-portal/(protected)/onboarding/page.js
app/customer-portal/(protected)/projects/page.js
app/customer-portal/(protected)/support/{page,[requestId]/page}.js
app/customer-portal/(protected)/communications/page.js
app/customer-portal/(protected)/knowledge/page.js

app/portal/(protected)/support/{page,loading,error}.js               org-wide staff support inbox

components/customer-portal/PortalContactAuthProvider.js
components/customer-portal/PortalContactLoginForm.js
components/customer-portal/CustomerPortalNav.js
components/customer-portal/PortalDashboardWidget.js
components/customer-portal/PortalDealsView.js
components/customer-portal/PortalOnboardingView.js
components/customer-portal/PortalProjectsView.js
components/customer-portal/PortalSupportRequestList.js
components/customer-portal/PortalSupportRequestThread.js
components/customer-portal/PortalCommunicationsTimeline.js
components/customer-portal/PortalKnowledgeList.js

components/portal/PortalAccountPanel.js                               staff-side portal-account visibility/creation
components/portal/SupportRequestPanel.js                              staff-side request list/status/thread, reused twice

docs/backend/PHASE_0_PACKAGE_O_CUSTOMER_PORTAL_AND_SELF_SERVICE_IMPLEMENTATION_REPORT.md   backend report
docs/frontend/IMPLEMENTATION_REPORTS/CUSTOMER_PORTAL_AND_SELF_SERVICE_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/constants.js` | Added `PORTAL_CONTACT_SESSION_COOKIE_NAME` | New session plane |
| `lib/api/validation.js` | Added `parseSupportRequestPayload`/`parseSupportRequestStatusPayload`/`parseSupportRequestMessagePayload`/`parsePortalContactAccountPayload` | New BFF routes |
| `lib/api/__tests__/validation.test.js` | New test cases for the above | Test coverage |
| `middleware.js` | Added a second, independent branch guarding `/customer-portal/:path*` | New session plane |
| `components/portal/CustomerHealthWidget.js` | Renders `portal_accounts_count`/`open_support_requests_count` | Objective #13 |
| `components/portal/PortalNav.js` | Added a `/portal/support` link | Navigation |
| `app/portal/(protected)/sales/[contactId]/page.js` | Fetches portal-account status and this contact's support requests, renders both new panels | Objective #12 |
| `docs/workforce/CUSTOMER_SUCCESS_MANAGER_WORKER.md` | New note on the Package O extension of this role's scope, without changing its escalation boundary | Objective #12 |
| `docs/governance/ARCHITECTURE_DECISIONS.md` | New ADR-019 | Governance |
| `docs/governance/PROJECT_STATE.md` / `CURRENT_SPRINT.md` | Added the Package O row/risks; extended the standing update/delete-gap count and the new-package narrative | Documentation discipline |

No file from Packages 1–9/G/H/I/J/K/L/M/N was changed in behaviour beyond the `ContactDetailPage`/`CustomerHealthWidget`/`PortalNav`/`middleware.js` additions above — every other pre-existing component, page, and `lib/api/*` module is reused exactly as it was.

---

## 9. Remaining risks / follow-ups

1. **No update or delete endpoint exists for any support request or message beyond status transitions and appending new messages** — the same standing limitation carried from Package 6/H/J/K/L/M/N, now present on this package's own entities too.
2. **No self-service password reset for `PortalContact` accounts** — no email capability exists anywhere in this backend; an admin must manually issue a new password via a future endpoint or direct database action if one is lost.
3. **`PortalContact` is 1:1 with a `CrmContact`** — a customer organisation with multiple staff needing portal access must currently share one login.
4. **`lib/api/portalContactAuth.js` has no direct `node:test` coverage** — the same restraint already applied (silently, until now) to `lib/api/auth.js`, since `next/headers` isn't resolvable under the plain Node test runner; covered instead by the live e2e walkthrough.
5. **All risks carried over from Packages 1–9/G/H/I/J/K/L/M/N remain unchanged** — see the respective prior reports.

## 10. Recommended next package

All eight most recent reports (Packages H, I, J, K, L, M, N, O) converge on the same standing gap: a real update/delete (or explicit archive) capability, now spanning eighteen distinct rows across memory, sales/customer-success, marketing/media, federation, finance, operations, and customer-portal data models. A second, recurring candidate, now flagged in six consecutive packages' reports: wiring `Department.function` (five values) into CTO Orchestration's own delegation heuristic. A third, new candidate this package's own research surfaces directly: a self-service password-reset mechanism for `PortalContact` accounts, blocked on the same "no email-sending capability anywhere in this backend" constraint already flagged for the org-admin signup flow in `CUSTOMER_BOOTSTRAP_ARCHITECTURE_V1.md` — resolving that one underlying email-capability gap would unblock both.
