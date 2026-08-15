# Pricing Model

**Status:** Structure only — **no price points have been approved.** Do not quote figures from this document to a customer or partner; treat every number placeholder as a gap to escalate, not fill in.

---

## 1. What's actually decided

Only the **structure** below is approved (per [[product-editions]]):

| Edition | Seats | Billing cadence options |
|---|---|---|
| Starter | 5 | Monthly or annual |
| Enterprise | 30 | Monthly or annual |
| Sovereign | Negotiated | Term-based (not perpetual), cadence not specified |

## 2. What's explicitly NOT decided

- Monthly and annual price points for Starter and Enterprise — no figures approved.
- Whether annual billing carries a discount versus monthly, and if so, how much.
- Sovereign Edition pricing — likely deal-specific/negotiated given the custom deployment nature, but no pricing methodology (e.g. cost-plus, per-seat-equivalent, flat licence fee) has been chosen.
- Any add-on pricing for individual worker types, additional seats beyond an edition's base allocation, or usage-based components (chat volume, storage, knowledge ingestion volume).
- Currency and regional pricing (the existing commerce site prices in a single currency for hardware/services via Stripe — whether AI subscription pricing follows the same convention is undecided).
- Discounting, trial periods, or grandfathering policy for existing customers if prices change later.

## 3. How this connects to the existing commerce flow

The current `/store` page already has two placeholder SecurityOS AI subscription SKUs wired into Stripe Checkout (see `docs/frontend/FRONTEND_ARCHITECTURE.md` §C.12) — these are **placeholders for the mechanism**, not evidence of approved pricing. Whoever finalises pricing must update those Stripe Price objects and the corresponding SKU definitions in `lib/products.js` as part of that work, not treat the current placeholder values as a starting price to adjust from.

## 4. Who should complete this document

A Project Manager Worker or the project owner needs to bring approved figures back before this document can be considered authoritative. Until then, any worker (especially a future CTO Worker or Project Manager Worker producing customer-facing collateral) should treat the absence of numbers here as a hard stop, not infer pricing from competitor benchmarks or industry norms.
