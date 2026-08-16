# Commerce Store Architecture V1

**Status:** Draft V1, 2026-08-16. A first-hand architecture review of the existing `/store` commerce surface in `teracom-ai-frontend`, produced to give [[website-information-architecture-v2]] §4 something concrete to link to instead of duplicating store detail inline (per [[documentation-standards]] §6). Every file cited below was read directly as part of producing this document — this is first-hand sourcing (per [[documentation-standards]] §5), not a second-hand summary.

Per [[documentation-standards]] §2, **decided** is separated from **not decided** throughout: **BUILT** marks a first-hand-verified fact about the current codebase, **DECIDED** marks a ratified decision (ADR or approved governance/commercial document), and **PROPOSED** marks a drafted target with no ratification — most of the store's "target pipeline" content inherited from [[website-information-architecture-v1]] is PROPOSED, not BUILT.

---

## 1. Objectives

**BUILT / DECIDED:** the commerce store is not a future initiative — it is a live, functioning purchase flow today: a customer can browse a flat product grid at `/store`, pay via Stripe Checkout, and receive a Zoho Books invoice. This predates the Teracom AI product entirely — per [[changelog]]'s founding entry, the repository's starting point (`4728541`, "Initial V4 copied from Foundation") *was* this marketing/commerce site plus Stripe checkout and Zoho invoicing, with `/portal` a placeholder stub at the time.

