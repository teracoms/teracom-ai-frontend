# Teracom AI Licensing Service — Architecture V1

**Status:** Proposed architecture, not yet implemented, not yet approved for build. This document is a design deliverable — per its own governing instruction, it does not implement code and does not modify `teracom-ai-frontend` or `teracom-ai-backend`.
**Sourcing:** First-hand for the backend sections — `teracom-ai-backend`'s actual source was read directly while writing this document (available on disk in this environment as a sibling repository; see §0.2). This upgrades the backend-architecture parts of this document from the second-hand caveat [[backend-status]] otherwise carries. The commercial/lifecycle sections are drawn directly from [[licensing-model-v1]], [[ux-vision]], and [[billing-and-licensing-ux]], cited by section throughout.
**Governing documents reviewed:** [[licensing-model-v1]] (commercial/lifecycle decisions), [[ux-vision]] (design-evaluation rubric, referenced where it constrains API shape), [[billing-and-licensing-ux]] (the already-built frontend UX blueprint this service must eventually serve — see `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` for what was built against illustrative data pending this service).
**Companion documents this task produces:** [[licensing-service-changelog]] (append-only log for changes to *this* document, distinct from [[licensing-changelog]], which tracks commercial-model decisions), `ARCHITECTURE_REPORT.md` (this task's summary deliverable).

---

## 0. How to read this document

### 0.1 Three-way labelling, not two

The task governing this document asks that decided items be separated from open items. This document uses three labels, not two, because collapsing them to two would either overstate an engineering judgment call as an approved business decision, or understate a real, cited commercial decision as merely "this document's opinion":

- **DECIDED** — a commercial/lifecycle fact the project owner has approved, per [[licensing-model-v1]] or an ADR. Cited by section number every time. Never treat a DECIDED item as open to re-litigation without going back to the project owner.
- **OPEN** — a question [[licensing-model-v1]] itself states is not yet decided (its own §19 consolidated list), or a new one this document identifies while designing against the decided parts. Never treat an OPEN item as answered by inference — every OPEN item below states what blocks it from being closed.
- **PROPOSED** — this document's own engineering design choice: a schema shape, an algorithm, a workflow sequencing. Proposed items are recommendations for review and ratification, not decisions already made. Where a PROPOSED item depends on an OPEN item being resolved first, this is stated explicitly.

### 0.2 What "first-hand" means here, precisely

`teracom-ai-backend` is not part of this git repository, but a checkout exists on disk in this environment (sibling directory, path `teracom-ai-backend` relative to this repo's parent). The following were read directly while writing this document, not assumed from [[frontend-architecture]] or [[backend-status]]: `main.py` (all 39 registered routers), every file under `models/`, `auth/security.py`, `auth/roles.py`, `auth/organisation.py`, `auth/dependencies.py`, `config.py`, `database/base.py`, `database/connection.py`, `create_tables.py`, every file under `schemas/`, and the empty `middleware/` directory. Two findings from this direct review shape this document more than anything in [[licensing-model-v1]] itself — see §9.4 and §24.1.

### 0.3 Scope

This document designs the **Teracom-side Licensing Service** — the backend system that issues, validates, and manages the lifecycle of licences for Teracom AI deployments across all three hosting models (§2). It does not design pricing (see [[pricing-model]], explicitly placeholder-only), does not design the Stripe↔Zoho invoicing relationship beyond where it touches licensing state (see §4.3), and does not re-litigate any already-DECIDED item in [[licensing-model-v1]].

---

## 1. Licensing Objectives

**DECIDED (why this exists at all):** Teracom AI is sold as a subscription, appliance-delivered product with no perpetual licences (LICENSING_MODEL_V1.md §8, §16; ADR-009). A technical mechanism is required to represent, issue, validate, and expire entitlement — this did not exist in any form before this document (§0.2).

**PROPOSED objectives, in priority order:**

1. **Represent a customer's commercial entitlement as a verifiable technical artifact** (the signed licence, §13) that a deployment can check against, independent of whether that deployment can reach a Teracom-operated server at request time (LICENSING_MODEL_V1.md §8's offline-capability requirement).
2. **Gate the human-approval step (§9, §11) as a real control**, not a UI-only checkbox — every entitlement-changing action (issuance, renewal, upgrade, worker pack, ownership transfer) must pass through a Teracom-side human decision before a new signed licence is produced. This is the one requirement every workflow section below is built around.
3. **Support the full decided lifecycle** (request → grace → Locked Mode, §12–14 there / §15–18 here) with each state's allowed actions matching the decided policy exactly — not "roughly," since §17's grace-period allowances and §18's Locked Mode restrictions are specific, named lists, not vague degradation.
4. **Support all three hosting models from one design**, including the case with no live Teracom server in the loop at all (Customer Hosted / Sovereign) — a design that only works when Teracom operates the infrastructure is not acceptable per LICENSING_MODEL_V1.md §3.
5. **Be auditable** (§21) — every decision in a human-approval-gated system is only as trustworthy as its audit trail.

**PROPOSED non-goals:**

- This service is not a pricing engine. Numeric entitlements (worker/user/org limits) are commercial facts fed into this service, not computed by it.
- This service is not a replacement for Zoho as the invoicing system of record (consistent with [[frontend-architecture]] §C.12's existing framing) — it is the *entitlement* system of record; Stripe/Zoho remain the *payment* system of record, connected at the points named in §4.3 and §12.
- This service does not attempt real-time phone-home enforcement as its primary mechanism — LICENSING_MODEL_V1.md §8 requires offline validation; a service designed around "the deployment can always reach us" would violate that for every Sovereign customer, and the "not decided" caveat on whether Teracom Hosted/Dedicated Hosted also needs this (§8) means the design must not assume otherwise for those either.

---

## 2. Subscription Model

**DECIDED — product tiers (LICENSING_MODEL_V1.md §2):**

| Tier | Workers | Users | Organisations | Billing |
|---|---|---|---|---|
| Starter | 5 | 10 (fixed) | 1 | Monthly or annual |
| Enterprise | 30 | Licensed User Count (per-contract) | Up to 5 | Monthly or annual |
| Platinum | 50 | Licensed User Count (per-contract) | Up to 30 | Monthly or annual |

**DECIDED — hosting models, selected independently of tier (§3):** Teracom Hosted, Dedicated Hosted, Customer Hosted (Sovereign).

**OPEN (§3, §19 #10):** which tier × hosting-model combinations are actually offered. This document's schema (§3–§4) stores tier and hosting model as independent fields precisely so this can be resolved later without a schema change — but no workflow in this document enforces a specific combination matrix, because none is decided yet. **This must be resolved before the Licence Request Workflow (§10) can validate a request's tier/hosting combination as legitimate** — until then, the request workflow can only record what was requested, not reject an unsupported combination.

**DECIDED — subscription-only, no perpetual licensing (§8; ADR-009):** every tier and hosting model bills on a recurring cadence; no one-time non-expiring licence is ever issued.

**PROPOSED — three distinct concepts, not one:** [[licensing-model-v1]] uses "licence" for both the commercial relationship and the technical artifact. This document separates them, because they have different lifecycles and different owners:

1. **Subscription** (§4) — the commercial/billing relationship: what tier and hosting model an organisation is paying for, on what cadence, in what payment state. This is the object Stripe/Zoho events update.
2. **Licence** (§3) — the signed technical artifact issued *from* an approved subscription state. A subscription can exist (and be paid) for a period before or after a licence file reflecting it is actually issued/valid — e.g., between requesting a renewal and it being approved.
3. **Entitlement** (§5) — the specific numeric/boolean grants encoded inside one licence (worker/user/org limits, hosting model, expiry). One licence has exactly one entitlement set; a subscription has a history of licences over its lifetime (renewals each produce a new one).

This separation is a design choice, not a re-litigation of the commercial model — the tiers, limits, and lifecycle timings above are unchanged from LICENSING_MODEL_V1.md; only the *technical* representation is being decomposed for auditability (a subscription's payment status and a licence's validity are genuinely different failure modes and must not share one row).

---

## 3. Licence Record Schema

**PROPOSED table: `licences`**

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | Matches this backend's existing UUID-PK convention on every table (§0.2). |
| `organisation_id` | UUID, FK → `organisations.id` | Teracom Hosted/Dedicated Hosted only — see §3.1 for why Sovereign is different. |
| `subscription_id` | UUID, FK → `subscriptions.id` | The commercial relationship this licence was issued from (§4). |
| `tier` | string | `starter` \| `enterprise` \| `platinum`. |
| `hosting_model` | string | `teracom_hosted` \| `dedicated_hosted` \| `customer_hosted_sovereign`. |
| `status` | string | `pending_issuance` \| `active` \| `grace` \| `locked` \| `superseded` \| `revoked`. See §17/§18 for `grace`/`locked` derivation. |
| `issued_at` | timestamp | |
| `expires_at` | timestamp | Term end — renewal (§15) window is computed against this (§12: up to 90 days before). |
| `hardware_fingerprint_id` | UUID, FK → `hardware_fingerprints.id`, nullable | Null until first bound (§9); nullable because a licence can exist between issuance and hardware-binding for Dedicated/Sovereign deployments not yet provisioned. |
| `signed_payload_ref` | string | Pointer to the actual signed licence file artefact (§13) — a content hash or storage key, not the raw bytes, kept out of the relational row per §22.2. |
| `key_version` | string | Which signing key version produced this licence — required for key rotation (§22.1) to know which public key validates which licence. |
| `superseded_by_licence_id` | UUID, FK → `licences.id`, nullable | Set when a renewal/upgrade/transfer issues a replacement — old rows are never deleted (§21). |
| `created_at` / `updated_at` | timestamp | Standard audit columns — notably **absent from every existing table in this backend** (§0.2); this is a deliberate correction, not an oversight, since every prior frontend package building against this backend independently found "no timestamp columns anywhere" to be a real, recurring limitation (KNOWLEDGE_IMPLEMENTATION_REPORT.md, MEMORY_IMPLEMENTATION_REPORT.md). |

### 3.1 Why Sovereign needs a different `organisation_id` story

**OPEN, newly identified:** For Teracom Hosted and Dedicated Hosted, `organisation_id` is a real foreign key into this backend's own `organisations` table, since Teracom's own database holds that customer's data. For Customer Hosted (Sovereign), the customer's own deployment holds its own `organisations` table — Teracom's licensing database has no live foreign-key relationship to a database it doesn't operate. **PROPOSED:** the Sovereign case stores a Teracom-side customer identifier (not the customer's own `organisation_id`) and the licence file itself carries whatever identifier the customer's own deployment uses to self-validate (§13) — but this needs the customer's own `organisations` table to expose a stable external identifier, which does not exist today (`organisations` has only `id, name, slug`, §0.2). Flagged as a backend-requirement dependency in §24.

---

## 4. Subscription Schema

**PROPOSED table: `subscriptions`**

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `organisation_id` | UUID, FK → `organisations.id` | Same Sovereign caveat as §3.1 applies. |
| `tier` | string | The tier currently being paid for — may differ from the *active licence's* tier for the window between an approved upgrade and the new licence being issued (§20). |
| `hosting_model` | string | |
| `billing_cadence` | string | `monthly` \| `annual` (§2). |
| `payment_status` | string | `active` \| `past_due` \| `cancelled`. |
| `stripe_customer_id` / `stripe_subscription_id` | string, nullable | Populated only for Teracom Hosted/Dedicated Hosted where Stripe is the payment rail (see §4.3) — **OPEN** whether Sovereign customers ever go through Stripe at all (not addressed anywhere in the reviewed documents). |
| `current_period_end` | timestamp | Drives `subscriptions.payment_status` transitions, independent of `licences.expires_at` (§3) — a subscription can be `past_due` while a licence remains `active` during grace, or vice versa if a customer pays but hasn't yet had a renewed licence approved. |
| `created_at` / `updated_at` | timestamp | |

### 4.1 Relationship to existing `organisations` table

**OPEN, carried from LICENSING_MODEL_V1.md §6:** "what 'organisation' means operationally for a single licence spanning multiple organisations (shared worker pool vs. per-organisation allocation) is not decided." This directly determines whether `subscriptions.organisation_id` is a single FK (one subscription per org) or needs a join table (one subscription spanning several `organisations` rows, for Enterprise's "up to 5 organisations" / Platinum's "up to 30"). **This document cannot finalize the subscription-to-organisation cardinality until this is resolved** — the schema above assumes the simpler single-FK case and is the first thing that would need to change if "shared pool across N orgs" is the eventual decision.

### 4.2 Relationship to existing `users`/`workers` counts

No schema change to `organisations`, `users`, or `workers` is proposed here — this document deliberately keeps entitlement *limits* in the new Licensing Service tables (§5) rather than adding limit columns onto the existing domain tables, so that enforcement (§7 open item) can be added as a check against these new tables without touching the tables three prior frontend packages (Workers, Administration, Package 9 itself) already depend on.

### 4.3 Stripe/Zoho bridge

**PROPOSED, consistent with [[frontend-architecture]] §C.12 (unchanged design target, still not built):** a Stripe webhook on `checkout.session.completed`/subscription-lifecycle events updates `subscriptions.payment_status` and `current_period_end`. This webhook does **not** issue a licence directly — it only updates the commercial record; issuance still requires the human-approval workflow (§9, §11) to run, even for a routine renewal payment, per LICENSING_MODEL_V1.md §9's "no licensing action is fully automated end-to-end."

---

## 5. Entitlement Schema

**PROPOSED table: `entitlements`** (one row per licence — a 1:1 child, kept separate from `licences` for clarity of what "the numbers" are versus what "the licence" is, and so a future entitlement field doesn't require touching the licence's own identity/status columns)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `licence_id` | UUID, FK → `licences.id`, unique | |
| `worker_limit` | integer | Base tier allocation (§2) plus any worker packs (§6) — **PROPOSED:** stored as the *effective* total, recomputed whenever a pack is added, not left for callers to sum at read time. |
| `user_limit` | integer, nullable | Starter: `10`. Enterprise/Platinum: the per-contract Licensed User Count (§7). Null is not used for Starter (it's a real fixed number); null would only apply if a future tier had no user limit at all, which is not the case for any tier today. |
| `organisation_limit` | integer | 1 / 5 / 30 per tier (§2, §8). |
| `hosting_model` | string | Duplicated from `licences.hosting_model` deliberately — an entitlement row should be a complete, self-contained statement of "what this licence grants" without a join, since it is this table (not `licences`) that a validation check (§14) reads at the moment of an enforcement decision. |

**OPEN (§4, carried verbatim):** worker-limit enforcement — "blocked immediately when the limit is reached" — is a **decided policy**, with **zero implementation** anywhere in the current backend. `POST /workers/` (existing, Package 3) has no limit check of any kind. This schema makes the limit *representable*; it does not itself add the enforcement check to `POST /workers/` — that is listed explicitly as required backend work in §24.

---

## 6. Worker Pack Schema

**DECIDED (§7):** two pack sizes, +5 and +10, as add-ons to a tier's base worker allocation.

**PROPOSED table: `worker_packs`**

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `licence_id` | UUID, FK → `licences.id` | |
| `pack_size` | integer | `5` or `10` — **PROPOSED** as a `CHECK` constraint, not a free integer, so a future pack size requires a deliberate schema/constraint change, not a silent acceptance of an unapproved size. |
| `quantity` | integer | How many of that pack size — supports stacking, pending the open item below. |
| `licence_request_id` | UUID, FK → `licence_requests.id` | The approved request that added this pack (§10/§11) — every pack addition is traceable to one human-approved decision. |
| `added_at` | timestamp | |

**OPEN (§7, carried verbatim):** which tiers packs are available on, whether packs bill monthly/annual like the base tier or as a one-time/prorated charge, whether there's a maximum stackable count, and whether adding a pack requires the same human-approval + re-issued-licence cycle as other entitlement changes (LICENSING_MODEL_V1.md assumes yes "by analogy," not explicitly confirmed). **This document assumes the "yes, same approval cycle" reading** (consistent with §9's general statement that any entitlement change requires approval) since building the request/approval pipeline (§10/§11) to *not* cover worker packs would require a second, different pipeline for no stated reason — but this assumption should be explicitly ratified, not left implicit.

`entitlements.worker_limit` (§5) is **PROPOSED** to be recomputed as `tier_base_workers + Σ(pack_size × quantity)` at the moment a pack request is approved (§11), not computed on every read — keeping the enforcement check (§24) a single-column read, not a join+sum on every worker-creation attempt.

---

## 7. User Limit Schema

Covered structurally in §5 (`entitlements.user_limit`). This section addresses the policy gap LICENSING_MODEL_V1.md §5 leaves explicit:

**DECIDED:** Starter is a fixed 10; Enterprise/Platinum use a per-contract "Licensed User Count," not a platform default.

**OPEN (§5, verbatim):** "Enforcement mechanism (how a user-count overage is detected/blocked) is not decided — no analogous 'blocked immediately' statement exists for users the way it does for workers." **This is a materially different open question from the worker one** — it is not merely "not implemented yet" (like worker enforcement), it is "the *policy itself* has no stated answer." **PROPOSED, for review, not as a substitute for a real decision:** two candidate designs exist and should be put to the project owner rather than inferred:

- **(a) Same as workers** — block `POST /users/` at the limit, immediately, no grace.
- **(b) Soft/advisory** — allow creation past the limit but surface an over-allocation state (e.g., in the Usage & Capacity view the frontend already built against illustrative data, `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §5) for a Teracom Hosted deployment where Teracom can see and reconcile the overage commercially, rather than blocking a customer's own user-management action outright.

This document takes no position on which is correct — it is flagged here specifically so implementation does not begin on a guessed answer.

---

## 8. Organisation Limit Schema

Covered structurally in §5 (`entitlements.organisation_limit`) and §4.1 (the cardinality question).

**DECIDED:** 1 / 5 / 30 per tier (§2, §6 of the source document).

**OPEN, this is the same item as §4.1, restated for this section's own heading:** "What 'organisation' means operationally for a single licence spanning multiple organisations... is not decided." Two structurally different implementations follow from the two possible answers, and they are not reconcilable after the fact without a data migration:

- **Shared pool:** one licence, one `worker_limit`/`user_limit` shared across up to N `organisations` rows — requires `subscriptions`/`licences` to reference a *set* of organisations, not one.
- **Per-organisation allocation:** each of the up to N organisations gets its own slice of the tier's limits — requires each organisation to have its own licence, with the tier's "up to N organisations" being a cap on how many licences one subscription can spin up, not a shared ceiling.

**This is the single most consequential open item blocking a final schema for Enterprise/Platinum tiers** (Starter is unambiguous — 1 organisation, no cardinality question). Flagged again in §24 as a resolve-before-migration item.

---

## 9. Hardware Fingerprint Strategy

**DECIDED (§10):** the fingerprint is composed from VM UUID, Disk UUID, and TPM (where available) — TPM is optional, not universally present.

**PROPOSED table: `hardware_fingerprints`**

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `licence_id` | UUID, FK → `licences.id` | One fingerprint currently bound per licence — see §9.3 for the re-binding case. |
| `vm_uuid` | string | |
| `disk_uuid` | string | |
| `tpm_present` | boolean | |
| `tpm_identifier` | string, nullable | Null when `tpm_present` is false. |
| `fingerprint_hash` | string | The single derived value actually compared at validation time (§9.2) — the raw components above are retained for audit/support, not re-derived on every check. |
| `bound_at` | timestamp | |
| `superseded_by_id` | UUID, FK → `hardware_fingerprints.id`, nullable | Set on re-binding (§9.3), never overwritten in place, per the same append-only principle as §3's `superseded_by_licence_id`. |

### 9.1 Combination algorithm — OPEN (§10, §19 #3)

**PROPOSED, for review:** `fingerprint_hash = SHA-256(vm_uuid || "\x00" || disk_uuid || "\x00" || (tpm_identifier or "none"))`, stored alongside a `fingerprint_version` (not shown as a separate column above for brevity, but required in the real schema) so a future algorithm change doesn't invalidate every existing fingerprint's meaning silently. This is a reasonable, simple starting point, not a claim that it resolves the open question — the project owner or a Licensing & Compliance Worker (see [[licensing-compliance-worker]]) should ratify or replace it.

### 9.2 Tolerance for routine hardware maintenance — OPEN (§10, verbatim)

A single disk replacement should plausibly not register as a licence violation, but no tolerance rule is decided. **PROPOSED, for review:** treat a fingerprint match as valid if **at least 2 of the 3 components** match (VM UUID + one of Disk UUID/TPM), rather than requiring all 3 — this is a design suggestion, not a decision, and needs explicit sign-off given it directly trades off fraud resistance against support-ticket volume.

### 9.3 Re-binding after a legitimate hardware change

**PROPOSED workflow:** a re-binding request is a distinct sub-type of the generic Licence Request Workflow (§10), requiring the same human approval as any other entitlement-adjacent change — a customer cannot silently re-point a licence at new hardware without Teracom's knowledge, which would otherwise be indistinguishable from unauthorized licence duplication.

### 9.4 Applicability to Teracom Hosted — OPEN (§10, verbatim), and a first-hand-verified reason it matters more than it looks

LICENSING_MODEL_V1.md flags "whether hardware binding is meaningfully applicable to Teracom Hosted deployments at all, since Teracom itself controls that hardware" as open. Direct review of `teracom-ai-backend` (§0.2) found **no existing concept of a deployment/instance identity at all** — no environment variable, config value, or database row anywhere represents "which physical or virtual host this backend process is running on." If hardware binding is deemed inapplicable to Teracom Hosted (the likely answer, since Teracom's own infrastructure doesn't need a fraud-resistance mechanism against itself), this document proposes `hardware_fingerprints` simply has no row for a Teracom Hosted licence, and validation (§14) treats hosting-model as the switch for whether fingerprint checking applies at all — but this is a design consequence of an open policy question, not a substitute for answering it.

---

## 10. Licence Request Workflow

**DECIDED (§9, restated):** no licensing action that changes entitlement is fully automated — every one of initial issuance, renewal, upgrade/entitlement-change, and ownership transfer requires human approval first.

**PROPOSED table: `licence_requests`** — one generic table for every request type, not one table per type, since every type shares the same state machine and approval gate:

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `organisation_id` | UUID, FK → `organisations.id` | Sovereign caveat as §3.1. |
| `subscription_id` | UUID, FK → `subscriptions.id`, nullable | Null for a brand-new customer's initial request, before a subscription row exists. |
| `existing_licence_id` | UUID, FK → `licences.id`, nullable | The licence being renewed/upgraded/transferred — null for initial issuance. |
| `request_type` | string | `initial_issuance` \| `renewal` \| `worker_pack` \| `tier_change` \| `hosting_change` \| `ownership_transfer` \| `hardware_rebind`. |
| `requested_by_user_id` | UUID, FK → `users.id` | The customer-side user who submitted it — this is where the three already-built frontend wizards (Renewal, Worker Pack, Ownership Transfer — `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §7) would write to, once this service exists. |
| `request_payload` | JSON | Type-specific fields (e.g. renewal's chosen cadence, transfer's new-owner details, pack's requested size) — kept as one flexible column rather than a wide table of nullable type-specific columns, given how different the payload shape is per `request_type`. |
| `status` | string | `submitted` \| `under_review` \| `approved` \| `rejected` \| `issued`. |
| `submitted_at` | timestamp | |
| `decided_at` | timestamp, nullable | |
| `decided_by_staff_id` | UUID, FK → `staff_users.id`, nullable | See §11.2 — this is **not** a `users.id` (customer-org user), a distinction this document treats as a required new concept, not an oversight. |
| `decision_notes` | text, nullable | |

### 10.1 State machine

```
submitted → under_review → approved → issued
                         ↘ rejected
```

`issued` is a terminal state reached only after the Licence Generation Workflow (§12) actually produces a new `licences` row referencing this request — `approved` and `issued` are kept distinct because approval and generation are not guaranteed to be instantaneous or same-transaction (§12 may involve external signing infrastructure, §22.1).

### 10.2 Why one table, not one per request type

A worker-pack request and an ownership-transfer request have almost nothing in common in their payload, but they have *everything* in common in their lifecycle and approval gate. Splitting into per-type tables would mean the approval workflow (§11) — the one piece of business logic every request type is required to go through identically (§9) — would need to be implemented or joined six times instead of once.

---

## 11. Human Approval Workflow

**DECIDED (§9):** the approval step exists and is required, for every entitlement-changing action.

**OPEN (§9, verbatim):** who performs it (a specific role — [[licensing-compliance-worker]] is "the most directly-named candidate... not confirmed as an approved workflow assignment"), what SLA applies, and whether a routine renewal needs the same scrutiny as a substantive change. **DECIDED, explicitly:** Tier 1 support (§17 of the source doc) is *not* the approver — "Tier 1 is an AI worker persona, not a human, and human approval is the whole point of this control."

### 11.1 A new authorization plane is required — this is the most significant structural finding in this document

Direct review of `teracom-ai-backend` (§0.2) confirms `auth/roles.py#require_role()` checks a single string field on a **customer organisation's own `users` row** (`admin` or `member`, in practice — §0.2). There is **no concept anywhere in this backend of a Teracom-internal staff account** — every authenticated identity in the system today belongs to exactly one customer organisation. Approving a licence request is fundamentally a **Teracom-side, cross-tenant action**: a Teracom staff member (or delegated worker persona, per §17's Tier 1/Tier 2 model, though Tier 1 is explicitly excluded from *this* control) must be able to see and decide on requests from *every* customer organisation, which the current single-tenant `organisation_id`-scoped user model cannot represent at all without a new, separate identity plane.

**PROPOSED table: `staff_users`** — deliberately **not** a role value added to the existing `users` table, because a Teracom staff member is not a member of any customer's organisation and giving them an `organisation_id` would be a category error (and a multi-tenant-isolation risk, given every existing query filters by `organisation_id` as its isolation boundary — §0.2/[[backend-status]] §2 calls this "reported as solid"; a staff account with a real `organisation_id` would be the first crack in that isolation model).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `email` | string, unique | |
| `password_hash` | string | Same `bcrypt` scheme as `auth/security.py` (§0.2) — reused, not reinvented. |
| `staff_role` | string | e.g. `licensing_approver`, `licensing_admin` — **OPEN**, since who exactly performs approval is itself unresolved (§9); this column exists so the schema doesn't block on that answer, but its actual permitted values are not decided. |
| `active` | boolean | |
| `created_at` | timestamp | |

**Consequence:** this backend needs a **second, parallel authentication surface** (a staff login, a staff JWT or session, staff-scoped route guards) before any approval endpoint (§23) can exist safely. This is listed as a required prerequisite in §24 — it is not a small addition; it is a new authentication subsystem next to the existing one, not an extension of it.

### 11.2 Approval action

**PROPOSED:** `POST /staff/licence-requests/{id}/decision` (staff-authenticated only, §23), body `{decision: "approved"|"rejected", notes: string}`. On `approved`, this triggers §12; the endpoint itself does not generate the licence synchronously, to keep the approval decision (a fast, simple state transition) decoupled from generation (which may involve signing infrastructure latency, §22.1).

---

## 12. Licence Generation Workflow

**PROPOSED sequence**, triggered by an approved `licence_requests` row:

1. Compute the effective entitlement (§5) — for `initial_issuance`/`renewal`, the subscription's current tier/hosting/packs; for `tier_change`/`hosting_change`/`worker_pack`, the *new* values from the approved request's payload.
2. Assemble the licence payload (§13).
3. Sign it (§13, §22.1) using the current active signing key (`key_version`).
4. Write the new `licences` row (`status = pending_issuance` until the customer's deployment actually confirms receipt/activation, then `active`).
5. If this supersedes a prior licence (renewal/upgrade/transfer), set the old row's `superseded_by_licence_id` — never delete it (§21).
6. Mark the originating `licence_requests` row `issued`.
7. Make the signed file available to the customer for download/upload (§19) — **OPEN:** the exact delivery mechanism (in-app download link vs. email vs. appliance-side pull) is not decided anywhere in the reviewed documents; this document assumes a download-then-manually-upload flow, consistent with the Grace Period Workflow's own decided "uploading a replacement licence" action (§17), but this should be confirmed, not assumed, for the *initial-issuance* case specifically (a brand-new customer with no deployment yet has a different delivery problem than an existing one renewing in place).

---

## 13. Signed Licence File Structure

**OPEN (§8, §19 #1–#2, verbatim):** exact file format, signing algorithm, and key custody are all explicitly not decided — carried forward unresolved from the original [[licensing-model]] draft.

**PROPOSED, for review — and one firm recommendation that is not merely a stylistic preference:**

### 13.1 Format: signed, structured payload (JWS-style), not a custom binary

A JSON payload with a detached or compact JWS (JSON Web Signature) envelope is recommended over a custom binary format, because it is inspectable (support staff can read an expired/rejected licence's claims without a custom parser), and because signature verification libraries for it exist in virtually every language an appliance might eventually be built to run on. This is a recommendation to *review*, not a claim that the format question is closed.

### 13.2 Signing algorithm: asymmetric, not the existing HS256 scheme — a direct finding, not a stylistic choice

**This is the one place in this document where direct backend review (§0.2) rules out an option outright, rather than just informing a recommendation.** `auth/security.py` signs the existing session JWT with **HS256 — a symmetric algorithm**, where the same secret both signs and verifies. **This cannot be reused for licence signing.** A licence must be verifiable by the customer's own deployment — including, for Customer Hosted (Sovereign), a deployment Teracom does not operate at request time (§1, §8). A symmetric scheme would require distributing the *signing* secret to every deployment that needs to *verify* a licence — at which point any customer could forge their own licence, which defeats the entire purpose of a signed artefact. **PROPOSED:** an asymmetric scheme (Ed25519 recommended for speed/simplicity, or RS256 if broader library compatibility is a stronger constraint) — Teracom holds the private key, every deployment ships only the public key, and the public key can be safely embedded even in an appliance Teracom does not control at runtime.

### 13.3 Proposed claims

```
{
  "licence_id": "<uuid>",
  "organisation_ref": "<Teracom-side identifier — see §3.1>",
  "tier": "enterprise",
  "hosting_model": "customer_hosted_sovereign",
  "entitlements": {
    "worker_limit": 30,
    "user_limit": 25,
    "organisation_limit": 5
  },
  "hardware_fingerprint_hash": "<sha256, or null for Teracom Hosted — §9.4>",
  "issued_at": "2026-08-15T00:00:00Z",
  "expires_at": "2027-08-15T00:00:00Z",
  "key_version": "v1"
}
```
with the JWS signature covering the whole payload, over the compact-serialization envelope (§13.1).

### 13.4 What remains genuinely open here

Exact field names/serialization, whether claims are encrypted as well as signed (nothing in the reviewed documents requires confidentiality, only integrity/authenticity — this document does not propose encryption, since there is no stated requirement to hide entitlement numbers from the customer who holds their own licence file), and public-key distribution/rotation mechanics (§19 #4, §22.1) all remain open and are not resolved by the recommendation in §13.2.

---

## 14. Licence Validation Workflow

**PROPOSED sequence**, run by a new module (§14.3):

1. Load the licence file (from local storage — the whole point of offline capability, §1, is that this step never requires a network call).
2. Verify the JWS signature against the embedded/distributed public key for the claimed `key_version` (§13.2, §22.1). Fail closed (treat as invalid) on any verification error, malformed payload, or unknown `key_version`.
3. If `hardware_fingerprint_hash` is present (i.e., hosting model requires it — §9.4), recompute the current host's fingerprint (§9.1) and compare per the tolerance rule (§9.2, itself open).
4. Check `expires_at` against the current time. **This is where the offline-capable + time-based-expiry tension (§19 #7, explicitly unresolved — "clock-tampering resistance... unaddressed") is unavoidable:** an offline deployment's only source of "now" is its own system clock, which the deployment's own operator can set backward. **PROPOSED, for review, not a resolution:** accept this as a residual risk for V1, mitigated only by (a) requiring the deployment to also track a monotonic "last known good" timestamp locally and refusing to accept a validation as valid if the system clock is *earlier* than that stored value (catches naive rollback, not sophisticated tampering), and (b) treating this explicitly as an accepted risk in the Security Requirements (§22.5), not a solved problem.
5. Derive `status`: `active` if within term, `grace` if within 30 days past `expires_at` (§17), `locked` otherwise (§18).
6. Cache the validation result locally with a short re-check interval (**PROPOSED**, not decided: e.g. re-validate every 24 hours, or on every application restart, whichever is more frequent) — so that routine request handling never re-runs steps 1–5 synchronously, keeping the offline-capability requirement compatible with acceptable request latency.

### 14.1 Where this runs

`teracom-ai-backend`'s `middleware/` directory exists in the source tree today and is **completely empty** (§0.2) — no middleware of any kind is registered. This is the natural home for a licence-validation check that runs once per process lifecycle (or on the cached interval above), gating which routers are reachable based on the derived `status` (§17, §18) — **PROPOSED**, not existing code, and this document does not write it (per its own governing constraint).

### 14.2 What this replaces from this frontend's own Package 9

`teracom-ai-frontend`'s Billing & Licensing package (`BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md`) built Grace Period and Locked Mode as **UI previews only**, explicitly not wired to any real enforcement, "since no backend licence-validity signal exists to drive that safely" (that report, §8). Once this validation workflow exists and is exposed (§23), that frontend package's preview toggle is the concrete integration point to replace with a real status read — but that is a future frontend change, out of this document's own scope (it modifies neither frontend nor backend code).

### 14.3 Relationship to hosting model

For Teracom Hosted/Dedicated Hosted, this check can run centrally (Teracom operates the server either way). For Customer Hosted (Sovereign), this check **must** run inside the customer's own deployment process, using only the embedded public key (§13.2) and the locally-stored licence file — there is no "ask Teracom" fallback path in this design, consistent with §1's objective 4.

---

## 15. Renewal Workflow

**DECIDED (§12):** renewal may be requested up to 90 days before expiry.

**OPEN (§12, verbatim):** whether there's a minimum renewal window (the latest a renewal can still be requested before lapsing into grace), and whether renewal is ever automatic — "read literally, the approved decision describes a request window, not an auto-renewal mechanism; treat renewal as request-driven until stated otherwise."

**PROPOSED sequence:** a `licence_requests` row with `request_type = renewal`, `existing_licence_id` set, submitted any time the current licence's `expires_at` is within 90 days (enforced as a validation on request creation — a renewal request submitted earlier than that is rejected at the API layer, §23, not silently accepted and left pending). Follows the same §10/§11/§12 pipeline as every other request type. On approval, the new licence's `issued_at` is the approval date and `expires_at` extends by one term length from the *prior* `expires_at` (not from "now") — so a renewal requested 60 days early does not shorten the customer's actual term by those 60 days. **Term length itself is not explicitly stated anywhere in the reviewed documents beyond "monthly or annual" billing cadence (§2)** — this document assumes the licence term matches the subscription's billing cadence, which is a reasonable inference, not a separately confirmed decision.

---

## 16. Ownership Transfer Workflow

**DECIDED (§11):** allowed; requires human approval, same principle as §9.

**OPEN (§11, verbatim):** how a transfer is initiated (self-service vs. support ticket), what information the new owner must provide, whether a transfer resets the renewal/grace-period clock, and whether re-establishing the hardware fingerprint is required as a matter of course.

**PROPOSED:** a `licence_requests` row, `request_type = ownership_transfer`, `request_payload` capturing both a snapshot of current ownership (organisation name/identifier at time of request) and the proposed new-owner details — regardless of how the open questions above resolve, capturing both snapshots is correct either way, and this is exactly the shape the frontend's already-built Ownership Transfer wizard already collects (`BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §7: Current Ownership → New Ownership → Transfer Reason → Review → Submit). **This document takes no position** on whether approval of a transfer request should also automatically trigger a `hardware_rebind` request (§9.3) — that depends on the open "does transfer imply hardware re-establishment" question, and forcing it without an explicit decision would be presumptive.

---

## 17. Grace Period Workflow

**DECIDED (§13):** 30 days after expiry without a completed renewal; during it, **login, data export, uploading a replacement licence, and requesting renewal** remain allowed — nothing else is named as allowed.

**PROPOSED implementation:** `licences.status` is derived as `grace` by the validation workflow (§14) whenever `now` is between `expires_at` and `expires_at + 30 days`. The gating middleware (§14.1) allowlists exactly four capabilities during this state:

1. Authentication (`POST /auth/login`, `GET /auth/me` — already exist).
2. **Data export — does not exist anywhere in the current 39 registered routers (§0.2).** This is a genuinely new backend requirement this document's review surfaced: the grace-period policy names a capability the product does not currently have in any form, for any user, licensed or not. Building a real data-export endpoint (organisation-scoped, covering at minimum workers/knowledge/memory/chat history) is a prerequisite for the grace period policy to be honoured as written, not an optional nicety — flagged in §24.
3. Licence upload (a new endpoint, §23).
4. Renewal request (§15, already designed above).

Every other existing router (workers, knowledge, chat, memory, admin, permissions, connectors) is **not** on this allowlist and must return a clear, distinct response (e.g. `403` with a body identifying the grace-period state, not a generic permission error) during `grace`.

---

## 18. Locked Mode Workflow

**DECIDED (§14):** after the grace period ends without a valid licence, the deployment enters Locked Mode; a valid licence is required to exit it; **only licence-management functions remain available** — chat, worker management, knowledge, admin, everything else is inaccessible.

**PROPOSED implementation:** `licences.status = locked` once `now > expires_at + 30 days` with no superseding active licence. The same gating middleware (§14.1) now allowlists a **narrower** set than grace — deliberately narrower, since §14's decided policy does not repeat grace's "data export" allowance for Locked Mode:

1. Licence upload.
2. Renewal request (arguably redundant once locked — a locked deployment likely can't reach anything requiring a live approval round-trip if it's Sovereign and phone-home-less anyway, but the request itself can still be *recorded* locally and synced once connectivity/approval completes).
3. Viewing the current (expired) licence's own details, so a customer/support agent can see what lapsed.

**This document explicitly does not extend data-export access into Locked Mode** — the decided policy (§14 of the source document) does not list it for this state the way §13 lists it for grace, and this document does not infer an allowance the source document didn't state, consistent with §0.1's OPEN-item discipline (the omission here is read as deliberate, not an oversight, since §13's list for grace is specific and §14's list for locked is *also* specific and shorter).

### 18.1 Contrast with the existing frontend's Locked Mode preview

`BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §8 built a Locked Mode *preview screen* that does not restrict `/portal/**` at all — a deliberate frontend-only choice made because no backend signal existed to drive real enforcement safely. This document's §14/§18 design is what would need to exist before that frontend preview could become real enforcement; this document does not itself change that frontend code.

---

## 19. Appliance Deployment Integration

**DECIDED (§16):** a customer receives exactly four things — compiled application, signed licence, upgrade packages, configuration. No source code, no ad hoc file access, no self-build/self-deploy.

**OPEN (§16, verbatim):** exact packaging/delivery mechanism (container image vs. signed installer, etc.) for the compiled application and upgrade packages, and how upgrade packages interact with the hardware-bound licence (does an upgrade require a new licence file, or does the existing one remain valid across upgrades?).

**PROPOSED, for review:**

- The signed licence (§13) is versioned independently of the application version — an upgrade should not, by default, require a new licence, *unless* the new application version's entitlement schema changes in a way the old licence's claims can't express (e.g. a new tier or a new entitlement field). **PROPOSED:** the licence payload (§13.3) includes a `min_supported_app_version` claim, checked by the validation workflow (§14) at application startup, so an incompatible upgrade fails validation with a clear "licence does not cover this version" message rather than an ambiguous runtime error — this is a design recommendation addressing the open question, not a resolution of it (the underlying packaging/delivery mechanism is still undecided).
- Because this backend has **no dependency manifest committed** at all today (`requirements.txt`/`pyproject.toml` absent — §0.2, [[backend-status]] §1) and **no migration framework** (§24.1), "appliance packaging" is not a small addition on top of the current repository state — both of those gaps would need to be closed first for a "compiled application" to even be a well-defined, reproducible artefact to sign and ship. This is listed as a prerequisite in §24, not assumed away.

---

## 20. Upgrade Entitlements

**OPEN (§15, verbatim) — no approved decision was supplied for this heading beyond a "reasonable inference":** any upgrade (tier change, hosting-model change, additional worker pack) is delivered as a re-issued signed licence file, gated by the same human-approval step as renewal/transfer. **Explicitly open:** proration/billing treatment of a mid-term upgrade, whether downgrades are supported at all, whether an upgrade takes effect immediately on approval or at the next billing cycle, and whether worker packs can be removed once added or only added.

**PROPOSED:** upgrades and downgrades both route through the same `licence_requests` pipeline (§10, `request_type = tier_change` / `hosting_change` / `worker_pack`) as every other entitlement change — this document does not propose a separate mechanism, since none of the open questions above change *which* pipeline handles the request, only *what happens after approval* (proration, timing). Those specifics should not be encoded into this schema speculatively; `licence_requests.request_payload` (a flexible JSON column, §10) is deliberately schema-flexible so the eventual decision doesn't require a migration to accommodate it.

---

## 21. Audit Requirements

**Not explicitly named as a requirement anywhere in LICENSING_MODEL_V1.md or BILLING_AND_LICENSING_UX.md — this section is this document's own addition**, justified directly from §9's decided human-approval principle: an approval step that leaves no durable record of who decided what, when, and why is not meaningfully auditable, and every prior frontend package's own smoke-testing discipline (finding and documenting real gaps, e.g. `ADMIN_IMPLEMENTATION_REPORT.md`'s permission-duplication bug) has repeatedly shown that "the policy says X" and "the system actually does X, verifiably" are different claims.

**PROPOSED table: `licensing_audit_log`** — append-only, no update/delete path exposed anywhere in the API surface (§23):

| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `event_type` | string | `request_submitted` \| `request_approved` \| `request_rejected` \| `licence_issued` \| `licence_superseded` \| `licence_revoked` \| `entered_grace` \| `entered_locked` \| `licence_uploaded` \| `hardware_rebind`. |
| `licence_id` / `licence_request_id` | UUID, nullable FKs | Whichever applies to this event. |
| `actor_type` | string | `staff` \| `customer_user` \| `system` (for automatic transitions like `entered_grace`, which no human triggers). |
| `actor_id` | UUID, nullable | FK to `staff_users` or `users` depending on `actor_type`; null for `system`. |
| `detail` | JSON | Event-specific context (e.g. the before/after entitlement values for a tier change). |
| `occurred_at` | timestamp | |

**PROPOSED retention:** indefinite — this is the record LICENSING_MODEL_V1.md §9's approval requirement exists to produce evidence of; no retention/deletion policy is proposed here, since none is stated as a requirement anywhere reviewed, and deleting audit history for a compliance-adjacent control would need its own explicit justification this document does not have grounds to assume.

---

## 22. Security Requirements

### 22.1 Signing key custody — OPEN (§8, §19 #2, verbatim)

**PROPOSED, for review:** the private signing key (§13.2) is never stored in this backend's own database or environment variables the way `JWT_SECRET_KEY` currently is (§0.2 — a plain environment variable, adequate for a session secret, not for a licence-signing key whose compromise would let an attacker forge licences for every customer). **Recommend** a dedicated secrets-management service or HSM, external to the application database, with the signing operation itself exposed to the Licence Generation Workflow (§12) as a narrow, audited call — not a key the application process reads directly into memory the way `config.py` reads `JWT_SECRET_KEY` today. Key rotation policy (how often, how overlap during rotation is handled so in-flight licences signed with the prior key still validate) is not decided and is not proposed here beyond noting that `key_version` (§3, §13.3) is the mechanism that would make rotation possible at all.

### 22.2 Licence file integrity

The JWS signature (§13.1) covers the entire claims payload — any modification to any field invalidates the signature. `licences.signed_payload_ref` (§3) stores a pointer/hash, not the raw signed bytes, in the relational database, consistent with keeping the actual sensitive artefact in whatever storage backs §22.1's signing infrastructure rather than duplicating it into a database backup/replica surface unnecessarily.

### 22.3 Hardware-fingerprint spoofing resistance — OPEN

Not addressed by any reviewed document. A sufficiently motivated customer could report false VM/Disk UUID values (§9) since these are read from within the customer's own controlled environment, not attested by independent hardware. TPM-backed attestation (where TPM is present, §9) is stronger, but §10's own "where available" phrasing already concedes TPM isn't universal. **This document does not propose a resolution** — flagged as a real, unresolved fraud-resistance gap, not glossed over.

### 22.4 Staff authentication surface — see §11.1

The new `staff_users` authentication plane (§11.1) must not share any code path with the customer-facing `users` authentication that could allow a customer-org JWT to be mistaken for a staff credential or vice versa — **PROPOSED:** a distinct JWT `aud` (audience) claim or entirely separate token issuance path, checked explicitly by any staff-only endpoint (§23), not merely a different `role` string value on the same token shape (the existing `require_role()` pattern, §0.2, is a same-token, different-string-value check — reusing that exact pattern for staff-vs-customer would conflate two identities that must never be interchangeable).

### 22.5 Clock-tampering resistance — OPEN (§19 #7, verbatim, "unaddressed")

See §14 step 4's residual-risk mitigation proposal. This document does not claim to resolve the fundamental tension between offline-capable validation and time-based expiry — it is stated here again because a "Security Requirements" section that didn't name it would understate a real, acknowledged gap.

### 22.6 Multi-tenant isolation — no new risk introduced, if §11.1 is followed

The existing backend's isolation model (every query scoped by `organisation_id`, "reported as solid" per [[backend-status]] and independently confirmed by this document's own §0.2 review) is not weakened by this design **provided** `staff_users` is never given an `organisation_id` and staff-only endpoints never accept a customer-session JWT (§22.4). This document flags this as a requirement to preserve, not a risk this design introduces on its own.

---

## 23. API Requirements

**PROPOSED endpoint groups** (none exist today — §0.2 confirms zero of the 39 existing routers relate to licensing):

### 23.1 Customer-facing (existing customer JWT, `organisation_id`-scoped)

| Endpoint | Purpose |
|---|---|
| `GET /licensing/status` | Current licence summary (tier, hosting, status, expiry, entitlements) — the real data source `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md`'s Overview page would call, replacing its illustrative reference data. |
| `GET /licensing/usage` | Real consumption vs. entitlement (workers/users/orgs) — note the frontend's Usage & Capacity page (`BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §5) already computes the *consumption* half from existing endpoints (`GET /worker-list/`, `GET /users/`, `GET /organisations/`); this endpoint would only need to supply the *entitlement* half that frontend currently sources from illustrative data. |
| `POST /licensing/requests` | Create a `licence_requests` row (§10) — body includes `request_type` and type-specific payload. |
| `GET /licensing/requests` | List the calling organisation's own request/approval history — the real data source for the frontend's Requests & Approval History page (currently static example rows, `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §7). |
| `POST /licensing/upload` | Upload a replacement licence file (§17, §18) — multipart, one file. |

### 23.2 Staff-only (new `staff_users` authentication plane, §11.1/§22.4)

| Endpoint | Purpose |
|---|---|
| `GET /staff/licence-requests` | Queue of pending requests across **all** organisations — the reason §11.1's new identity plane is required at all. |
| `POST /staff/licence-requests/{id}/decision` | Approve/reject (§11.2). |
| `GET /staff/licensing-audit` | Read access to `licensing_audit_log` (§21). |

### 23.3 What this document deliberately does not specify

Exact request/response JSON schemas, pagination parameters, and error-response shapes are left to implementation-time design — this document fixes the *endpoint shape and authorization boundary* (customer vs. staff), which is the architecturally load-bearing decision; the wire-level detail is not decided here and should follow whatever convention emerges from resolving §24's prerequisites (e.g. once a migration framework and dependency manifest exist, per §24.1/§24.4, a schema/response convention should be fixed once, not per-endpoint).

---

## 24. Database Migration Requirements

### 24.1 The most consequential single finding in this document

Direct review (§0.2) confirms `teracom-ai-backend` has **no migration framework of any kind**. `create_tables.py` is the entirety of schema management: it imports every model and calls `Base.metadata.create_all(bind=engine)` — a one-shot operation that creates tables that don't yet exist and **does nothing to an existing table**. There is no Alembic, no versioned migration history, no rollback mechanism, and no record anywhere of which schema state a given database is in.

**This is a prerequisite that blocks safely introducing any of this document's proposed tables in a system that already has production data.** `create_tables.py` can add net-new tables (`licences`, `subscriptions`, `entitlements`, `worker_packs`, `licence_requests`, `hardware_fingerprints`, `staff_users`, `licensing_audit_log` — all new, no existing table is altered) without itself being unsafe, **but** the complete absence of migration tooling means there is no safety net if any of those table definitions need to change after first deploy, and no tooling exists to apply schema changes to a database that already has rows in it (which every customer's Teracom Hosted/Dedicated Hosted database will, by the time this service ships). **PROPOSED:** adopt Alembic (the standard companion to SQLAlchemy, the ORM this backend already uses in its 2.0-style declarative form, §0.2) before writing the first line of this service's model code — not as part of this service's own migration, but as a foundational, backend-wide capability this service is simply the first serious consumer of.

### 24.2 New tables this architecture introduces (once §24.1 exists)

`licences` (§3), `subscriptions` (§4), `entitlements` (§5), `worker_packs` (§6), `hardware_fingerprints` (§9), `licence_requests` (§10), `staff_users` (§11.1), `licensing_audit_log` (§21). Eight new tables, zero altered existing tables, zero dropped tables.

### 24.3 Existing tables this architecture reads but does not alter

`organisations` (referenced by FK, per §3.1's caveat about Sovereign), `users` (referenced by FK for `requested_by_user_id`), `workers` (read-only, for entitlement enforcement checks against `entitlements.worker_limit`, §5's open enforcement item).

### 24.4 Other backend prerequisites this document's review surfaced, not directly schema-related

- **No dependency manifest** (`requirements.txt`/`pyproject.toml`) exists (§0.2, [[backend-status]] §1) — needed for this service's new dependencies (a JWS/asymmetric-crypto library at minimum, §13.2) to be reproducibly installable, and needed regardless for §19's appliance-packaging requirement.
- **No data-export endpoint exists in any form** (§17) — required for the Grace Period Workflow's decided policy to be implementable at all, independent of anything else in this document.
- **No CORS middleware, no request-scoped middleware of any kind** exists (`middleware/` is empty, §0.2) — the validation workflow's gating logic (§14.1) is the first thing that would populate this directory; this is an empty extension point, not a conflict to resolve.

### 24.5 Summary: what must exist before implementation begins

In dependency order:

1. A migration framework (§24.1) — blocks everything else in this list.
2. A dependency manifest (§24.4) — blocks reproducible builds of anything using new libraries (signing, §13.2).
3. Resolution of §4.1/§8's organisation-cardinality question — blocks finalizing `subscriptions`/`licences`' relationship to `organisations` for Enterprise/Platinum.
4. Resolution of §13.2's signing algorithm choice (a recommendation is made; ratification is still required) and §22.1's key-custody mechanism — blocks §12 (generation) and §14 (validation) both.
5. The new `staff_users` authentication plane (§11.1) — blocks §11.2/§23.2, and therefore blocks any approval ever actually happening.
6. A real data-export endpoint (§17) — blocks the Grace Period Workflow matching its own decided policy.

Nothing in this list is optional scaffolding — each is a hard dependency of a DECIDED policy this service exists to implement, not a nice-to-have this document is padding its scope with.
