# Federation & External AI Consulting Implementation Report — Phase 0 Package L

**Scope:** Package L — Federation Registry & External AI Consulting, spanning both this repository and `teracom-ai-backend` (sibling repository). No pre-existing `*_MVP_V1.md` design document existed for this package — a repo-wide search confirmed "Federation" was entirely greenfield before this package, so there was no existing design to correct, only precedent to build from. See the backend report's §1 for the four design forks resolved with the user before any code was written.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance and a real local Ollama instance, as both an admin and a `member` user.
**Depends on:** Packages 1–9, G, H, I, J, and K — session cookie/`getSessionToken()`, `AuthProvider`/`useAuth()`, `PortalNav`, `EmptyState`, `settle`/`errorMessage`, the BFF-proxy pattern, `fetchWorkerList`, `CtoOrchestrationPanel` (the shape `FederationConsultationPanel` follows), and `DepartmentFunctionControl` (the shape `FederationEnabledToggle` follows). Also extends the pre-existing `/portal/admin/organisation` page and `fetchOrganisationSummary` (Package 2) rather than building a new organisation-settings surface.
**Out of scope (unchanged, not implemented):** Billing & Licensing (still a UX scaffold, Package 9); a real external provider API call; a new pricing tier above Platinum.

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/portal/federation` | New: the Federation workspace — registry, worker-to-federation consultation panel, consultation history, executive summary widget |
| `/portal/cto` (extended) | Also shows the federation summary widget — objective #10/#11's CTO-dashboard visibility |
| `/portal/admin/organisation` (extended) | Gains the `federation_enabled` governance toggle (admin-only) |
| 3 new BFF routes | `/federation/suggest`, `/federation/consult`, `/organisations/federation-enabled` |

## 2. Backend verification performed before writing any code

Per this series' established discipline, `teracom-ai-backend`'s new Package L source was read directly as it was built alongside this frontend work — `models/{federation_provider,federation_consultation}.py`, `schemas/federation_consultation.py`, `services/federation_service.py`, and `api/federation_consultations.py`.

Confirmed directly, driving the frontend's own design:

- **`POST /federation/suggest` and `POST /federation/consult` both take `worker_id`/`message` (and, for consult, an optional `federation_provider_id`) directly in the JSON body, not as query parameters** — unlike Package K's `worker_id`-as-query-param convention for `/content/draft`. `FederationConsultationPanel` sends both fields in a single request body accordingly.
- **`GET /federation/providers` is genuinely read-open, no tier gate** — only the consultation flow itself is gated. The registry page therefore always renders for any signed-in user, even on a Starter-tier organisation; only the consultation panel's "Check Confidence"/"Consult Federation" actions can return `available: false`/`403`.
- **Every "federation response" is generated locally via Ollama and always marked `is_simulated: true`** — `FederationConsultationPanel` and `FederationConsultationHistory` both surface this explicitly (a "simulated" badge, and the response text itself is never presented as if it came from a real external call), so a customer is never misled about what actually produced the answer.
- **`federation_enabled` lives on the `Organisation` row itself**, returned by the same `GET /organisations/` endpoint `fetchOrganisationSummary()` (Package 2) already calls — no new fetch was needed; `/portal/admin/organisation` already had the organisation object in scope, so `FederationEnabledToggle` was added there directly rather than building a new settings page.
- **`GET /federation/summary`'s `consultation_count_by_provider` is always fully keyed** (every registered provider present, zero-filled) — confirmed `FederationSummaryWidget` never needs a defensive `?? 0` when reading a specific provider's count.
- **`federation_provider_id` is optional on `/federation/consult`** — a human may consult a specific provider directly without first calling `/suggest`. `FederationConsultationPanel`'s "Consult Federation" button works standalone; "Check Confidence" is a helpful precursor, not a hard prerequisite the UI enforces.

None of these findings required backend changes from this side.

## 3. Federation Registry and model capability catalogue (requirements #1, #2)

`FederationProviderList` (server component) renders each registered provider's display name, status badge (`"coming_soon"` today), capability tags, and simulated cost-per-1k-tokens rate — a plain read of `fetchFederationProviders()`, no client-side interactivity needed since the registry itself isn't customer-editable in this package.

## 4. Provider abstraction layer (requirement #3)

No dedicated frontend surface was built for this — per the confirmed design decision, the provider connector stubs are cosmetic and backend-only, consistent with this project's precedent for every prior connector family (Package 8, Package J, Package K all skipped a frontend surface for their own dead-code connector classes too).

## 5. AI consultation workflows; worker-to-federation consultation; provider selection logic; confidence-based escalation (requirements #4, #5, #7, #8)

`FederationConsultationPanel` mirrors `CtoOrchestrationPanel`'s two-review-point shape: "Check Confidence" (free, calls `/api/portal/federation/suggest`) shows the computed confidence score, the suggested provider, and a plain-English reason; "Consult Federation" (calls `/api/portal/federation/consult`) is the explicit human confirmation, pre-filled with whichever provider "Check Confidence" suggested but not required to have been called first. The result panel clearly labels the response as simulated and shows the confidence score and estimated cost alongside it — transparency by construction, not an afterthought.

## 6. Federation governance controls (requirement #6, governance)

`FederationEnabledToggle` (client component, mirrors `DepartmentFunctionControl`'s shape) is a plain checkbox bound to `organisation.federation_enabled`, added to the existing `/portal/admin/organisation` page (admin-only backend-side already, via `require_role("admin")` on the underlying `GET /organisations/` and the new `PATCH /organisations/federation-enabled`). **Verified live (§9):** disabling it immediately made `/portal/federation`'s consultation panel report unavailability on the next confidence check, and blocked the consult action outright, even on the organisation's Platinum tier.

## 7. Cost and usage tracking foundation (requirement #9)

`FederationConsultationHistory` and the consult result panel both show `estimated_cost`/confidence alongside each consultation, always described as "(simulated)" in the UI copy — never presented as real metered spend, matching the backend's own honest framing.

## 8. Executive visibility of federation activity; frontend surfacing (requirements #10, #11)

`FederationSummaryWidget` renders per-provider consultation counts, total consultations, total estimated cost, and suggested-vs-actioned counts from a single `fetchFederationSummary()` response. It appears on `/portal/federation` itself and on `/portal/cto` (extended, following the identical per-section-resilience `Promise.allSettled` pattern, ADR-008, Package K already established there for the marketing summary widget) — a dashboard widget, not woven into the CTO chain's own Ollama synthesis context, the same integration depth Package K gave marketing summary data. **Verified live (§9):** both `/portal/federation` and `/portal/cto` rendered the widget's own heading text from real data.

## 9. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, all new routes listed
                     (/portal/federation and 3 new /api/portal/*
                     BFF routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 215, pass 215, fail 0
```

