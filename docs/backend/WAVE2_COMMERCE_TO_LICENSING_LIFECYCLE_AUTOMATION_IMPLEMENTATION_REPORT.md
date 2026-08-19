# Wave 2, Workstream 5 — Commerce-to-Licensing Lifecycle Automation, Phase 1 — Implementation Report

**Date:** 2026-08-19 · **Repos:** `teracom-ai-frontend` (Commerce ecosystem code — `app/api/webhooks/stripe/route.js`, `app/api/checkout/route.js`, `lib/zoho.js`, new `lib/api/commerceLicensing.js`); `teracom-ai-backend` (new internal endpoint). **Source:** `WAVE2_IMPLEMENTATION_PLAN.md` (`teracom-ai-docs`) §5, derived from `COMMERCIAL_READINESS_ASSESSMENT.md`'s (amended) identification of Commerce's own webhook blindness, and its Correction Note establishing this is Teracom's Commerce ecosystem, not the SaaS licensing product itself. **Scope:** fix the four silently-dropped webhook event types, and lay minimal identity-linking groundwork — not real tier/pricing automation, which is explicitly gated on a still-open pricing decision.

---

## 1. Investigation before implementation

Before writing any code, the exact current state of the Commerce integration was traced in full:

- `app/api/webhooks/stripe/route.js` handled exactly one event type, `checkout.session.completed`. Every other event Stripe could deliver — including `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` — fell through to the handler's final `return NextResponse.json({received: true})` with no branch, no logging, and no Zoho sync at all. This is a real, present-tense bug, not a missing feature: Stripe believes every one of these deliveries succeeded.
- `lib/zoho.js` exported exactly two functions, `createZohoContact` and `createZohoInvoice` — no lookup-by-email, no update/cancellation helper. A renewal invoice handler naively reusing `createZohoContact` would create a duplicate Zoho contact for every returning customer.
- `lib/products.js`: only 2 of 14 Commerce products are `type: 'subscription'` (`securityos-starter`, `securityos-pro`) — everything else is a one-off `hardware`/`software`/`digital`/`service` purchase, confirming the real blast radius of the new subscription-lifecycle event types is narrow.
- `app/api/checkout/route.js`: a Checkout Session's own `metadata` does **not** propagate onto the `Subscription` object Stripe creates for `mode: 'subscription'` — only `subscription_data.metadata` does. Without adding that, any identity-linking metadata (e.g. a Teracom `licenceId`) would be invisible to every later subscription-lifecycle webhook event, even though it was present on the original checkout.
- `models/licence_billing_reference.py` (backend): `LicenceBillingReference` already exists, added in Wave 1 Workstream 5 explicitly as forward-preparation, with every field left null since no code anywhere reads or writes it. No migration was needed for this workstream — this is the first code to actually use that table.
- No lookup-by-`external_customer_id` endpoint, and no service-to-service auth mechanism, existed anywhere in the backend. The established `auth/staff_dependencies.py#get_current_staff` authenticates a real `StaffUser`'s own session — there is no staff or user identity at all on a Stripe webhook's call path, so that dependency doesn't fit as-is.
- `lib/api/client.js`'s `backendFetch()` only ever sent an `Authorization: Bearer <token>` header — no mechanism existed to send an arbitrary custom header, which a shared service-secret approach would need.

These findings directly shaped the two most important design decisions below.

---

## 2. What was implemented

### Backend: a new internal, service-token-authenticated endpoint
- `config.py` — new `INTERNAL_SERVICE_TOKEN`, blank by default (matching the established "mechanism real, credential not configured in this environment yet" pattern — `SMTP_HOST`, `LICENSING_SIGNING_PRIVATE_KEY`).
- `auth/service_dependencies.py` (new) — `get_current_service()`, structurally parallel to `get_current_staff`/`get_current_user` but its own dependency, sharing no code with either. Checks a bearer-free `X-Internal-Service-Token` header against `config.INTERNAL_SERVICE_TOKEN`; always rejects when that config value is blank, so a blank/missing header can never accidentally satisfy it.
- `schemas/licence_billing_reference.py` (new) — `LicenceBillingReferenceLink` (validates `external_billing_provider` is `"stripe"` or `"zoho"`), `LicenceBillingReferenceResponse`.
- `api/licence_billing_references.py` (new router, prefix `/internal/licence-billing-references`) — `POST /link` (idempotent upsert keyed on `LicenceBillingReference`'s own unique `licence_id` column; 404 if the licence doesn't exist; records a `LicensingAuditLog` entry with `actor_type="service"`) and `GET /by-customer/{external_customer_id}` (lookup; 404 if none).
- Registered in `main.py` alongside the existing router list.

**Deliberate deviation from the plan's literal "staff-authenticated" wording:** a real `StaffUser` JWT would require minting and holding a long-lived staff credential for an unattended webhook to use — a wider blast radius (a real staff identity's token, held by automation, never expiring the way a normal login session does) than a narrow, purpose-built shared secret scoped to exactly one endpoint. This is a reasoned judgment call, documented here and in ADR-037, not a silent scope change.

