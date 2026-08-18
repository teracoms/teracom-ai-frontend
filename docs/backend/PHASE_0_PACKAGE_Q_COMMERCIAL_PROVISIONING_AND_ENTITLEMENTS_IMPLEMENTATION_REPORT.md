# Phase 0 Package Q: Commercial Provisioning & Entitlements — Implementation Report

**Date:** 2026-08-18 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) · **Scope:** the highest-value follow-on wave after Package PQR — turning a completed sale into a fully provisioned customer environment, explicitly excluding billing engines and payment gateways (a separate, later concern). Extends the Package A–D licensing/entitlement/marketplace infrastructure and Package O's customer-portal surface; does not touch Packages E–PQR's own domains.

---

## 1. Scope and the design decisions this package was built against

Before any code was written, this package's 8 requested focus areas were mapped onto the *existing* backend, which turned out to already have more of the commercial substrate than the frontend's own docs assumed:

1. **`LicenceRequest.request_type == "worker_pack"` (the +5/+10 quantity entitlement add-on, `LICENSING_MODEL_V1.md` §7) was already a valid, submittable request type — but staff approval of one did nothing.** `api/staff_licence_requests.py`'s own `_GENERATABLE_REQUEST_TYPES` restricted actual generation to `initial_issuance`/`renewal` only; `services/entitlement_service.py#recompute_worker_limit()` — the formula for exactly this — existed, unused, since Package B. This package gives that formula real rows to sum (`WorkerPackAddOn`) and wires approval to call it.
2. **`tier_change`/`hosting_change` request types already required `tier`+`hosting_model` in their payload** (`api/licensing.py`'s pre-existing validation), evidence the original design always intended them to generate a superseding licence — but, like `worker_pack`, they were never added to `_GENERATABLE_REQUEST_TYPES`. This package completes that wiring, reusing `services/licence_generation_service.py#generate_licence()` unchanged.
3. **`models/worker_pack.py`'s own docstring named the exact gap this package closes**: "a customer instantiates actual workers from this template list themselves ... not something this package does on a customer's behalf" (Package D). `services/worker_pack_provisioning_service.py` does it on their behalf now — atomically, entitlement-checked.
4. **A new organisation-level onboarding checklist, deliberately not a reuse of `OnboardingTask`.** That table (Package J) is scoped to a `CrmContact` — a sales-pipeline prospect *of* the organisation, tracked by the organisation's own Sales & Customer Success workforce. This package's checklist is scoped to the organisation itself (Teracom's own licensed tenant) — a different "customer" entirely, the same naming caution `models/portal_contact.py`'s own docstring already flags. A new `OrganisationOnboardingTask` table was added rather than overloading the existing one.
5. **Entitlement enforcement (worker-limit blocking) is real for the new provisioning path only — deliberately not retrofitted onto `POST /workers/` or `WorkerCreationRequest` approval.** `LICENSING_MODEL_V1.md` §4 states plainly: "This is a decided policy. It is not yet implemented anywhere in the product ... Do not describe this as 'enforced' in customer-facing material until the corresponding backend work ships." Retrofitting the same check onto those two already-shipped, heavily-tested endpoints is a behaviour change to existing code across every other package's test suites, not new provisioning surface — judged out of scope for this package, a candidate for a dedicated follow-up (see §8).

**Backend:** 3 modified, 13 new. **Frontend:** 5 modified, 10 new. Not yet committed in either repository as of this report — pending the project owner's go-ahead, per this series' convention of treating a commit as a distinct, explicitly-requested step.

## 2. Files created/changed (backend)

**New models:** `models/{worker_pack_addon,worker_pack_provisioning,organisation_onboarding_task}.py`. **New services:** `services/{entitlement_provisioning_service,worker_pack_provisioning_service,organisation_onboarding_service}.py`. **New schemas:** `schemas/{worker_pack_provisioning,organisation_onboarding}.py`. **New API routers:** `api/{worker_pack_provisioning,organisation_onboarding}.py`. **New migration:** `alembic/versions/9c2f4a7e1b3d_add_commercial_provisioning_and_...py`. **New tests:** `tests/test_commercial_provisioning.py` (10 tests).

**Modified:** `models/worker.py` (+ nullable `worker_pack_provisioning_id` FK), `schemas/worker.py` (+ `worker_pack_provisioning_id` on `WorkerResponse`), `schemas/licensing.py` (+ `pack_size`/`quantity` fields on `LicenceRequestCreate`, validated to `{5, 10}` / `≥1`), `api/licensing.py` (`worker_pack` requests now require `pack_size`+`quantity`, both forwarded into `request_payload`), `api/staff_licence_requests.py` (the core rewiring — see §3), `main.py` (two new router registrations).

## 3. Rewiring the licence-request decision endpoint (objectives: entitlement management, organisation licensing, subscription assignment, automated onboarding)

`api/staff_licence_requests.py#decide_licence_request()` previously handled exactly two request types end-to-end and silently no-op'd on the rest. It now branches three ways on approval:

- **`initial_issuance` / `renewal` / `tier_change` / `hosting_change`** (`_GENERATABLE_REQUEST_TYPES`, extended from 2 to 4 entries): generates a licence via the unchanged `generate_licence()`. `tier_change`/`hosting_change` now supersede the organisation's current active licence — resolved server-side (the organisation's current active `Licence`, not a client-supplied `existing_licence_id`, which the customer-facing submission endpoint leaves optional) rather than trusting client-supplied linkage for a supersession decision. `carry_forward_addons_to_new_licence()` re-points every `WorkerPackAddOn` row from the old licence to the new one and recomputes `worker_limit` — without this, a previously-purchased +5/+10 pack would silently vanish from entitlement the moment a tier change superseded its licence.
- **`worker_pack`**: `apply_worker_pack_addon()` persists a `WorkerPackAddOn` row (the audit-style "subscription assignment" record — what quantity add-ons this organisation has purchased, in this system's own vocabulary, not a payment record) against the organisation's current active licence, then recomputes `worker_limit` from every add-on row that licence has ever accumulated. Raises (409) if the organisation has no active licence — verified by `test_worker_pack_addon_requires_active_licence`.
- **Welcome checklist seeding**: gated specifically on the transition out of `"pending_licence"` — captured *before* any status flip, so a later renewal/tier_change/hosting_change never reseeds it. Verified by `test_renewal_does_not_reseed_welcome_checklist`.

## 4. Worker Pack provisioning (objectives: purchased worker provisioning, worker catalogue integration, customer-to-worker mapping)

`services/worker_pack_provisioning_service.py#provision_worker_pack_for_organisation()` — admin-only, `POST /worker-pack-provisioning/` — is the atomic "turn a completed sale into a provisioned environment" action:

1. Confirms the organisation has an active licence entitlement (else 409).
2. Reuses `services/marketplace_service.py`'s existing `pack_accessible_for_tier()` gate — the same tier check Marketplace browsing already enforces, not a second copy.
3. Counts the organisation's current `Worker` rows and rejects (409, with the exact used/limit figures in the message) if provisioning every `persona_template` in the pack would exceed `entitlement.worker_limit` — the first place in this backend `LICENSING_MODEL_V1.md` §4's "hard stop enforced at creation time" policy is actually implemented, for this path.
4. Creates one `WorkerPackProvisioning` row and one real `Worker` per template, each stamped with `worker_pack_provisioning_id` — the customer-to-worker mapping this row's whole existence services/worker_pack.py's own docstring named as deferred.
5. Logs a `worker_provisioned_from_pack` event per worker to the pre-existing `WorkerAuditLog` (no new audit table needed).
6. Appends one `OrganisationOnboardingTask` ("Review your N new `<Pack Name>` workers") — not a reseed of the welcome checklist.

All five steps are one DB transaction; a rejection before step 4 leaves zero rows behind (verified by `test_provision_worker_pack_rejects_when_it_would_exceed_worker_limit` asserting `GET /workers/` is still empty).

## 5. Organisation onboarding (objectives: customer account provisioning, automated onboarding after approved purchases)

`OrganisationOnboardingTask` + `services/organisation_onboarding_service.py`: `seed_welcome_checklist()` (5 fixed items, no LLM — the same "never AI-authored" discipline `services/onboarding_task.py`'s own docstring already applies to `OnboardingTask`, extended here) fires once, at first activation; `add_pack_provisioning_task()` appends one item per provisioning event. `GET /organisation-onboarding-tasks/` (any member) / `PATCH /{id}/complete` (admin-only) round out the API.

## 6. Frontend

**New:** `lib/api/{licensing,workerPackProvisioning,organisationOnboarding}.js` (server-only, mirroring `FRONTEND_ARCHITECTURE_V1.md` §C.4), 3 matching BFF proxy routes under `app/api/portal/`, `components/portal/{OrganisationOnboardingChecklist,WorkerPackProvisionAction}.js`, `app/portal/(protected)/onboarding/{page,loading,error}.js`, a new "Onboarding" nav entry.

**Modified:** `components/portal/WizardShell.js` (its `onSubmit` prop, previously decorative, is now genuinely awaited with real loading/success/error states when a caller supplies one), `components/portal/WorkerPackWizard.js` (now submits a real `POST /licensing/requests` with `request_type="worker_pack"` — safe to wire because its payload, `pack_size`/`quantity`, needs no data from `lib/licensing/referenceLicence.js`'s illustrative reference licence, unlike the display-only "current allocation" figure it still shows), `app/portal/(protected)/marketplace/[slug]/page.js` (adds the "Provision this pack" action).

**Explicitly not done:** `RenewalWizard.js` and `OwnershipTransferWizard.js` still show the original "recorded on this screen only" message — both depend on `referenceLicence.js` for fields a real submission would need (a real `tier`/`hosting_model`/`existing_licence_id`), which this package did not replace. Wiring them safely requires that replacement first; submitting a real request with fabricated tier/hosting data would be worse than the current honest mock. `lib/licensing/referenceLicence.js` and the rest of the Billing & Licensing UI (Overview, Licence Details, Usage & Capacity) are unchanged — still illustrative, per §1 item 5's scope boundary.

30 new frontend unit tests would overstate it — 7 new (one file per new `lib/api` module, mirroring every prior package's own convention for new fetch-wrapper functions).

## 7. Validation

### Backend
`python -m alembic heads` — single head (`9c2f4a7e1b3d`). `python -m pytest` — **200 passed** (10 new in `tests/test_commercial_provisioning.py`; all 190 pre-existing tests across Packages 1–PQR pass unmodified). Migration applied cleanly to the real dev database (`8d46255844ca` → `9c2f4a7e1b3d`).

### Frontend
`npm run lint` — zero warnings. `npm test` — **294 passed** (7 new). `npm run build` (from a clean `.next`) — succeeds; `/portal/onboarding` and the updated `/portal/marketplace/[slug]` both present in the route manifest.

### End-to-end verification (full-stack, live)
Started a real backend (port 8000) and frontend (port 3100) against the actual dev Postgres database, all against the live HTTP API and the real frontend (not `TestClient`):

- Signed up a brand-new organisation, submitted and staff-approved an `initial_issuance` request — confirmed a real `entitlements.worker_limit` of 5 (starter) and a real 5-item welcome checklist, both freshly created.
- Published a real 2-persona Marketplace pack as staff, then provisioned it as the organisation's admin via `POST /worker-pack-provisioning/` — confirmed 2 real `Worker` rows created, each with `worker_pack_provisioning_id` set to the same provisioning record, `GET /workers/` reflecting both, and a 6th onboarding task appended.
- Fetched `/portal/onboarding` and `/portal/marketplace/smoke-retail-pack` through the real Next.js dev server with a real session cookie — confirmed both pages rendered the real data above (all 6 task titles; the pack's real persona templates and the "Provision this pack" action) through the actual BFF proxy chain, not a mock.
- All verification data (the organisation, its users/licences/entitlements/workers/onboarding tasks, the staff account, and the Marketplace pack) was deleted from the real dev database afterward in FK-dependency order; both temporary server instances were stopped and confirmed down.

## 8. Explicitly not done

- **No billing engine, payment gateway, price, invoicing, or `Subscription` entity** — the single largest deliberate scope boundary for this package, per direct instruction. `LICENSING_MODEL_V1.md`'s still-open commercial-billing item is unaffected by this package.
- **No retrofit of worker-limit enforcement onto `POST /workers/` or `WorkerCreationRequest` approval** — see §1 item 5. A natural, low-risk follow-up once this package's own enforcement pattern has proven itself.
- **No update/delete endpoint for `WorkerPackProvisioning` or `OrganisationOnboardingTask`** beyond `PATCH .../complete` — `WorkerPackProvisioning` is an audit-style record by design (like `WorkerAuditLog`/`LicensingAuditLog`, never in this series' "needs CRUD" gap list); `OrganisationOnboardingTask` genuinely could use a delete/archive path and is added to that standing gap list (see updated `[[project-state]]`/`[[current-sprint]]`).
- **`RenewalWizard`/`OwnershipTransferWizard` remain mock-only** — see §6.
- **No cross-tenant/staff-facing UI for any of this** — `staff_licence_requests`/`staff_marketplace` remain API-only, as they were before this package; still zero staff-facing frontend anywhere in this repository.
- **`ownership_transfer`/`hardware_rebind` request types remain unimplemented end-to-end** — unchanged from Package A's own original scoping.
