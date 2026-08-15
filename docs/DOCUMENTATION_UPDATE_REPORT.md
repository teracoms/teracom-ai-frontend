# Documentation Update Report — Licensing Model V1 & UX Vision

**Date:** 2026-08-15
**Scope:** documentation only, per explicit instruction — no frontend or backend application code was read for modification or changed in this pass. This report inventories what was created and updated, and follows the same pattern as `docs/DOCUMENTATION_REPORT.md` (the original knowledge-base creation report), but for this specific update.

---

## 1. What triggered this update

The project owner supplied a new set of approved commercial/licensing decisions (Licensing Model V1: product tiers, hosting models, worker/user/organisation limits, additional worker packs, hardware-bound licensing, human approval and ownership-transfer workflows, renewal/grace-period/Locked Mode lifecycle, upgrade entitlements, the appliance deployment model, the support model, and the Partner/MSP model) and a UX design direction (Natural Language First, Wizard Second, Forms Last), both dated 2026-08-15, and asked for the Teracom Operating Knowledge Base to be brought current against them.

## 2. Files created

| File | Purpose |
|---|---|
| `docs/commercial/LICENSING_MODEL_V1.md` | New source of record for licensing. Documents all 16 requested areas, explicitly separating what the supplied decisions cover (tiers, hosting models, worker/user/org limits, packs, hardware fingerprint, human approval, ownership transfer, renewal, grace period, Locked Mode, appliance model, support model) from what they don't (upgrade-entitlement mechanics, the Partner/MSP model — no content was supplied for either) and from what the original draft left open and still isn't resolved (signing key custody, licence file format, clock-tampering resistance, revocation). §19 consolidates all of this into one open-questions table. |
| `docs/governance/UX_VISION.md` | New governance document. Covers UX philosophy, UX roadmap, wizard strategy, the AI-native platform vision, a priority wizard list, and design-evaluation rules, per the request. The core philosophy is recorded as approved; the roadmap/priority ordering/rubric are explicitly marked as this document's proposed operationalisation, not a separately-approved sequencing commitment, since no specific approved content beyond the philosophy itself was supplied for those sections. |
| `docs/commercial/LICENSING_CHANGELOG.md` | New, licensing-scoped append-only changelog (separate from the general [[changelog]]), first entry dated 2026-08-15 detailing exactly what changed structurally (editions → tier + hosting-model axes) and what was newly decided vs. still open. |
| `docs/DOCUMENTATION_UPDATE_REPORT.md` | This document. |

## 3. Files updated

| File | What changed |
|---|---|
| `docs/commercial/COMMERCIAL_MODEL.md` | §2's edition table replaced with the tier table (Starter/Enterprise/Platinum) plus a separate hosting-model table; §3 rewritten to explain hosting model — not tier — as the axis that changes the licensing mechanism; §5's "not decided" list updated to remove now-resolved items (renewal window, grace period, Locked Mode, worker-overage policy) and add newly-surfaced open items (tier × hosting-model combinations, the Partner/MSP model, upgrade/downgrade mechanics). |
| `docs/commercial/PRODUCT_EDITIONS.md` | Restructured from three edition sections (Starter/Enterprise/Sovereign) into a Tiers section (Starter/Enterprise/Platinum, with the new organisation-count and Licensed-User-Count concepts) and a separate Hosting Models section (Teracom Hosted/Dedicated Hosted/Customer Hosted (Sovereign)). Cross-tier notes updated to reflect the new worker-limit policy and the still-open tier×hosting question. |
| `docs/governance/ROADMAP.md` | Commercial/licensing track table: added a "Licensing Model V1 approved" row and a "UX Vision approved" row; updated the editions-approved row to note it was restructured the same day; updated the Sovereign-licensing-architecture row to distinguish decided policy (now substantial) from still-open mechanism detail; flagged that `docs/commercial/PRICING_MODEL.md`'s seat table is now stale against the new tier structure. Added a fifth sequencing principle pointing future packages at the UX Vision's design-evaluation rubric. |
| `docs/governance/ARCHITECTURE_DECISIONS.md` | Appended ADR-011 (Licensing Model V1 — tiers restructured, hosting decoupled from tier) and ADR-012 (UX principle: Natural Language First, Wizard Second, Forms Last), per the append-only rule — no existing ADR was edited. |
| `docs/governance/CHANGELOG.md` | Appended one dated entry (2026-08-15) summarising both approvals and pointing to the new/updated documents, per [[documentation-standards]] §4's rule that a commercial/licensing decision gets a changelog entry. This file was not explicitly named in the request but is the knowledge base's own standing rule for any commercial/licensing change — see §5 below. |
| `docs/commercial/LICENSING_MODEL.md` | Not rewritten (decision logs are append-only) — a short superseded banner was added at the top pointing to [[licensing-model-v1]], so it can't be read as still-current. |

## 4. A structural ambiguity resolved during this pass

The supplied decisions list "Hosting Models" (Teracom Hosted / Dedicated Hosted / Customer Hosted (Sovereign)) as its own category, separate from the tier list (Starter / Enterprise / Platinum). The prior knowledge base had modelled "Sovereign" as a third *edition*, defined by being customer-hosted — i.e. hosting was collapsed into the edition name. Treating the new decisions literally required un-collapsing that: tier and hosting model are now documented as two independent choices, with "Sovereign" surviving only as the name of one hosting model, not an edition. This is called out explicitly in [[licensing-model-v1]] §1, [[product-editions]]'s new header, and ADR-011, precisely because it's the kind of framing change a worker skimming only the tier table could otherwise miss.

## 5. What was not in scope, and what's left open as a result

Per the request, only the four named documents were updated, plus the four newly-created ones. Two further discrepancies were noticed but **not** corrected in this pass, since they weren't named in the request and touching them would have gone beyond a documentation-only, explicitly-scoped task:

- **`docs/governance/PROJECT_STATE.md`** §4 and §5 item 2 still describe "Sovereign Edition" in the old edition-based framing (e.g. "Sovereign Edition requires hardware-bound, offline-capable licensing that doesn't exist in any form today"). This is now imprecise given hosting model is decoupled from tier — it should be updated to reference Customer Hosted (Sovereign) and [[licensing-model-v1]] specifically, by whoever next verifies that snapshot document (per [[documentation-standards]] §2, snapshot docs need their own re-verification, not a drive-by edit from an unrelated task).
- **`docs/workforce/LICENSING_COMPLIANCE_WORKER.md`** still points its onboarding sequence at [[licensing-model]] §3's original 9-open-questions list rather than [[licensing-model-v1]] §19's consolidated one. It should be updated to reference the new document the next time that role's onboarding is touched.
- **`docs/commercial/PRICING_MODEL.md`** still shows the pre-V1 Starter/Enterprise/Sovereign seat table. It wasn't in the update list (pricing figures remain explicitly not-decided either way), but its structural table is now stale against [[product-editions]] and should be refreshed alongside whenever pricing is actually finalised — flagged in [[roadmap]]'s updated table.

These are recorded here, not silently fixed, per [[documentation-standards]] §7 ("treat every stale entry found as a bug to fix... in the same change where it's discovered" — for entries genuinely inside this change's scope) balanced against the explicit instruction to keep this pass documentation-only and scoped to the named files. A future pass should treat the three items above as its starting work order.

## 6. Confirmation

No files under `app/`, `components/`, `lib/`, `middleware.js`, or any other application-code path were modified. All changes in this pass are under `docs/`.