**PROPOSED objectives for this document** (this document's own framing, not a re-litigation of a business decision):
1. Give hardware, software-licence, digital, and services SKUs relevant to the electronic-security industry a single sales surface, alongside the two SecurityOS AI subscription SKUs.
2. Keep the store's payment/PCI surface entirely inside Stripe Checkout (already true — see §8) rather than growing a bespoke payment/cart system.
3. Eventually connect a purchase to a Teracom AI organisation/user record for the two subscription SKUs specifically (already scoped as future work in [[commercial-model]] §4 and [[frontend-architecture]] — not attempted here, only cited).

**PROPOSED non-goals:** this document does not propose the store become a general e-commerce platform (no multi-vendor marketplace, no bidding/quoting engine) — it stays a curated, Teracom-controlled catalogue per the existing model.

## 2. Current architecture (BUILT, first-hand)

| Layer | File(s) | What it does |
|---|---|---|
| Catalogue | `lib/products.js` | A **hardcoded JavaScript array** of 14 products (id, sku, name, description, priceCents, category, type, features). No database, no CMS, no admin UI — adding/changing a product requires a code change and a deploy. |
| Storefront page | `app/store/page.js` | Server Component. Renders one hero section plus a single flat `.product-grid` mapping over the entire `products` array — **no category grouping, filtering, or search** despite every product having a `category` field. |
| Checkout trigger | `components/CheckoutButton.js` | The one client component in the whole repository (`'use client'`, local `useState`) — `fetch('/api/checkout', ...)` then redirects the browser to the returned Stripe URL. |
| Checkout session creation | `app/api/checkout/route.js` | Validates `{productId, quantity}` with `zod`, looks up the product via `findProduct()`, creates a Stripe Checkout Session (`mode: 'subscription'` if `product.type === 'subscription'`, else `'payment'`), embeds `productId`/`sku`/`productType` as session metadata, returns the session URL. |
| Payment provider | `lib/stripe.js` | Thin `Stripe` SDK client wrapper, API version pinned to `2024-06-20`. |
| Post-payment pages | `app/checkout/success/page.js`, `app/checkout/cancel/page.js` | Static confirmation pages; no order lookup or summary is displayed — success page shows a generic thank-you message, not the actual purchased item. |
| Invoicing webhook | `app/api/webhooks/stripe/route.js` | Verifies the Stripe signature, and on `checkout.session.completed`, best-effort creates a Zoho contact + invoice via `lib/zoho.js` (only if `ZOHO_REFRESH_TOKEN` is set and the product/email are resolvable). |
| Accounting integration | `lib/zoho.js` | OAuth refresh-token → access-token exchange against Zoho Books (Australia data centre), then `createZohoContact` / `createZohoInvoice`. |
| Supplier feed parsing | `lib/feed-importer.js` | Pure parsing functions for CSV, JSON, and XML feed formats into a common `{sku, name, description, price, stock, category, supplier}` shape. |
| Feed import endpoint | `app/api/admin/import-feed/route.js` | Token-gated (`ADMIN_IMPORT_TOKEN`, plain string equality) POST endpoint: validates `{token, type, content}`, calls `parseFeed()`, and returns the parsed products **in the HTTP response only**. |
| Lead capture | `app/api/leads/route.js` | Unrelated to the store's product/payment flow, but the same "form POST → side effect" pattern; logs the submitted form to console and redirects — no persistence, no CRM sync beyond the console log. |

## 3. Supplier feed & import (BUILT vs. PROPOSED)

**BUILT:** `parseFeed()` correctly parses well-formed CSV, JSON, or XML into a common shape, and `POST /api/admin/import-feed` is protected by a shared static bearer token compared with `!==` (not a timing-safe comparison, not scoped per-supplier, no expiry).

**Critical gap (BUILT, i.e. verified by reading the code, not inferred):** the import endpoint **does not persist anything**. It parses the submitted feed content and returns the parsed array in the JSON response — there is no write to `lib/products.js`, no database, no cache, nothing. Calling this endpoint today has zero effect on what `/store` actually displays or what `/api/checkout` can sell. The "importer" and the live catalogue are two entirely disconnected code paths.

**OPEN, following directly from the gap above:**
- Where does an imported product actually live once persisted — a new table in `teracom-ai-backend`'s Postgres, a frontend-only datastore, or a third-party PIM? Not decided.
- Is there a dedup/upsert key (`sku` is the obvious candidate) for re-importing an updated feed, or does every import fully replace the catalogue? Not decided — no logic of either kind exists today.
- Is the import triggered manually (as today, a POST with a bearer token) or scheduled (cron/webhook from a supplier)? Not decided.
- What happens to a malformed row — `parseCsvFeed`/`parseXmlFeed` silently default missing `price`/`stock` to `0` rather than rejecting the row; is that the intended behaviour for a real supplier feed? Not decided, flagged as a likely correctness gap.

## 4. Category mapping (PROPOSED only — no implementation exists)

[[website-information-architecture-v1]]'s six-category taxonomy (Security → CCTV/Access Control/Intrusion Detection/Intercoms/Facial Recognition; Networking; Infrastructure; Audio Visual; Automation; Software) has **no corresponding code**. Today, `category` is a free-text string set independently in two places that never talk to each other:
- `lib/products.js`'s hardcoded entries use ad hoc values (`'Software'`, `'Access Control'`, `'CCTV'`, `'Intrusion'`, `'Digital'`, `'Services'`) that only partially overlap the proposed six-category taxonomy (no `Networking`, `Infrastructure`, `Audio Visual`, or `Automation` products exist yet; `Intrusion` vs. the proposed `Intrusion Detection` is already a naming mismatch).
- `parseFeed()`'s output carries whatever `category` string a supplier feed happens to contain, verbatim, with no normalisation against either the `products.js` values or the proposed taxonomy.

**PROPOSED (this document, for review, not implemented):** a category-mapping table (`supplier_category_raw → canonical_category`) would need to exist before feed imports and the hardcoded catalogue could share one consistent taxonomy — this is new design work, not a wiring exercise, since no canonical category enum exists anywhere today (`getCategories()` in `lib/products.js` simply derives the list from whatever's currently hardcoded, i.e. it reflects the data, it doesn't constrain it).

## 5. Pricing / "20% Markup" rule (PROPOSED only — no implementation exists)

[[website-information-architecture-v1]]'s pipeline names a "20% Markup" stage between Category Mapping and AI Product Enrichment. **No markup calculation exists anywhere in the codebase.** `lib/products.js`'s `priceCents` values are flat, hand-set figures with no visible derivation from a cost/wholesale field, and `parseFeed()`'s `price` field is carried straight through with no markup applied and no distinction between a supplier's wholesale price and a customer-facing retail price.

**OPEN:**
- Is 20% a flat margin on every category, or does it vary (hardware vs. software vs. services likely warrant different margins in practice)? Not decided.
- Is markup applied at import time (computed once, stored) or at render/checkout time (computed live from a stored cost field)? Not decided — meaningfully affects the data model in §7.
- Who owns changing the markup percentage — is it a constant, a per-supplier setting, or a per-category setting? Not decided.

## 6. AI Product Enrichment (PROPOSED only — no implementation exists)

No code anywhere references product-description enrichment, image generation, or any LLM/AI call in the store's checkout or import path. This stage is entirely undesigned. **Observation, not a decision:** `teracom-ai-backend` already operates Chroma (vector store) and `sentence-transformers` embeddings for the Knowledge platform (per [[frontend-architecture]] §B), and Ollama for chat generation — a future enrichment step could in principle reuse that existing LLM/embedding infrastructure rather than standing up a separate one, but this is this document's own observation for [[cto-worker]] to evaluate, not a proposed design.

## 7. Publish pipeline & product data model (PROPOSED)

There is no "publish" gate today — every entry in `lib/products.js` is live on `/store` the instant it's deployed; there is no draft/staged state. A real pipeline (Import → Category Mapping → Markup → Enrichment → Publish) implies a product record with at least a lifecycle status (`draft | pending_review | published | archived`), which does not exist in any form today.

**PROPOSED product data model** (for review — a design input, not a ratified schema):

| Field | Notes |
|---|---|
| `id`, `sku` | `sku` should be the natural upsert key for re-imports (see §3) |
| `name`, `description`, `features` | Carried forward from the current `products.js` shape |
| `category_raw`, `category_canonical` | Raw supplier value vs. mapped taxonomy value (see §4) |
| `cost_cents`, `price_cents`, `markup_percent` | Split to make the markup rule (§5) auditable rather than baked into a single opaque price |
| `supplier`, `source_feed_type` | From `feed-importer.js`'s existing parse output — currently discarded after the parse step |
| `status` | `draft \| pending_review \| published \| archived` — the missing "publish" gate |
| `stock` | Already parsed by `feed-importer.js` but never surfaced anywhere in the storefront today |

**OPEN:** where this table lives (§3) is the prerequisite decision before this schema can be ratified anywhere.

## 8. Checkout & payments (BUILT)

- Stripe Checkout Sessions are created server-side per purchase attempt; PCI card-data handling is entirely inside Stripe's hosted page — the frontend never touches card data. This is a sound, decided-by-default pattern (using a hosted provider) and this document does not propose changing it.
- `mode` (`subscription` vs. `payment`) is derived from `product.type`, and `recurring.interval` is hardcoded to `'month'` for subscriptions — there is no annual-billing option for the two SecurityOS AI SKUs today, which is a mismatch with [[commercial-model]]'s stated "monthly or annual" billing cadence for the actual Teracom AI product tiers (a different system — see §10 — but worth flagging since the SKU names imply a connection).
- **OPEN:** there is no cart and no multi-item checkout — `CheckoutButton` always sends `quantity: 1`; a customer wanting two units of a hardware product cannot express that in the UI today (the API accepts a `quantity` field, but nothing in the UI sets it above 1).
- **OPEN:** no coupon/discount code support, no tax handling visible in the Checkout Session creation call (Stripe can compute this, but it isn't configured here).

## 9. Fulfilment & invoicing (BUILT, with a flagged risk)

- On `checkout.session.completed`, the webhook creates a Zoho contact then a Zoho invoice, **best-effort**: any failure is caught and only `console.error`'d — there is no retry, no dead-letter record, and no way for anyone to discover a failed sync after the fact except reading server logs.
- **Risk, first-hand finding:** the webhook handler has **no idempotency check** against `event.id` or the Stripe session ID before creating a Zoho contact/invoice. Stripe redelivers webhook events on a non-2xx response or timeout; a retried `checkout.session.completed` for the same session would currently create a **second** Zoho contact/invoice for the same purchase. This is a real, currently-live risk, not a hypothetical — flagged here for [[software-developer-worker]] and [[cybersecurity-worker]] to prioritise a fix (e.g. recording processed session IDs) ahead of any of the PROPOSED pipeline work above, since it affects real money/invoicing today.

## 10. Organisation/licensing bridge — link, not duplicate

The relationship between this store's Stripe/Zoho flow and the Teracom AI product's organisation/user/billing model is already designed in detail elsewhere and is **not re-derived here**, per [[documentation-standards]] §6:
- [[commercial-model]] §4 — as-is state and the target bridge.
- [[frontend-architecture]] (Billing/Package 9 section) — the specific proposed checkout/webhook changes (capturing `organisation_id` at checkout, a new backend `POST /organisations/{id}/billing` provisioning call) and why the "new customer, no account yet" path is flagged as the highest-complexity piece.
- [[roadmap]] Package 9 — sequencing.

This document's only addition: whatever provisioning bridge is eventually built must also solve the §9 idempotency gap, since a duplicated webhook delivery would then risk double-provisioning an organisation, not just double-invoicing.

## 11. Security & compliance notes

- **BUILT, acceptable today:** PCI scope is fully offloaded to Stripe Checkout — no card data ever reaches this application. Stripe webhook signature verification (`stripe.webhooks.constructEvent`) is correctly used before trusting any webhook payload.
- **BUILT, flagged gap:** `ADMIN_IMPORT_TOKEN` is a single static shared secret compared with plain `!==`, with no expiry, no per-supplier scoping, and no audit trail of who imported what, when. Given §3's finding that this endpoint doesn't persist anything yet, the practical risk today is low, but this must be hardened *before* §3/§7's persistence work ships — an unaudited bearer token writing directly into a live product catalogue is a materially different risk than one that currently only echoes back what it parsed.
- **BUILT, consistent with the rest of the app:** Zoho and Stripe secrets live in environment variables (`.env.example`), matching this repository's existing secrets-in-env convention (already tracked as a broader pattern, not a new finding of this document).

## 12. Backend/frontend gaps — consolidated

| Gap | Where | Severity |
|---|---|---|
| No persistence for imported feed data | `app/api/admin/import-feed/route.js` | High — the importer is currently a no-op with respect to the live catalogue |
| No webhook idempotency check | `app/api/webhooks/stripe/route.js` | High — live risk of duplicate Zoho invoices today |
| No category taxonomy shared between catalogue and feed import | `lib/products.js`, `lib/feed-importer.js` | Medium — blocks §4 entirely |
| No markup calculation | `lib/products.js`, `lib/feed-importer.js` | Medium — blocks §5 entirely |
| No product lifecycle/publish state | `lib/products.js` | Medium — every hardcoded entry is implicitly "published" |
| No cart / multi-item checkout in the UI | `components/CheckoutButton.js`, `app/store/page.js` | Low–Medium — quantity is API-capable but UI-fixed at 1 |
| No admin UI to manage the catalogue | (none exists) | Medium — every change requires a code deploy |
| No AI enrichment step | (none exists) | Low — fully aspirational, no dependency blocks other work |
| `ADMIN_IMPORT_TOKEN` lacks scoping/expiry/audit | `app/api/admin/import-feed/route.js` | Medium, rising to High once §3 persistence ships |

## 13. Open questions log (consolidated)

| # | Question | Owner |
|---|---|---|
| 1 | Where does the product catalogue live once import actually persists (backend Postgres, frontend-only store, PIM)? | [[cto-worker]] / [[software-developer-worker]] |
| 2 | Is markup a flat 20% everywhere or category/supplier-specific, and computed at import or at render time? | [[project-manager-worker]] / project owner |
| 3 | Is AI enrichment worth reusing the existing backend Chroma/embedding infrastructure, or a separate build? | [[cto-worker]] |
| 4 | Should the import token be replaced with per-supplier credentials before persistence work starts? | [[cybersecurity-worker]] |
| 5 | Should the webhook idempotency gap (§9) be fixed ahead of any of the pipeline work above, given it's a live risk? | [[software-developer-worker]] / [[cybersecurity-worker]] |
| 6 | Does the two SecurityOS AI subscription SKUs' fixed monthly-only Checkout mode need to support annual billing to match [[commercial-model]]'s stated cadence? | [[licensing-compliance-worker]] / [[project-manager-worker]] |

## 14. Cross-references

[[website-information-architecture-v2]] §4 · [[frontend-architecture]] §A, §B, and the Billing/Package 9 section · [[commercial-model]] §4 · [[roadmap]] Package 9 · [[architecture-decisions]] ADR-001 (marketing-site redesign boundary, covers `/store`) · [[changelog]] (founding entry and the 2026-08-14 store-reorganisation-and-revert entry)