### Frontend: the four previously-silent webhook events now handled
- `lib/zoho.js` — new `findZohoContactByEmail(email)`, used to avoid creating a duplicate Zoho contact on a subscription renewal invoice for a customer who already has one from their original checkout.
- `lib/api/client.js` — `backendFetch()` gained an optional `headers` option (additive; every existing caller is unaffected) so a caller can send `X-Internal-Service-Token` instead of `Authorization: Bearer`.
- `lib/api/commerceLicensing.js` (new) — `linkLicenceBillingReference()`, the one caller of the new backend endpoint.
- `app/api/webhooks/stripe/route.js` — rewritten to a `switch` over `event.type`, one handler function per event:
  - `checkout.session.completed` — unchanged behaviour (Zoho contact + invoice), plus a new best-effort call to `linkLicenceBillingReference()` when `session.metadata.licenceId` is present.
  - `invoice.paid` — only acted on for `billing_reason === 'subscription_cycle'` (a renewal, not the initial invoice already handled above, avoiding a duplicate Zoho invoice); resolves subscription metadata (preferring the invoice's own `subscription_details.metadata` snapshot, falling back to `stripe.subscriptions.retrieve()`), finds-or-creates the Zoho contact, creates a new Zoho invoice for the renewal amount.
  - `invoice.payment_failed` — logged with structured detail (invoice id, customer email, subscription id, attempt count). No automated dunning/notification flow — explicitly out of Phase 1 scope.
  - `customer.subscription.updated` / `customer.subscription.deleted` — logged with structured detail; `.updated` also attempts the licence-link if `licenceId` metadata is present.
  - Every licence-link call is wrapped so a failure there can never throw out of the handler (which would make Stripe retry the entire webhook delivery) and never blocks the Zoho sync itself.
- `app/api/checkout/route.js` — `CheckoutRequest` gained an optional `licenceId` field; when present, it's added to both the Session's own `metadata` and (for subscription-mode purchases) `subscription_data.metadata`. Not exposed in any storefront UI yet — pure plumbing for a future caller (e.g. a Portal-initiated purchase) that already knows the Teracom licence a purchase is for.
- `.env.example` — new `INTERNAL_SERVICE_TOKEN`, documented as must-match the backend's own value.

---

## 3. What was deliberately not done

- **No real Teracom SaaS tier was wired to a real Stripe product.** Commerce's 14 products (2 subscription, 12 one-off) are entirely unchanged; this workstream only fixes Commerce's own webhook blindness and adds an optional, currently-unused-by-any-UI `licenceId` field.
- **No automated dunning/notification flow for `invoice.payment_failed`.** Logged clearly; a real customer-facing notification is separate future work.
- **No Zoho action for `customer.subscription.updated`/`.deleted` beyond structured logging plus the identity link.** Zoho Books' own API (as wrapped by `lib/zoho.js`) has no subscription concept to update or cancel against; inventing one was judged out of Phase 1's bounded scope.
- **No storefront UI change.** `licenceId` is server-side-only plumbing today.

---

## 4. Tests

**Backend** — new `tests/test_licence_billing_reference.py`, 8 tests (following `tests/test_licensing.py`'s established API-test fixture pattern — `client`/`migrated_schema`, direct SQL seeding of an `Organisation`+`Licence`):
- Missing/wrong service token → 401 (both cases).
- A valid link request creates a new `LicenceBillingReference`.
- A repeat link request for the same `licence_id` updates the existing row in place (idempotent upsert), not a duplicate.
- An unknown `licence_id` → 404.
- An unrecognised `external_billing_provider` → 422.
- Lookup-by-customer returns the linked reference; an unknown customer → 404.

**Frontend** — two new files, mirroring `lib/api/__tests__/client.test.js`'s established mocked-`fetch` pattern:
- `lib/__tests__/zoho.test.js` (4 tests) — `findZohoContactByEmail` returns the first match / `null` on no match; `createZohoContact`/`createZohoInvoice` send the expected request shape.
- `lib/api/__tests__/commerceLicensing.test.js` (2 tests) — `linkLicenceBillingReference` posts to the correct URL with the `X-Internal-Service-Token` header and correct body shape; a non-2xx backend response rejects with the expected `ApiError`.

**Scope limit, stated explicitly rather than silently skipped:** `node --test` has no loader for the `@/*` path alias `app/api/webhooks/stripe/route.js` and `app/api/checkout/route.js` themselves import — the same constraint every existing `lib/api/*` test already works around via relative imports (see `client.test.js`'s own docstring). The route handlers' own orchestration logic (the `switch` over event types, the per-event handler functions) is therefore not directly unit-tested; it is validated via `next lint` (clean) and `next build` (clean — every route including both of these compiles). This mirrors Wave 2 Workstream 3's own precedent of stating a test-infrastructure gap explicitly (there: no React component-rendering harness) rather than expanding scope to build one for a single workstream.

---

## 5. Validation

- **Backend:** full suite — 306/306 passing (298 before this workstream, +8 new). Zero regressions.
- **Frontend:** 308/308 `node --test` passing (302 before this workstream, +6 new). `next lint` clean. `next build` clean — every route compiles, including both changed Commerce route handlers.

---

## 6. Commit status

Backend and frontend changes complete and tested, ready to commit locally. **Not pushed** — per instruction ("Commit locally... Do not push").
