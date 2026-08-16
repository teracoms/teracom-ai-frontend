# Teracom Intelligence Cloud — MVP V1

**Status:** Decision document, 2026-08-16. Directly answers [[core-runtime-exposure-assessment-v1]] §6's finding — Core Runtime is deployable and potentially copyable, and Teracom Intelligence Cloud (TIC) currently exists only as a plan, not a built product, meaning today's actual differentiation is thin. This document designs the smallest set of TIC services that closes that gap fastest. Documentation only. No code, no implementation.

**Governing assumption, stated explicitly per the task:** Core Runtime *will* be deployed broadly, including to Sovereign and Air-Gapped customers, and *will* be technically copyable there ([[core-runtime-exposure-assessment-v1]] §3). This document does not propose slowing that down — per that assessment's §6, doing so would forgo real revenue to protect technical sophistication that mostly doesn't exist. It designs the moat that has to exist *despite* that assumption, not instead of it.

---

## 0. The one distinction this document is built around

**FINDING, the central insight this document adds to [[teracom-intelligence-cloud-strategy-v1]]'s existing service list:** "Teracom-controlled" and "defensible" are not the same property, and conflating them is why [[core-runtime-exposure-assessment-v1]] §5 found today's differentiation thin. Two structurally different mechanisms are both needed, and they fail differently:

1. **Commercial/legal control** (Licensing, Entitlement, Activation) — governs whether a customer is *allowed* to use the product at a given scale. Necessary, but per the exposure assessment §3, **not sufficient against a determined bad-faith copier**, who can strip a visible validation check out of visible source code. Its real job is keeping the vast majority of legitimate customers correctly licensed, not stopping a deliberate fork.
2. **Structural non-replicability** (aggregate data, live curation, live mediation) — governs whether a copy, even an unlicensed one, can actually *match* what a live deployment offers. This is the real moat, and it only exists where a service's value comes from something a single, static, copied deployment can never have: data aggregated across many customers, curation that keeps happening after the copy was taken, or a live counterparty a copy cannot conjure into existence.

**Every service ranked below is ranked primarily against test 2, not test 1** — a service being "Teracom-controlled" in the sense of never shipping (per [[model-c-revised-architecture-v1]]) is necessary for either kind of protection to hold at all, but only services that pass test 2 actually create the moat this task asks for.

## 1. Which services must be built first?

**Recommendation: Licensing + Entitlement + Activation, as one foundational phase — not because they are the moat (they aren't, alone, per §0), but because everything else depends on them existing first.**

- They are the most mature design in this entire program — [[licensing-service-architecture-v1]] already specifies them in detail; this is implementation of existing architecture, not new design.
- Per [[teracom-intelligence-cloud-strategy-v1]] §13, TIC access should be entitlement-gated from the start — every later service in this roadmap needs that gate to already exist, so building it first means never retrofitting authentication onto services that shipped without it.
- They give [[cybersecurity-worker]] a starting point to act on [[core-runtime-exposure-assessment-v1]] §9's open question about hardening licence validation against deliberate removal — that hardening work has nowhere to attach until the licensing plane itself exists.

## 2. Which services create the most commercial value?

**Ranked, and ranked differently depending on time horizon:**

- **Nearest-term:** Industry Workforce Pack curation and first-party Marketplace discovery. These require no new ML/data infrastructure — they are content and delivery-mechanism work Teracom can start immediately — and they create sellable, demonstrable value (a customer sees new, curated content arrive that a copied deployment never will) within one delivered-update cycle.
- **Medium-term, and highest ceiling:** the Worker Recommendation Engine and Workforce Creation's natural-language layer, **but only once built on real aggregate usage data, not as static rule tables** — a rule-based version (mapping industry → fixed persona list) has real but modest value and, per §3, is not hard to replicate; a version genuinely informed by patterns across the installed base is both more valuable and harder to copy. This is why §6 recommends starting data collection before these services reach their most valuable form.
- **Long-term:** the third-party Marketplace, once [[licensing-model-v1]] §18's partner/MSP model is ratified — the highest revenue ceiling (transaction/revenue-share income) but also the longest lead time (partner ecosystem, billing, trust/dispute infrastructure).

## 3. Which services are hardest to replicate?

**Ranked by structural non-replicability (§0 test 2), not by engineering effort:**

1. **Third-party Marketplace mediation** — hardest, structurally. A copy of Core Runtime cannot conjure a live two-sided marketplace with real trading partners into existence; this requires an actual live counterparty, which by definition cannot be copied.
2. **Recommendation Engine / Orchestration Intelligence / Enrichment algorithms, once genuinely trained on cross-customer aggregate signal.** A single copied deployment only ever has its own data — it structurally cannot replicate a service whose value comes from patterns learned across hundreds of other customers' deployments. **This is conditional, not automatic:** if any of these ship as a static rule table or a thin, un-tuned LLM call, they remain easy to replicate (per [[core-runtime-exposure-assessment-v1]] §4's finding that current technical sophistication is low) — the defensibility comes specifically from the aggregate data, not the presence of a service.
3. **Industry Pack / Marketplace curation freshness** — moderately hard. A copier gets a frozen snapshot; a live deployment keeps receiving new curated content. This is real but not unbreachable — a sufficiently motivated competitor could run their own ongoing curation effort in parallel, just without Teracom's head start.
4. **Licence signing** — unreplicable by cryptographic construction (no private key, no valid new licences), but this is not "hard to replicate" in the same sense as 1–3; it is a structural guarantee that was already true by design ([[licensing-service-architecture-v1]] §13.2) and doesn't need this document to strengthen it further.