### Unit tests (215 total; 11 new for this package)

New: `lib/api/__tests__/{federation,federationConsultation,organisations}.test.js`, plus 5 new cases across `lib/api/__tests__/validation.test.js` for the three new parsers. All 204 tests from Packages 1–9/G/H/I/J/K pass unchanged.

### End-to-end smoke test (real backend, real Ollama — not mocked)

A temporary `teracom-ai-backend` instance (port 8001) and this frontend (port 3001) were started against the real dev Postgres and the genuinely-running local Ollama instance. A Platinum-tier organisation, a narrow-purpose worker, a real confidence check, a real consultation, and the `federation_enabled` governance toggle were all exercised as both an admin and a `member` user.

| Check | Result |
|---|---|
| `GET /portal/federation` | `200`; the seeded registry ("Azure OpenAI"), consultation history, and summary widget all rendered from real data |
| `GET /portal/cto` | `200`; the federation summary widget rendered alongside the existing CTO panel/history and marketing summary widget |
| `GET /portal/admin/organisation` | `200`; the "Federation consultation enabled" toggle rendered |
| Member → BFF `POST /api/portal/federation/suggest` | `200`, `available: true` — any org member may check confidence |
| Member → BFF `PATCH /api/portal/organisations/federation-enabled` | `403` — the governance-control gate holds through the full BFF stack, not just the direct backend API |
| Admin → BFF `PATCH /api/portal/organisations/federation-enabled` | `200` |

