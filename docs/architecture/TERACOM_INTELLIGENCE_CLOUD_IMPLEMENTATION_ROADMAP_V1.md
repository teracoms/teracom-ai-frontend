# Teracom Intelligence Cloud — Implementation Roadmap V1

**Status:** Decision document, 2026-08-16. Turns [[teracom-intelligence-cloud-mvp-v1]]'s phased design and [[final-deployment-and-ip-protection-recommendation]]'s closing recommendations into a concrete, per-service implementation roadmap for the eight capabilities named in this task. Documentation only. No code, no implementation.

**How the five fields per service are used:** **Value** and **Complexity** are assessed independently of each other (a service can be high-value and low-complexity, like Worker Packs, or high-value and high-complexity, like Workforce Creation Intelligence) — ranking by value alone would wrongly favour the hardest services first. **Dependencies** are stated as concrete blockers, citing the source document, not restated in general terms. **MVP Scope** states exactly what ships in the near-term roadmap versus what is explicitly deferred, per [[teracom-intelligence-cloud-mvp-v1]] §6. **Recommended Build Order** places each service in one of the four phases already established in that document (Phase 0 Foundation, Phase 1 Cheap/Immediate, Phase 2 Data Seeding, Phase 3 Real Intelligence, Phase 4 Premium/Long-Lead), rather than inventing a new phase scheme.

---

## 1. Licensing

- **Value:** Foundational, not differentiating on its own ([[teracom-intelligence-cloud-mvp-v1]] §0) — its value is enabling every other service in this roadmap to exist safely, and keeping the large majority of legitimate customers correctly entitled. Per [[core-runtime-exposure-assessment-v1]] §3, it is not sufficient alone against a determined bad-faith copier, but nothing else in this roadmap functions without it.
- **Complexity:** Well-understood, not low — [[licensing-service-architecture-v1]] already specifies the signed-artefact model, the JWS format, and the validation workflow in detail. The remaining complexity is implementation effort (migration framework, signing infrastructure) against an already-settled design, not open design risk.
- **Dependencies:** Alembic migration framework (built — [[customer-bootstrap-package-1-implementation-report]]); a dependency manifest for `teracom-ai-backend` (still missing, [[licensing-service-architecture-v1]] §24.4); ratification of the asymmetric signing algorithm (Ed25519/RS256, proposed but not ratified, §13.2 of that document); the new `staff_users` authentication plane (§11.1, not yet built).
- **MVP Scope:** Signing + local validation + the minimal staff-approval endpoint already scoped in [[customer-bootstrap-implementation-plan-v1]]'s Package 6 — enough to move an organisation from `pending_licence` to `active`. Full renewal/upgrade/transfer workflows are real but not required for the MVP to be useful.
- **Recommended Build Order:** **Phase 0, first.** Every other service's "Dependencies" row below cites this one.

## 2. Entitlements

- **Value:** Turns Licensing from a binary valid/invalid check into the actual mechanism behind [[teracom-intelligence-cloud-mvp-v1]] §5's tier-gating table — this is what makes TIC access itself a commercial lever, not just a licence-validity gate.
- **Complexity:** Low for the data model itself (`entitlements` table already specified, [[licensing-service-architecture-v1]] §5); the real complexity is external to this service — the organisation-cardinality question (shared pool vs. per-organisation allocation for Enterprise/Platinum, §4.1/§8 of that document) blocks a final schema, not the entitlement-checking logic itself.
- **Dependencies:** Licensing (§1) must exist first, since entitlement is expressed inside the signed licence file. The organisation-cardinality open question must resolve before Enterprise/Platinum entitlement can be finalised — Starter's entitlement (1 organisation, no cardinality ambiguity) is not blocked by this.
- **MVP Scope:** Worker/user/organisation limit *tracking* and the entitlement *check* used to gate TIC access per [[teracom-intelligence-cloud-mvp-v1]] §5's table. **Explicitly not in MVP scope:** enforcing the worker-limit-blocks-creation policy inside Core Runtime itself — that is a separate, already-tracked gap ([[licensing-service-architecture-v1]] §5) with zero implementation anywhere, and this roadmap does not fold it into the TIC build-out.
- **Recommended Build Order:** **Phase 0, alongside Licensing.** They share data and must both exist before any gated TIC service (§6–§8 below) can check anything.

## 3. Activation

