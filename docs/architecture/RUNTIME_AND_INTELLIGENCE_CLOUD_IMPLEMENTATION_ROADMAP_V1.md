# Runtime + Intelligence Cloud — Definitive Implementation Roadmap

**Status:** Ratified architecture decision, 2026-08-16. **Teracom adopts Core Runtime + Teracom Intelligence Cloud as the official deployment model for Teracom AI**, across every hosting model (SaaS/Teracom Hosted, Dedicated Hosted, Sovereign, Air-Gapped) — not a Sovereign-specific special case, per [[final-deployment-and-ip-protection-recommendation]] §1. This document is the single implementation roadmap that follows from that decision, merging the two work-tracks that ran in parallel today — the Customer Bootstrap track ([[customer-bootstrap-implementation-plan-v1]], Packages 1–8) and the Teracom Intelligence Cloud track ([[teracom-intelligence-cloud-mvp-v1]], [[teracom-intelligence-cloud-implementation-roadmap-v1]]) — into one phase sequence. Documentation only. No code, no implementation.

**Filename note:** no output filename was specified for this task; this document is named and placed in `docs/architecture/` for consistency with every other document in this series.

**Recommended follow-up, not executed here:** per [[documentation-standards]] §4, an architecture decision of this weight should be recorded as a new dated entry in [[architecture-decisions]] (the next ADR after ADR-012). This document states the decision; it does not itself add that entry, consistent with this session's standing practice of flagging documentation-maintenance follow-ups rather than performing unrequested edits to files outside a task's named scope.

**Documents synthesised:** every architecture document produced this session — [[licensing-service-architecture-v1]], [[foundation-workforce-catalogue-v2]], [[website-information-architecture-v2]], [[commerce-store-architecture-v1]], [[digital-workforce-platform-v1]], [[customer-bootstrap-architecture-v1]], [[customer-bootstrap-implementation-plan-v1]] (Packages 1–2 already implemented, see [[customer-bootstrap-package-1-implementation-report]] and [[customer-bootstrap-package-2-implementation-report]]), [[deployment-and-ip-protection-strategy-v1]], [[model-c-revised-architecture-v1]], [[teracom-intelligence-cloud-strategy-v1]], [[final-deployment-and-ip-protection-recommendation]], [[core-runtime-exposure-assessment-v1]], [[teracom-intelligence-cloud-mvp-v1]], [[teracom-intelligence-cloud-implementation-roadmap-v1]].

---

## 0. Why this document merges two tracks into four phases, not eight-plus-five

The Customer Bootstrap track and the Teracom Intelligence Cloud track were designed against different questions ("how does a customer get an account" versus "what stays permanently Teracom-controlled") and therefore ended up with different phase-numbering schemes (Bootstrap Packages 1–8; TIC Phases 0–4). **They meet at exactly one point:** Bootstrap Package 6 ("Minimal Staff Approval") and TIC Phase 0 ("Licensing + Entitlement + Activation") are, after today's work, **the same implementation effort**, per [[final-deployment-and-ip-protection-recommendation]] §5's recommendation that Package 6 be redesigned around the Licensing/Entitlement/Activation three-way split rather than built as an undifferentiated schema. This document uses that merge point to fold both tracks into one four-phase roadmap, per this task's own requested shape.

---

## Phase 0 — Foundation