## 4. Which services should be required by every deployment?

**Only the licensing lifecycle itself — nothing else.** Consistent with the design rule already established in [[model-c-revised-architecture-v1]] §4: every deployment must be able to validate a locally-held licence file with zero connectivity (this runs in Core Runtime, not TIC, per that document's §2), and every deployment must periodically reach Activation/Entitlement services to renew or change its licence (§6/§7 of that document specify the connectivity assumptions per hosting model). **No enhancement service — recommendation, orchestration, enrichment, marketplace discovery — should ever be required.** This is not a new decision; it is a restatement of a rule already binding, included here because Q4 asked directly and the answer must stay exactly this narrow as more TIC services are added, not creep wider over time.

## 5. Which services should be licence-gated?

**Recommendation, new in this document: use TIC access itself as a tier-differentiation lever, per [[teracom-intelligence-cloud-strategy-v1]] §16's commercial-benefits observation, now made concrete:**

| Service | Suggested gating |
|---|---|
| Licensing validation, Activation, basic Entitlement status | Ungated — every tier, always (§4) |
| Industry Workforce Pack delivery (base set) | Ungated — part of the base product experience |
| First-party Marketplace discovery | Ungated |
| Worker Recommendation Engine | **Gated — Enterprise and Platinum only.** Starter customers get the rule-based Industry Pack mapping (already ungated, above); the more sophisticated, data-informed recommendation is a paid-tier feature |
| Workforce Creation natural-language layer | **Gated — Enterprise and Platinum only**, same reasoning — Starter keeps the Wizard/Forms tiers |
| Cross-worker Orchestration intelligence | **Gated — Platinum only** — the most advanced capability, reserved for the top tier |
| Knowledge/Memory enrichment algorithms | **Gated — Enterprise and Platinum**, offered as an explicit opt-in given the data-ownership override (§8 of the deployment strategy document) means a customer is choosing to send content for transient processing, not merely toggling a feature |
| Third-party Marketplace access | Gated by its own commercial terms once ratified — a separate transaction relationship, not a tier feature |

**Why this table matters beyond gating for its own sake:** it converts the entire TIC build-out into a genuine tier-upgrade incentive for existing [[licensing-model-v1]] tiers, rather than a set of features every customer gets regardless of what they pay for — closing a gap that document's §2 tier table never addressed (today, tiers differ only by numeric worker/user/organisation limits).

## 6. What is the MVP Intelligence Cloud?

**Definitive scope — four components, no more:**

1. **Licensing + Entitlement + Activation**, entitlement-gating wired into the API boundary from day one (§1).
2. **Industry Workforce Pack curation + first-party Marketplace discovery**, delivered via signed update bundles (§2, cheapest real differentiation available).
3. **An aggregate usage-signal pipeline — started now, not deferred.** This is the one net-new piece of infrastructure this document adds beyond re-sequencing the existing TIC list: Core Runtime should begin sending **anonymised, aggregated** usage signal to TIC (which persona types are commonly paired, which knowledge-source types correlate with longer engagement, coarse satisfaction proxies) from the next deployment onward — never raw customer content, never per-customer-identifiable data, consistent with the data-ownership override ([[model-c-revised-architecture-v1]] §3.3). **This is included in the MVP specifically because every service ranked as "hardest to replicate" in §3 depends on having accumulated this signal, and accumulation takes calendar time that cannot be compressed by building the consuming service faster.** Starting collection late means every future recommendation/orchestration/enrichment service launches in the same easily-replicated, rule-table state §3 already found unimpressive.
4. **A rule-based (not yet data-driven) first version of the Worker Recommendation Engine**, built directly from the Industry Pack mapping already being curated in component 2 — shipped as a real, gated (§5) feature immediately, with an explicit, planned upgrade path to a data-informed version once component 3 has accumulated enough signal.

**What is deliberately excluded from the MVP:** cross-worker Orchestration intelligence, the natural-language Workforce Creation layer, Knowledge/Memory enrichment, and the third-party Marketplace. Each is real, each is on the roadmap (§7), and each depends on either component 3's data maturing or on commercial/legal groundwork ([[licensing-model-v1]] §18) that has not happened yet — including them in the MVP would either ship them in the same easily-replicated form the exposure assessment already found unconvincing, or delay the MVP past the point where it addresses that assessment's urgency finding.

## 7. Prioritised build roadmap

| Phase | Contents | Why this order |
|---|---|---|
| **Phase 0 — Foundation** | Licensing, Entitlement, Activation services; entitlement-gating on the TIC API boundary | Most mature existing design; every later phase depends on the gate existing |
| **Phase 1 — Cheap, immediate differentiation** | Industry Workforce Pack curation; first-party Marketplace discovery; rule-based Recommendation Engine v1 | No new ML/data infrastructure required; ships real, gated value fast; directly answers [[core-runtime-exposure-assessment-v1]] §6's urgency finding with the least possible delay |
| **Phase 2 — Seed the data moat** | Aggregate, anonymised usage-signal pipeline, instrumented into every new Core Runtime deployment from this point forward | Must start as early as possible — it is the one component in this roadmap whose lead time is calendar time, not engineering time, and every §3-"hardest to replicate" service in later phases depends on it |
| **Phase 3 — Real intelligence, built on Phase 2's data** | Data-informed Recommendation Engine v2; Workforce Creation natural-language layer; basic cross-worker Orchestration intelligence | Only worth building once Phase 2 has accumulated enough signal to make these genuinely harder to replicate than a rule table — building them earlier would repeat the exposure assessment's finding, not resolve it |
| **Phase 4 — Premium and long-lead-time** | Knowledge/Memory enrichment (data-ownership-constrained by design from the start); third-party Marketplace (pending [[licensing-model-v1]] §18 ratification) | Highest commercial ceiling but longest lead time — enrichment needs careful data-handling design, marketplace needs a ratified commercial/legal model neither of which currently exists |

**The one sequencing rule this roadmap treats as non-negotiable:** Phase 2 must start no later than Phase 1, even though nothing in Phase 1 depends on it — because Phase 3's entire value proposition depends on Phase 2 having already been running for some time by the point Phase 3 begins. Delaying Phase 2 to "when it's needed" is the single most likely way this roadmap would fail to close [[core-runtime-exposure-assessment-v1]] §5's finding within a reasonable timeframe.