- **Value:** Moderate on its own — prevents casual unauthorised duplication of a licensed deployment by binding a licence to specific hardware. Not a differentiation service; a support/control function.
- **Complexity:** Medium. The hardware-fingerprint combination algorithm and its tolerance rule for routine hardware maintenance are both explicitly proposed-but-not-ratified ([[licensing-service-architecture-v1]] §9.1/§9.2) — the schema is simple, the policy underneath it is not yet settled.
- **Dependencies:** Licensing (§1) — activation shares the same `licence_requests` pipeline and approval gate. The fingerprint-algorithm ratification is an external blocker this roadmap cannot resolve by building faster.
- **MVP Scope:** Initial activation only (fingerprint capture and binding at first issuance). Re-binding after legitimate hardware changes and ownership-transfer-triggered re-binding are real but lower-frequency flows, deferred past the MVP.
- **Recommended Build Order:** **Phase 0, alongside Licensing and Entitlements** — all three share the same underlying pipeline and staff-approval mechanism, and splitting them across different phases would mean building that shared pipeline twice.

## 4. Marketplace

- **Value:** Split sharply by which marketplace. First-party template discovery is cheap, near-term, real differentiation ([[teracom-intelligence-cloud-mvp-v1]] §2) — a freshness moat a copy cannot replicate. Third-party/partner marketplace has the highest long-term revenue ceiling (transaction/revenue-share income) but is blocked on a commercial decision that hasn't been made.
- **Complexity:** First-party discovery is low — content and a delivery mechanism, no new inference infrastructure. Third-party mediation is high — partner onboarding, billing, trust/dispute handling, live transaction mediation — and is, per [[core-runtime-exposure-assessment-v1]] §3, the single hardest TIC service to replicate precisely because that complexity is structural, not incidental.
- **Dependencies:** First-party: shares curation work and the delivered-update mechanism with Worker Packs (§5 below); ultimately depends on the appliance packaging/build pipeline for full automation, though an interim, simpler delivery path can substitute for the MVP (see §5). Third-party: **hard-blocked** on [[licensing-model-v1]] §18's Partner/MSP model, which that document states plainly has "no approved decisions supplied."
- **MVP Scope:** First-party discovery only, per [[teracom-intelligence-cloud-mvp-v1]] §6. Third-party marketplace is explicitly excluded from the near-term roadmap, not merely deprioritised.
- **Recommended Build Order:** First-party discovery — **Phase 1**, bundled with Worker Packs. Third-party mediation — **Phase 4**, and only after §18's ratification, which sits outside this roadmap's ability to schedule.

## 5. Worker Packs

- **Value:** The single cheapest genuine differentiation available today ([[teracom-intelligence-cloud-mvp-v1]] §2/§6) — curation authority plus freshness, directly reusing the persona content work already done in [[foundation-workforce-catalogue-v2]].
- **Complexity:** Low — content curation plus a versioned delivery mechanism, no ML infrastructure. The one real complication is shared with Marketplace first-party discovery: full delivery via the signed appliance-upgrade bundle depends on a build/packaging pipeline that does not exist yet ([[licensing-service-architecture-v1]] §24.4).
- **Dependencies:** None blocking at the content layer (curation can start immediately). For delivery: either the full appliance-packaging pipeline (not yet built) or a simpler interim mechanism — this roadmap recommends the interim path for MVP rather than waiting on packaging infrastructure with no committed timeline.
- **MVP Scope:** A static, versioned set of industry-to-persona mappings, delivered via whichever mechanism is cheapest to stand up first (even a simple signed content file over existing connectivity, not necessarily the full appliance bundle). This directly feeds the Recommendation Engine's rule-based v1 (§6 below).
- **Recommended Build Order:** **Phase 1**, effectively tied with Marketplace first-party discovery — the two share curation and delivery mechanics closely enough that building them in the same window avoids duplicating that mechanism.

## 6. Recommendation Engine