- **Architecture:** Ratify the Runtime + Intelligence Cloud model (this document). Ratify that Bootstrap Package 6 *is* TIC's Licensing/Entitlement/Activation foundation, not a separate minimal subset ([[final-deployment-and-ip-protection-recommendation]] §5). Ratify the entitlement-gating design rule for the TIC API boundary ([[teracom-intelligence-cloud-strategy-v1]] §13) before any endpoint is built against it.
- **Backend:** Complete Bootstrap Package 3 (Email Integration — verification, licence-approval notification, password-reset delivery); build the merged Package 6 / TIC Phase 0 (Licensing, Entitlement, Activation services, `staff_users` plane, `licence_requests` pipeline, signing infrastructure) per [[teracom-intelligence-cloud-implementation-roadmap-v1]] §1–§3.
- **Frontend:** Complete Bootstrap Package 4 (Signup Frontend + Password Reset pages, BFF proxy routes) — confirmed independent of every TIC decision in [[final-deployment-and-ip-protection-recommendation]] §5/§8, so it proceeds on its own schedule without waiting on the backend work above.
- **Intelligence Cloud:** First TIC services stood up: Licensing, Entitlement, Activation — entitlement-gating wired into the `/teracom-intelligence-cloud/*` boundary from day one, per [[teracom-intelligence-cloud-strategy-v1]] §13.
- **Dependencies:** Alembic migration framework (done — [[customer-bootstrap-package-1-implementation-report]]); a dependency manifest for `teracom-ai-backend` (still missing, [[licensing-service-architecture-v1]] §24.4); ratification of the asymmetric signing algorithm (§13.2 of that document); resolution of the organisation-cardinality question for Enterprise/Platinum entitlement (§4.1/§8 — does not block Starter, which has no cardinality ambiguity).

## Phase 1 — Cheap, Immediate Differentiation

- **Architecture:** Resolve [[customer-bootstrap-architecture-v1]] §17 Open Decision #1 (what a `pending_licence` organisation can access) to unblock Bootstrap Package 8. Decide the delivered-update mechanism for catalogue/pack content — the full appliance-packaging pipeline versus a simpler interim delivery, per [[teracom-intelligence-cloud-implementation-roadmap-v1]] §5's recommendation not to wait on packaging infrastructure with no committed timeline.
- **Backend:** Bootstrap Package 7 (`GET /licensing/status` stub) and Package 8 (pending-licence access policy, once decided above); Worker Pack curation delivery; Marketplace first-party discovery; Recommendation Engine v1 (rule-based, built directly on Worker Pack content).
- **Frontend:** Wire the existing Billing & Licensing preview UI (built in the earlier frontend Package 9) to Package 7's real `/licensing/status` data, replacing its illustrative placeholder — the first point where a previously-built, preview-only screen becomes genuinely functional. A simple template/pack discovery browsing view, gated per [[teracom-intelligence-cloud-mvp-v1]] §5's tier table.
- **Intelligence Cloud:** Worker Packs, Marketplace (first-party discovery only — third-party remains excluded, see Phase 3), Recommendation Engine v1.
- **Dependencies:** Phase 0's entitlement gate must be live and callable. Worker Pack curation content has no blocking dependency and can start immediately, in parallel with Phase 0's backend work.

## Phase 2 — Seed the Data Moat

- **Architecture:** Ratify the data-collection/privacy boundary explicitly before any instrumentation ships — this document recommends promoting [[model-c-revised-architecture-v1]] §3.3's data-ownership override into [[deployment-and-ip-protection-strategy-v1]] itself first (that document's own Open Decision #5), so the aggregate-signal pipeline is built against an already-ratified boundary rather than an implicit one.
- **Backend:** Instrument Core Runtime, in every new deployment from this point forward, to emit anonymised, aggregated usage signal (persona pairings, knowledge-type correlations, coarse engagement proxies) to TIC — never raw content, never per-customer-identifiable data. Build the TIC-side collection/aggregation store.
- **Frontend:** None required for customers. If any UI is built in this phase, it is an internal, Teracom-facing signal-quality view, not a customer-facing feature.
- **Intelligence Cloud:** The aggregate usage-signal pipeline itself — not one of the named services in [[teracom-intelligence-cloud-implementation-roadmap-v1]]'s eight, but, per that document's closing rule, the load-bearing prerequisite every Phase 3 service depends on.
- **Dependencies:** Phase 1's services must already be live and in use, so there is real usage to instrument. The data-ownership boundary (above) must be ratified before instrumentation starts, not after. **This phase's start date, not its build effort, is the schedule risk** — it must begin no later than Phase 1, per [[teracom-intelligence-cloud-mvp-v1]]'s and [[teracom-intelligence-cloud-implementation-roadmap-v1]]'s shared closing rule, since Phase 3 depends on calendar time having elapsed, not on engineering capacity.