All verification data was deleted from the real dev database afterward (see backend report §9 for the full cleanup); both temporary servers were stopped and confirmed down.

---

## 10. Files changed

### New files

```
lib/api/federation.js                                       fetchFederationProviders + fetchFederationSummary
lib/api/federationConsultation.js                            suggestFederationEscalation/consultFederation/fetchFederationConsultations
lib/api/organisations.js                                     setFederationEnabled (new file — no lib/api/organisations.js existed before this package)
lib/api/__tests__/{federation,federationConsultation,organisations}.test.js   unit tests

app/api/portal/federation/suggest/route.js                   POST → suggestFederationEscalation() BFF proxy
app/api/portal/federation/consult/route.js                   POST → consultFederation() BFF proxy
app/api/portal/organisations/federation-enabled/route.js     PATCH → setFederationEnabled() BFF proxy

app/portal/(protected)/federation/{page,loading,error}.js     the Federation workspace

components/portal/FederationProviderList.js                  registry display (server)
components/portal/FederationConsultationPanel.js              suggest/consult flow (client)
components/portal/FederationConsultationHistory.js            history (server)
components/portal/FederationSummaryWidget.js                  executive summary widget (server)
components/portal/FederationEnabledToggle.js                  admin-only governance toggle (client)

docs/backend/PHASE_0_PACKAGE_L_FEDERATION_AND_EXTERNAL_AI_CONSULTING_IMPLEMENTATION_REPORT.md   backend report
docs/frontend/IMPLEMENTATION_REPORTS/FEDERATION_AND_EXTERNAL_AI_CONSULTING_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/validation.js` | Added 3 new parsers (federation suggest, federation consult, federation-enabled) | Requirements #4–#6 |
| `lib/api/__tests__/validation.test.js` | New test cases for the above | Test coverage |
| `components/portal/PortalNav.js` | New "Federation" top-level link | First-class workspace, same standard Package I/J/K's link set |
| `app/portal/(protected)/cto/page.js` | Fetches `federationSummary`, renders `FederationSummaryWidget` in its own section | Requirements #10/#11 |
| `app/portal/(protected)/admin/organisation/page.js` | Renders `FederationEnabledToggle` when the organisation loaded successfully; updated its own lead copy to mention the new field | Requirement #6 |
| `docs/governance/ARCHITECTURE_DECISIONS.md` | New ADR-016 | Governance |

No file from Packages 1–9/G/H/I/J/K was changed in behaviour beyond the `PortalNav`/CTO-page/admin-organisation-page additions above — every other pre-existing component, page, and `lib/api/*` module is reused exactly as it was.

---

## 11. Remaining risks / follow-ups

1. **No real external provider is wired up.** Every "federation response" is generated locally via Ollama and marked `is_simulated: true` in both the schema and the UI copy — never presented as a real external call. Per the confirmed design decision, not an oversight.
2. **No update or delete endpoint exists for any federation consultation** — the same standing "create and read only" gap carried from Package 6/H/J/K, now present on this package's own data model too.
3. **The provider registry is a fixed, hand-authored set of 3 rows, not customer-manageable** — no admin CRUD surface was built for it, consistent with the scale of Packages 8/J/K's own hardcoded connector sets.
4. **Estimated cost/tokens are a simulated foundation, not real metering** — clearly labelled as such throughout the UI; there is no real external billing to measure.
5. **All risks carried over from Packages 1–9/G/H/I/J/K remain unchanged** — see the respective prior reports.

## 12. Recommended next package

All five most recent reports (Packages H, I, J, K, L) converge on the same standing gap: a real update/delete (or explicit archive) capability, now spanning thirteen distinct rows across memory, sales/customer-success, marketing/media, and federation data models. A second, recurring candidate, now flagged in three consecutive packages' reports: wiring `Department.function` (now three values — `"sales"`, `"customer_success"`, `"marketing"`) into CTO Orchestration's own delegation heuristic. A third, new candidate this package surfaces: a genuine external provider integration for Federation, once there's a concrete business case and API budget to justify moving past the current simulated foundation.
