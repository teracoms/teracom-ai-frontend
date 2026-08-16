# Recommendation Engine — MVP Design V1

**Status:** Decision document, 2026-08-16. Designs the MVP scope of the Worker Recommendation Engine named (but explicitly excluded from implementation) across [[phase-0-package-d-marketplace-implementation-report]] and the TIC roadmap documents. Documentation only. No code.

**Grounded in what actually exists, not just what was planned:** this document reviews the real, now-implemented Marketplace Foundation and Worker Pack architecture (Phase 0 Package D — `worker_packs`, `marketplace_listings`, the `industry`/`min_tier`/`featured`/`display_order` fields, and `services/entitlement_service.py`'s `tier_at_least`/`capability_allowed_for_tier` functions), not only the earlier, more abstract framing in [[digital-workforce-platform-v1]] §4 and [[teracom-intelligence-cloud-strategy-v1]] §3. This produces a sharper, more concrete MVP than either of those documents committed to, and one specific correction to how [[teracom-intelligence-cloud-strategy-v1]] categorised this capability — see §5–§6.

---

## 1. Recommendation inputs

**PROPOSED, for review:**

- **Organisation industry** — matched against `worker_packs.industry` (already a real column, Package D). **A genuine gap this document surfaces:** industry is not currently collected anywhere in the signup flow ([[customer-bootstrap-architecture-v1]]) or organisation settings — there is no field to match against yet. This is the one concrete prerequisite the MVP needs that doesn't already exist.
- **Organisation tier** — from the current active `licences` row (already how `services/marketplace_service.py#get_organisation_current_tier` works, Package D) — used for the entitlement gate (§6), not for ranking itself.
- **Existing workforce composition** — the organisation's own `workers` table (name/role already created) — used to avoid recommending a pack whose personas the organisation has already substantially adopted.
- **Marketplace browsing signal** (pack views, pack detail opens) — **not currently instrumented anywhere.** A v1-only recommendation doesn't need it (§3–§4), but it is the seed data v2 depends on — consistent with [[teracom-intelligence-cloud-mvp-v1]] §6's Phase 2 finding that this instrumentation must start early regardless of when v2 actually gets built.
- **Knowledge content signals** (document types/topics uploaded before a worker exists) — named as a candidate input in [[digital-workforce-platform-v1]] §4, still blocked on the same sequencing conflict that document already flagged (today's knowledge upload requires an existing worker to attach to) — not resolved here, restated as still open.
- **Aggregate cross-customer signal** — v2 only, depends on [[teracom-intelligence-cloud-mvp-v1]] Phase 2's usage-signal pipeline having run long enough to be useful.

## 2. Recommendation outputs

**PROPOSED:** a ranked list of **Worker Packs** (not individual out-of-pack personas) — `{slug, name, industry, rationale, score}` per entry. Pack-level, not persona-level, output is the right grain for v1 because Worker Pack curation ([[phase-0-package-d-marketplace-implementation-report]] §3) already does the persona-level ranking by hand — a curator decided which personas belong together for an industry; the Recommendation Engine's job is choosing *which pack*, not re-deriving *which personas within it*. Persona-level recommendation (ranking specific personas across pack boundaries) is a v2 candidate, once real signal exists to justify overriding a curator's own bundling.

**DECIDED, restated, not re-argued:** every recommendation is a suggestion a customer can accept or ignore — never an automatic action, consistent with [[digital-workforce-platform-v1]] §4's "the platform proposes, the customer decides" principle and [[teracom-intelligence-cloud-strategy-v1]] §3's "advisory only."

## 3. How workers are recommended

**PROPOSED:** individual workers are not ranked directly in v1 — a customer is recommended a **pack**, and every persona template inside an accepted pack is surfaced together, exactly as Package D's existing `GET /marketplace/packs/{slug}` already returns them. There is no separate per-persona scoring in this MVP. This keeps v1's entire computation to one join and one sort (§4), not a second ranking model layered underneath the first.

## 4. How workforce packs are recommended

**PROPOSED, and the most concrete design in this document, because it reuses fields that already exist rather than proposing new ones:**

1. Filter `worker_packs` to `status = "published"`, joined to `marketplace_listings` where `delisted_at IS NULL` — exactly `list_marketplace_packs()`'s existing query (Package D), not a new one.
2. Rank: an exact `industry` match to the organisation's own industry field first; then `marketplace_listings.featured DESC`; then `display_order ASC`. Every one of these three fields already exists in the schema shipped in Package D.
3. If the organisation has no industry recorded (the gap named in §1) or no pack matches its industry, fall back to `featured` packs only — the same "generic default" a customer would see today with no personalisation at all.
4. Exclude (or rank last) any pack whose persona set substantially overlaps the organisation's already-created workers — a simple name/role match against the existing `workers` table, not a semantic comparison.

**OPEN:** what counts as "substantial overlap" in step 4 is not specified numerically here — left as an implementation-time tuning question, not a design gap, since no wrong answer here blocks the MVP from working.

## 5. What data stays local

**FINDING, and the central insight of this document:** v1, designed exactly as above, requires **no new live call to Teracom Intelligence Cloud at all.** Every input in §4 — the organisation's own industry, tier (already read from the local `licences` table by `get_organisation_current_tier`, per Package D), existing workforce, and the Worker Pack catalogue itself (already delivered to Core Runtime via the existing publish/list mechanism) — is already local data or already-delivered content. The ranking computation (a filter, a three-key sort, an overlap check) is simple enough to run entirely inside Core Runtime, with zero connectivity, the same way `pack_accessible_for_tier()` already does today.

This is a **sharper conclusion than** [[teracom-intelligence-cloud-strategy-v1]] §3's original categorisation of the Recommendation Engine as a "reachable enhancement" requiring a live call with a local fallback. That categorisation was written before the Marketplace Foundation existed and reasonably assumed recommendation would need server-side computation. Now that the actual catalogue fields (`industry`, `featured`, `display_order`) and tier-lookup mechanism are built and confirmed local, this document corrects that assumption for v1 specifically: **v1's ranking is Core Runtime, not Teracom Intelligence Cloud, in its entirety.**

What stays local, concretely: the organisation's industry and tier, its existing workforce list, its knowledge/memory content (never touched by this feature at all), and the ranking computation itself.

## 6. What metadata goes to Intelligence Cloud

**FINDING, following directly from §5:** for v1, **nothing needs to go to Teracom Intelligence Cloud at request time.** Teracom Intelligence Cloud's only role in v1 is what it already does for Package D generally — curating and publishing the Worker Pack catalogue (industry tags, featured flags, persona content) via the existing staff endpoints, delivered to Core Runtime the same way any published pack already is. This is a **delivered update**, not a **reachable enhancement**, in [[model-c-revised-architecture-v1]] §3.1's own vocabulary — the same shape already established for Worker Pack content itself, not a new relationship this document invents.

**For v2 only**, once the Phase 2 usage-signal pipeline exists: anonymised, aggregated signal — which packs are viewed/adopted, coarse engagement proxies, industry/tier cohort tags — never raw knowledge or memory content, never per-customer-identifiable data, per [[model-c-revised-architecture-v1]] §3.3's data-ownership override, unchanged and non-negotiable for this feature as for every other.

## 7. MVP implementation approach

**PROPOSED, in dependency order:**

1. **Add an `industry` field to organisations** — the one concrete missing prerequisite (§1). Collected at signup or via an organisation-settings update; not decided here which, since either satisfies §4's matching step. This is the only new schema this MVP needs — everything else (packs, tiers, entitlement gating) already exists from Package D/B.
2. **Implement the ranking function in Core Runtime** (§4's four steps) — no new API endpoint required, since it can run wherever `GET /marketplace/packs` is already served (a ranking parameter/reordering on the existing endpoint, not a new one), or as a thin client-side sort over the existing response if the organisation's own industry is already known to the caller.
3. **Gate the *personalised* ranking, not the catalogue itself, by tier** — reusing `capability_allowed_for_tier(tier, "recommendation_engine")`, already implemented in Package B with exactly this capability name and an Enterprise/Platinum minimum. A Starter organisation still sees the full catalogue (§4 step 1–2's featured/display_order fallback), just without the industry-personalised reordering — consistent with [[teracom-intelligence-cloud-mvp-v1]] §5's tier-gating table, and confirming that table's design holds even now that the computation is known to be entirely local.
4. **Instrument pack-view/adoption events now**, even though v1 doesn't consume them — the same "start Phase 2 no later than Phase 1" discipline [[teracom-intelligence-cloud-mvp-v1]] and [[teracom-intelligence-cloud-implementation-roadmap-v1]] both already established as non-negotiable, restated here because this is the first design document to specify exactly which events to capture: pack viewed, pack detail opened, and (once workers can be created from a pack, a capability not yet built) pack adopted.
5. **v2 — data-informed ranking** — deferred, per the existing roadmap's Phase 3, contingent on step 4's signal having accumulated. This document does not design v2's model or scoring beyond noting it replaces §4's rule-based ranking, not the entitlement gate or the local-computation principle in §5, which continue to apply once actual inference is added.

**What this MVP explicitly does not require, contrary to what earlier documents assumed:** a new Teracom Intelligence Cloud service, a new customer-facing API endpoint, or any live network call at recommendation time. The entire v1 scope is a schema addition (industry), a local ranking function, and reuse of entitlement/catalogue mechanisms Package B/D already shipped.