## Phase 3 — Real Intelligence and Long-Lead Premium

- **Architecture:** Ratify [[licensing-model-v1]] §18 (the Partner/MSP model) if third-party Marketplace is to proceed within this horizon at all — that document states plainly no decisions have been supplied for it yet, and this roadmap cannot schedule around a ratification it does not control. Ratify the shared tool-use/action-taking backend layer's design before building Workforce Creation Intelligence and Orchestration Intelligence against it separately.
- **Backend:** Build the shared tool-use/action-taking layer once ([[digital-workforce-platform-v1]] §3, the identified common dependency); Recommendation Engine v2 (data-informed, built on Phase 2's accumulated signal); Knowledge and Memory enrichment algorithms, architected from the start around the data-ownership override (never making customer content or memory dependent on TIC to function at baseline).
- **Frontend:** A natural-language workforce-creation flow (the Natural-Language-First tier [[ux-vision]] has called for since Package 8 of the original frontend roadmap, now finally backed by real backend capability); any UI surfacing cross-worker orchestration outcomes.
- **Intelligence Cloud:** Workforce Creation Intelligence, Orchestration Intelligence (built together, sharing the tool-use layer — Workforce Creation likely reaches production first, since it's gated to Enterprise+Platinum versus Orchestration's narrower Platinum-only gate), Recommendation Engine v2, Knowledge/Memory enrichment. Third-party Marketplace **begins here at the earliest**, strictly conditional on the architecture item above — it may slip beyond this phase if §18 is not ratified in time, and this document does not force a schedule onto a decision it cannot make.
- **Dependencies:** Phase 2's signal pipeline must have run long enough to be useful — a calendar dependency this document cannot compress. Partner/MSP ratification, for the third-party Marketplace component specifically.

---

## Recommended build order

**Sequential across phases (0 → 1 → 2 → 3), with explicit parallelism within each:**

1. **Phase 0's backend and frontend tracks run concurrently** — the merged Package 6/TIC-foundation work and Package 3 (email) on one track, Package 4 (signup frontend) on an independent track, since [[final-deployment-and-ip-protection-recommendation]] §5/§8 already confirmed no dependency runs between them.
2. **Phase 1 does not wait for all of Phase 0 to finish** — Worker Pack curation (content work) can start the moment this document is ratified, in parallel with Phase 0's backend build, since it has no technical dependency on Licensing/Entitlement/Activation existing yet (only its *delivery*, gated behind the entitlement check, does).
3. **Phase 2 must start no later than Phase 1 begins shipping**, not after Phase 1 completes — restated as the one non-negotiable sequencing rule from [[teracom-intelligence-cloud-mvp-v1]] and [[teracom-intelligence-cloud-implementation-roadmap-v1]], carried into this merged roadmap unchanged.
4. **Phase 3's two intelligence services are built together, not sequentially**, since splitting the shared tool-use layer's construction across two separate efforts would mean building it twice.

## Which implementation package should be started immediately

**The merged Package 6 / TIC Phase 0 (Licensing + Entitlement + Activation) is the single package to start immediately.** It has been independently identified as "build first" by [[teracom-intelligence-cloud-strategy-v1]] §18, [[final-deployment-and-ip-protection-recommendation]] §5, and [[teracom-intelligence-cloud-implementation-roadmap-v1]] §1–§3 — three separate analyses converging on the same answer is itself evidence this is the correct starting point, not a close call. It is the most mature design in the entire program (implementation of an already-specified architecture, not new design risk), it unblocks the largest number of downstream items (Phases 1 and 3 both depend on its entitlement gate existing), and per [[core-runtime-exposure-assessment-v1]] §9, it is also where [[cybersecurity-worker]]'s recommended hardening work against deliberate licence-check removal has to attach.

**Bootstrap Package 4 (Signup Frontend + Password Reset) may start immediately alongside it**, on an independent track, per the confirmed absence of any dependency between them — this is not a competing recommendation, only a note that starting the merged Package 6 work does not require Package 4 to wait, nor does it need to wait for Package 4.
