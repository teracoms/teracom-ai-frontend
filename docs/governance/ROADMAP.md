# Roadmap

**Last updated:** 2026-08-15
**Source:** `FRONTEND_ARCHITECTURE_V1.md` Part E (Recommended Implementation Order), reconciled with actual shipped state in [[project-state]].

This is the sequencing plan for the authenticated product build-out, plus the commercial/licensing work that runs alongside it. Order matters — later packages assume earlier ones exist (e.g. Chat needs the Worker picker from Package 3). See [[current-sprint]] for what's active right now.

---

## Product build-out (frontend + backend, sequenced)

| # | Package | Status | Depends on | Notes |
|---|---|---|---|---|
| 1 | **Auth foundation** | ✅ Shipped | — | Nothing else can be built or demoed without this. See `docs/frontend/IMPLEMENTATION_REPORTS/AUTHENTICATION_IMPLEMENTATION_REPORT.md`. |
| 2 | **Dashboard** | ✅ Shipped | 1 | Lowest endpoint complexity; doubled as the smoke test that the whole pipe works. See `docs/frontend/IMPLEMENTATION_REPORTS/DASHBOARD_IMPLEMENTATION_REPORT.md`. |
| 3 | **Worker management** | ⬜ Not started — **next up** | 1, 2 | List/detail/create. Establishes the `DataTable`/card/detail-tabs patterns every later screen reuses. No worker-edit or worker-delete endpoint exists backend-side yet — V1 has no edit/delete affordance; flagged as a backend gap, not a frontend omission. |
| 4 | **Knowledge management** (excl. connectors) | ⬜ Not started | 3 | List, upload, detail. Upload is the first multi-step interaction (file → ingest → redirect); worth validating early since chat quality depends on it. |
| 5 | **Chat** | ⬜ Not started | 3, 4 | Needs the worker picker (3) and benefits from knowledge already existing (4) for non-empty context. Backend chat is fully synchronous/non-streaming — UI is a loading spinner, not token-by-token. |
| 6 | **Memory** | ⬜ Not started | 5 | Thin, low-risk. Naturally follows chat since that's where memories are actually created. |
| 7 | **Administration** (users/organisation/permissions) | ⬜ Not started | 1–6 | Deliberately placed after the core product loop — operationally important, not part of a new org's first-run experience. No user-role-change/deactivation/delete endpoints exist backend-side — create+list only in V1. |
| 8 | **Knowledge connectors "coming soon" state** | ⬜ Not started | 4 | Cosmetic — SharePoint/OneDrive/Teams are 100% backend stubs today; must be presented as disabled, not implied-working. Can slot in any time after 4. |
| 9 | **Billing & Licensing** | ⬜ Not started — **backend schema conversation should start now, in parallel, not after step 7** | none (parallel track) | The single longest-lead-time item in the whole roadmap: requires new backend columns/tables (`plan`, `status`, `seat_limit`, `stripe_customer_id`), a new webhook branch, and the "new customer, no account yet" provisioning path. See [[commercial-model]], [[licensing-model]], ADR-010 in [[architecture-decisions]]. |

## Commercial / licensing track (runs alongside, not after, the product build-out)

| Milestone | Status | Notes |
|---|---|---|
| Editions approved (Starter / Enterprise / Sovereign) | ✅ Approved by stakeholders, 2026-08-15; **restructured same day** | See [[product-editions]]. Superseded by the next row — tier (Starter/Enterprise/Platinum) and hosting model are now independent axes, not one edition name. Not yet reflected in any code or schema either way. |
| Licensing Model V1 approved (tiers, hosting models, worker/user/org limits, worker packs, hardware-bound licensing, human approval, renewal/grace-period/Locked Mode lifecycle, appliance model, support model) | ✅ Approved, 2026-08-15 | See [[licensing-model-v1]] and ADR-011 in [[architecture-decisions]]. Resolves most of the prior open-design-question list; several items remain open ([[licensing-model-v1]] §19) — signing key custody, licence file format, clock-tampering resistance, revocation, tier × hosting-model combinations, upgrade/downgrade mechanics, and the Partner/MSP model. |
| Worker catalogue approved (9 worker types) | ✅ Approved, 2026-08-15 | See [[worker-catalogue]]. Only the AI-agent-persona mechanism exists backend-side (the `workers` table); none of the 9 specific catalogue entries are seeded/instantiated anywhere yet. |
| Backend billing schema design | ⬜ Not started | Blocking dependency for Package 9 above. Needs a Licensing & Compliance Worker or human + backend owner. Now has concrete lifecycle requirements to design against (renewal window, grace period, Locked Mode) per [[licensing-model-v1]], rather than an open question list alone. |
| Stripe↔backend provisioning webhook | ⬜ Not started | Depends on backend billing schema existing first. |
| Customer Hosted (Sovereign) licensing architecture (signed/encrypted licence file, hardware binding, offline validation) | ⬜ Not started — **design phase not begun**; policy decided, mechanism still greenfield | Lifecycle policy (renewal, grace period, Locked Mode, hardware-fingerprint inputs) is now decided — see [[licensing-model-v1]] §10, §12–14. Mechanism-level detail (signing key custody, file format, clock-tampering resistance, revocation) remains entirely open. See ADR-009/ADR-011 in [[architecture-decisions]]. |
| Pricing finalised per tier | ⬜ Not started | See [[pricing-model]] — structure is drafted, numbers are placeholders pending commercial sign-off. Note: [[pricing-model]]'s seat table still reflects the pre-V1 Starter/Enterprise/Sovereign structure and needs updating to Starter/Enterprise/Platinum before it's used for anything customer-facing. |
| UX Vision approved (Natural Language First / Wizard Second / Forms Last) | ✅ Approved, 2026-08-15 | See [[ux-vision]] and ADR-012 in [[architecture-decisions]]. Governs new screen design going forward — does not retroactively re-scope Packages 1–7. Roadmap/priority ordering in [[ux-vision]] §5 is proposed, not approved sequencing. |

## Sequencing principles (carried from the architecture doc, still binding)

1. Everything in the product build-out is additive to `/portal/**` — none of it requires touching `/`, `/securityos-ai`, `/store`, or `/checkout/**` (ADR-001).
2. Package 9 (Billing & Licensing) is a **parallel track starting now**, not a step-9 surprise — the architecture doc is explicit that starting this conversation late is the biggest schedule risk in the whole plan.
3. Do not reorder 3→4→5→6 lightly — each has a genuine data/UX dependency on the one before it, not just a suggested order.
4. Any change to this sequencing (e.g. pulling Admin forward, descoping connectors) should be recorded as a new dated entry in [[changelog]] and reflected here, not silently reordered.
5. New screens from Package 8 onward should be evaluated against [[ux-vision]] §6's design-evaluation rubric (natural language → wizard → form, in that order) before defaulting to a form, per ADR-012 in [[architecture-decisions]]. This does not reopen or re-sequence Packages 1–7.
