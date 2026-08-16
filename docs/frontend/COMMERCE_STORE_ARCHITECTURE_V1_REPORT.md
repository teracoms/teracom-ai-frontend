# Commerce Store Architecture V1 — Report

**Date:** 2026-08-16 · **Type:** Documentation-only change · **Scope:** `docs/frontend/`

---

## 1. Task

Produce a first-hand, production-ready architecture document for the existing `/store` commerce surface, with decided/proposed separation, so [[website-information-architecture-v2]] §4 could link to it instead of duplicating store detail (per [[documentation-standards]] §6). Documentation only — no frontend, backend, or code changes.

## 2. Files created

| File | Purpose |
|---|---|
| `docs/frontend/COMMERCE_STORE_ARCHITECTURE_V1.md` | 14-section architecture document — objectives, current architecture, all six proposed pipeline stages assessed against actual code, security notes, consolidated gaps and open questions |
| `docs/frontend/COMMERCE_STORE_ARCHITECTURE_V1_REPORT.md` | This report |

## 3. Files read first-hand to produce the architecture document

`lib/products.js`, `lib/feed-importer.js`, `lib/stripe.js`, `lib/zoho.js`, `app/store/page.js`, `components/CheckoutButton.js`, `app/api/checkout/route.js`, `app/api/webhooks/stripe/route.js`, `app/api/admin/import-feed/route.js`, `app/checkout/success/page.js`, `app/checkout/cancel/page.js`, `app/api/leads/route.js`, `.env.example`. Cross-checked against `docs/frontend/FRONTEND_ARCHITECTURE.md` (§A store/checkout inventory, and the Billing/Package 9 bridge design), `docs/commercial/COMMERCIAL_MODEL.md` §4, `docs/governance/CHANGELOG.md` (founding entry and the 2026-08-14 store-reorganisation entry), and `docs/governance/ARCHITECTURE_DECISIONS.md` (ADR-001's scope, confirmed it names `/store` explicitly).

## 4. Key findings

- **The "Commerce Store Model" pipeline in `WEBSITE_INFORMATION_ARCHITECTURE_V1.md` (Supplier Feed → Import → Category Mapping → 20% Markup → AI Product Enrichment → Publish) is roughly 15% built.** Feed parsing (three formats) is real; the import endpoint that's supposed to consume it is a no-op with respect to the live catalogue (parses and returns, never persists); the remaining four stages (Category Mapping, Markup, AI Enrichment, Publish) have zero corresponding code anywhere in the repository. This was verified by reading every file in the store's code path, not inferred from the IA document's description.
- **A live risk was found that wasn't previously documented anywhere:** the Stripe webhook handler has no idempotency check against the event or session ID before creating a Zoho contact/invoice. A Stripe-initiated redelivery of `checkout.session.completed` (which Stripe does on non-2xx response or timeout) would create a duplicate invoice today. This is flagged as higher priority than any of the aspirational pipeline work, since it's a currently-live financial-data-integrity gap, not a future design question.
- **`/store`'s current UI is a flat, uncategorised grid** despite every product carrying a `category` field and despite `docs/governance/CHANGELOG.md` recording a 2026-08-14 commit (`fe56328`) that reorganised the store into categories — the flat-grid structure was confirmed by reading `app/store/page.js` directly, so this document reports the current state as found rather than assuming the changelog's historical commit is still reflected in the live page.

## 5. Structural decisions

- **Placed under `docs/frontend/`, not a new top-level directory.** The store is entirely frontend-repository code today (confirmed — zero backend involvement), and `docs/frontend/` already holds `FRONTEND_ARCHITECTURE.md`/`FRONTEND_STATUS.md` as the pattern for frontend-code architecture documents. Per [[documentation-standards]] §1, a new top-level directory wasn't warranted for one document.
- **BUILT / DECIDED / PROPOSED labelling**, matching the scheme introduced in the companion `WEBSITE_INFORMATION_ARCHITECTURE_V2.md` produced in the same batch of work, rather than inventing a third, different scheme — the two documents are meant to be read together (§4 of the IA doc links here).
- **Every pipeline stage from the original IA document gets its own numbered section (§3–§7)** even where the honest content is "this doesn't exist" — this was a deliberate choice over silently dropping the unbuilt stages, so a future reader sees the full six-stage target and exactly how much of it exists, rather than only learning about the parts that happen to be built.
- **A proposed product data model (§7)** is included as a design input for future implementation, explicitly marked as unratified — it exists because §4's category-mapping gap and §5's markup gap both depend on a schema decision (raw vs. canonical category, cost vs. price fields) that doesn't exist in any form today; without naming a candidate shape, the open questions in those sections would have nothing concrete to be resolved against.

## 6. Verification

- Every "no code exists for X" claim (category mapping, markup, AI enrichment, publish gate, cart/multi-item checkout, webhook idempotency) was checked by reading the actual relevant file(s) rather than assumed from the IA document's silence on implementation — each is cited to the specific file(s) reviewed.
- The ADR-001 scope claim (that it covers `/store` explicitly) was checked against `docs/workforce/CTO_WORKER.md`/`WEB_DEVELOPER_WORKER.md`'s existing citations of it, which both list `/store` in ADR-001's off-limits surface — not re-derived from scratch.
- The webhook idempotency finding was verified by reading `app/api/webhooks/stripe/route.js` end to end and confirming no session/event-ID tracking exists anywhere in the handler or in any other file that might record processed events.

## 7. Not done (explicitly out of scope)

- No fix was implemented for the webhook idempotency gap, the import-token scoping gap, or any other finding — this is a documentation-only architecture review, not a remediation.
- No ADR was added recording ADR-001's applicability to any future store redesign that might follow from this document's findings.
- No changes to `lib/products.js`, `lib/feed-importer.js`, or any other store-related code.