- **Value:** Medium in its rule-based v1 form (useful, but per [[core-runtime-exposure-assessment-v1]] §3, not hard to replicate on its own); high once genuinely data-informed — and the first service in this roadmap to double as a paid-tier upgrade lever, per [[teracom-intelligence-cloud-mvp-v1]] §5's gating table (Enterprise/Platinum only).
- **Complexity:** Low for v1 — a lookup over Worker Packs' curated mapping. High for v2 — requires the aggregate usage-signal pipeline to have run long enough to be useful, plus real model-serving infrastructure that doesn't exist anywhere in this codebase today.
- **Dependencies:** v1 depends directly on Worker Packs' curated content (§5) and Entitlements (§2) for gating. v2 depends on the aggregate usage-signal pipeline ([[teracom-intelligence-cloud-mvp-v1]] §6 component 3, Phase 2 below) having accumulated meaningful data — this is a calendar-time dependency, not an engineering one, and cannot be shortened by allocating more engineers to it.
- **MVP Scope:** v1 (rule-based) only, gated per §5's tier table. v2 is on the roadmap but explicitly not part of the near-term MVP.
- **Recommended Build Order:** v1 — **Phase 1**, alongside Worker Packs (it's a thin layer on top of that content). v2 — **Phase 3**, after Phase 2's data pipeline has had time to accumulate signal.

## 7. Workforce Creation Intelligence

- **Value:** High long-term — this is the Natural-Language-First tier of [[ux-vision]]'s own hierarchy, the most visible differentiating moment a customer experiences. Explicitly excluded from the MVP ([[teracom-intelligence-cloud-mvp-v1]] §6) because shipping it as a thin LLM wrapper today would land in the same easily-replicated state [[core-runtime-exposure-assessment-v1]] found unconvincing for current Core Runtime code.
- **Complexity:** High. Requires a backend tool-use/action-taking capability that does not exist anywhere in `teracom-ai-backend` today — [[digital-workforce-platform-v1]] §3 already identified this as the single shared dependency behind natural-language creation, worker-to-worker collaboration, and model-driven recommendation refinement. This is novel infrastructure, not an incremental extension of anything already built.
- **Dependencies:** The shared tool-use/action-taking layer (also required by Orchestration Intelligence, §8 — building it once serves both, per [[digital-workforce-platform-v1]] §20 Stage 3's identical framing). Entitlements (§2) for gating. Ideally, some accumulated usage signal so intent-parsing is tuned rather than generic.
- **MVP Scope:** Not in MVP. First real milestone beyond the MVP: a narrow prototype scoped to a small, well-defined intent set (e.g. "create a worker of type X"), not open-ended natural-language creation.
- **Recommended Build Order:** **Phase 3**, built together with Orchestration Intelligence so the shared tool-use layer is built once and evaluated for both capabilities as consequences, not commissioned as two separate efforts.

## 8. Orchestration Intelligence

- **Value:** High long-term, but the lowest urgency among the three "advanced" TIC services — basic single-worker orchestration already works today without it (a customer can use every worker individually), so its absence degrades nothing essential in the interim.
- **Complexity:** High — same shared tool-use/action-taking dependency as Workforce Creation Intelligence (§7), plus genuinely novel multi-agent coordination logic (deciding which worker handles what, arbitrating between workers) with no existing partial implementation anywhere — today's `context_builder.py` is confirmed single-worker only.
- **Dependencies:** The shared tool-use/action-taking layer (§7). Entitlements (§2) — gated to Platinum only per [[teracom-intelligence-cloud-mvp-v1]] §5, the narrowest gate of any TIC service in this roadmap, meaning it also has the smallest addressable tier on launch.
- **MVP Scope:** Not in MVP; deferred to Phase 3 alongside Workforce Creation Intelligence.
- **Recommended Build Order:** **Phase 3**, tied with Workforce Creation Intelligence on shared infrastructure, but reasonably expected to reach production quality slightly *after* it — Workforce Creation Intelligence is gated to Enterprise+Platinum (a broader addressable base) while Orchestration Intelligence is Platinum-only, giving the former a stronger incentive to ship first even though both depend on the same underlying layer.

---

## 9. Consolidated roadmap

| Phase | Services | Gate to move to next phase |
|---|---|---|
| **Phase 0 — Foundation** | Licensing (§1), Entitlements (§2), Activation (§3) | Entitlement-gating wired into the TIC API boundary and working end to end |
| **Phase 1 — Cheap, immediate differentiation** | Worker Packs (§5), Marketplace first-party discovery (§4), Recommendation Engine v1 (§6) | Aggregate usage-signal pipeline (Phase 2) started — not blocked on Phase 1 completing, but must not be delayed by it |
| **Phase 2 — Seed the data moat** | Aggregate, anonymised usage-signal pipeline (per [[teracom-intelligence-cloud-mvp-v1]] §6 component 3 — not one of this task's eight named services, but the load-bearing prerequisite for Phase 3) | Sufficient accumulated signal to make Phase 3 services genuinely harder to replicate than a rule table |
| **Phase 3 — Real intelligence** | Recommendation Engine v2 (§6), Workforce Creation Intelligence (§7), Orchestration Intelligence (§8) | [[licensing-model-v1]] §18 (Partner/MSP model) ratified |
| **Phase 4 — Premium and long-lead-time** | Marketplace third-party mediation (§4) | — |

**The one rule this roadmap treats as non-negotiable, restated from [[teracom-intelligence-cloud-mvp-v1]]:** Phase 2 must start no later than Phase 1, even though none of Phase 1's services depend on it, because Phase 3's entire value proposition — the difference between "hard to replicate" and "just another rule table" for the three services in it — depends on Phase 2 having already been running for some time by the point Phase 3 begins.
