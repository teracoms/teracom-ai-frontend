# Commercial Model

**Status:** Editions and worker catalogue approved by the project owner, 2026-08-15. Tiers and hosting model **restructured** the same day under Licensing Model V1 — see [[licensing-model-v1]] and ADR-011 in [[architecture-decisions]]. Implementation not yet started — see [[roadmap]] §Billing & Licensing.

This document is the top-level commercial framing. For tier-specific detail see [[product-editions]]; for the full licensing lifecycle (renewal, grace period, hardware binding, human approval, appliance model, support model) see [[licensing-model-v1]] (the current source of record — the original [[licensing-model]] draft is superseded); for what customers pay see [[pricing-model]].

---

## 1. What is being sold

Teracom AI sells **access to a fixed catalogue of AI Worker personas** ([[worker-catalogue]]) operating inside a customer's organisation, backed by the RAG/chat platform described in [[frontend-architecture]] and (for the backend) [[backend-status]]. The commercial unit is **the worker seat**, not a per-user or per-API-call metric — an edition entitles an organisation to run up to N workers concurrently, drawn from the approved catalogue.

This is a deliberate choice: it's simple to explain to a buyer ("5 workers" vs. "30 workers"), it maps directly onto the backend's existing `workers` table (one row per active worker, scoped to `organisation_id`), and it avoids needing to meter chat volume, token usage, or storage in V1.

## 2. The three tiers, at a glance

Tier and hosting model are now two independent axes (as of Licensing Model V1, [[licensing-model-v1]] §1) — a tier no longer implies a hosting location.

| Tier | Workers | Users | Organisations | Billing |
|---|---|---|---|---|
| **Starter** | 5 | 10 | 1 | Monthly or annual |
| **Enterprise** | 30 | Licensed User Count | Up to 5 | Monthly or annual |
| **Platinum** | 50 | Licensed User Count | Up to 30 | Monthly or annual |

| Hosting model | Description |
|---|---|
| **Teracom Hosted** | Multi-tenant, Teracom-operated infrastructure — the model used to date. |
| **Dedicated Hosted** | Single-tenant, still Teracom-operated. |
| **Customer Hosted (Sovereign)** | Runs on the customer's own infrastructure — no Teracom server in the loop at request time. |

Which tier × hosting-model combinations are actually offered is **not decided** — see [[licensing-model-v1]] §3. Full tier/hosting detail: [[product-editions]].

## 3. Hosting model is the axis that changes the licensing mechanism, not tier

Every tier bills and is entitled the same way (seat-style limits, monthly/annual subscription). Hosting model is what changes the *enforcement mechanism*: Teracom Hosted and Dedicated Hosted both run on Teracom-operated infrastructure, so entitlement can (once built) be checked against a Teracom-hosted billing record synced from Stripe. Customer Hosted (Sovereign) is **architecturally different** — the backend runs on the customer's own infrastructure, so Teracom cannot rely on a central server to check entitlement at request time. This is why Customer Hosted (Sovereign) needs a signed, hardware-bound licence file rather than a live subscription check — see [[licensing-model-v1]] §8–10 for the mechanism, and ADR-009/ADR-011 in [[architecture-decisions]] for the decision record (ADR-009 is the original decision; ADR-011 is the V1 restructuring that decoupled this from a specific edition name).

## 4. Relationship to the existing Stripe/Zoho commerce flow

The current `/store` page already sells hardware, services, and two placeholder SecurityOS AI subscription SKUs via Stripe Checkout, with Zoho handling invoicing — entirely disconnected from any organisation/user concept (see `docs/frontend/FRONTEND_ARCHITECTURE.md` §C.12 for the as-is state). The commercial model above is the target this checkout flow needs to grow into: checkout must eventually capture organisation identity, and the Stripe webhook must become the provisioning point that creates/updates the backend's (not-yet-existing) organisation billing record. None of that bridge exists yet — this is future work, tracked in [[roadmap]] as Package 9.

## 5. What is explicitly NOT decided yet

Several items from the original draft are now resolved by [[licensing-model-v1]] (renewal window, grace period, Locked Mode, worker-overage policy) — see that document §19 for the consolidated resolved/open list. What remains genuinely open:

- Exact price points per tier (draft structure only — see [[pricing-model]]).
- Which tier × hosting-model combinations are actually offered ([[licensing-model-v1]] §3).
- Signing key custody, licence file format, clock-tampering resistance, and revocation for the Customer Hosted (Sovereign) licensing mechanism ([[licensing-model-v1]] §8, §19).
- Upgrade/downgrade mechanics and proration ([[licensing-model-v1]] §15), and additional worker pack availability/billing ([[licensing-model-v1]] §7).
- The Partner/MSP model — no approved decisions exist for this at all yet ([[licensing-model-v1]] §18).
- Whether individual worker types within the catalogue can be priced/sold separately from the seat-count model, or whether all 9 catalogue entries are uniformly available at any tier.
- Worker-limit enforcement is a **decided policy** (blocked immediately at the limit) but not yet implemented anywhere technically — see [[licensing-model-v1]] §4 and [[project-state]] §5.

Any worker (especially a future Licensing & Compliance Worker or Project Manager Worker) picking up commercial/billing work should treat the above as open questions to raise, not assumptions to fill in silently.
