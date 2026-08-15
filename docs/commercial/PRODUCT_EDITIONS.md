# Product Editions

**Status:** Approved by the project owner, 2026-08-15; tiers/hosting model **restructured** the same day under Licensing Model V1 (see [[licensing-model-v1]], ADR-011 in [[architecture-decisions]]). Not yet implemented in code, schema, or billing. See [[commercial-model]] for the framing and [[roadmap]] for build sequencing.

**What changed:** the original three editions (Starter / Enterprise / Sovereign) bundled hosting location into the edition name — Sovereign *was* "the customer-hosted one." V1 splits this into two independent axes: a **product tier** (this document, §Tiers) and a **hosting model** (§Hosting models). "Sovereign" is now the name of a hosting model (Customer Hosted (Sovereign)), not a tier — see [[licensing-model-v1]] §1 for the full rationale.

---

## Tiers

### Starter

- **Workers:** 5, drawn from the approved [[worker-catalogue]].
- **Users:** 10, fixed.
- **Organisations:** 1.
- **Billing:** monthly or annual, customer's choice.
- **Target buyer:** smaller security-integrator or single-site customer wanting a bounded, predictable worker roster (e.g. one CTO Worker + one QA Worker + a handful of specialists) without needing the full catalogue.

### Enterprise

- **Workers:** 30, drawn from the approved [[worker-catalogue]].
- **Users:** Licensed User Count — a per-customer contractual figure, not a fixed default (see [[licensing-model-v1]] §2, §5).
- **Organisations:** up to 5.
- **Billing:** monthly or annual, customer's choice.
- **Target buyer:** larger organisation or multi-site integrator needing most or all of the worker catalogue active across multiple teams and up to five organisations.

### Platinum

- **Workers:** 50, drawn from the approved [[worker-catalogue]].
- **Users:** Licensed User Count, same mechanism as Enterprise.
- **Organisations:** up to 30.
- **Billing:** monthly or annual, customer's choice.
- **Target buyer:** the largest multi-organisation deployments — e.g. a group/holding structure or a large MSP running many distinct customer organisations under one licence (see [[licensing-model-v1]] §18 for the still-open question of how a Partner/MSP model relates to this).

### Additional worker packs

Any tier's base worker allocation can be extended with **+5** or **+10** worker packs. Which tiers packs are available on, and how they're billed, is **not decided** — see [[licensing-model-v1]] §7.

## Hosting models

Hosting is chosen independently of tier:

1. **Teracom Hosted** — multi-tenant, Teracom-operated infrastructure. The model all editions have used to date.
2. **Dedicated Hosted** — single-tenant infrastructure, still Teracom-operated, dedicated to one customer.
3. **Customer Hosted (Sovereign)** — the backend (`teracom-ai-backend`) runs on the customer's own infrastructure, not Teracom's — the defining trait the old "Sovereign Edition" was named for. There is no Teracom-hosted server in the loop at request time, which is why this hosting model needs its own licensing mechanism (signed, hardware-bound, offline-capable licence file — see [[licensing-model-v1]] §8–10) rather than a live subscription check.

**Not decided:** which tier × hosting-model combinations are actually offered (e.g. whether Starter can be Dedicated Hosted, or whether Customer Hosted (Sovereign) requires Enterprise/Platinum). Treat every combination as open until confirmed — see [[licensing-model-v1]] §3, §19.

## Cross-tier / cross-hosting notes

- All tiers draw from the **same** worker catalogue ([[worker-catalogue]]) — the catalogue itself does not currently vary by tier (e.g. there is no "Platinum-only worker type" decision on record). If that changes, record it as a new decision in [[architecture-decisions]] and update this file.
- Worker-count limits have a decided **policy** — creation is blocked immediately once the limit (base allocation + any packs) is reached (see [[licensing-model-v1]] §4) — but this is enforced today **nowhere**: not in the backend schema, not in the frontend UI beyond an advisory warning once built (ADR-006 in [[architecture-decisions]]). Do not describe worker limits as "enforced" in any customer-facing material until [[roadmap]] Package 9 ships the underlying data model.
- "No perpetual licences" applies to every tier and every hosting model, including Customer Hosted (Sovereign) — this rule applies retroactively to how any future contract template is worded. A Licensing & Compliance Worker should treat any perpetual-licence language in a draft contract as a discrepancy to flag, not a valid variant.
- User and organisation limits (§Tiers above) are new as of this update — the original edition model had no organisation-count axis at all. See [[licensing-model-v1]] §6 for what's still unresolved about what "organisation" means operationally under a single licence.
