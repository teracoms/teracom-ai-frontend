# Workforce Creation Intelligence — MVP Design V1

**Status:** Decision document, 2026-08-16. Designs the MVP scope of Workforce Creation Intelligence, previously deferred to Phase 3 across the TIC roadmap documents pending a "shared tool-use/action-taking layer" this document finds is not actually required for a genuine MVP. Documentation only. No code.

**Grounded in what actually exists:** this document reviews the real, implemented Recommendation Engine ([[phase-0-package-e-recommendation-engine-implementation-report]]) and Marketplace/Worker Pack architecture ([[phase-0-package-d-marketplace-implementation-report]]), plus a first-hand fact this document adds to the record: `teracom-ai-backend` already runs a local Ollama instance (`services/ollama_service.py`) for chat generation — Core Runtime already has a local LLM call available, not a capability that needs to be built from nothing.

---

## 0. The finding that reframes this document's scope

**FINDING, the same shape as [[recommendation-engine-mvp-v1]] §5's correction, applied again here:** every prior document that discussed Workforce Creation Intelligence ([[digital-workforce-platform-v1]] §3, [[teracom-intelligence-cloud-strategy-v1]] §6, [[teracom-intelligence-cloud-implementation-roadmap-v1]] §7) assumed it needs a new "shared tool-use/action-taking backend layer" before any of it can be built — a real, substantial piece of infrastructure that doesn't exist. This document finds that assumption is only true for the **general** case (a system that autonomously chains multiple actions without a human confirming each one). It is **not** true for a genuine MVP, because of one design choice already used everywhere else in this series: **every recommendation stays advisory until a human confirms it.**

Once workforce creation is scoped as *propose → human confirms → execute the confirmed action*, there is no autonomous tool-use problem to solve — "execute the confirmed action" is just calling `POST /workers/` (Package 3, already built), the same as a customer would from the existing wizard/form. The MVP in this document needs: a local LLM call to extract structured signals from free text (already possible — Ollama is already local), the existing Recommendation Engine ranking (Package E, already local), and a wizard confirmation step. It does not need a new agent framework, and it does not need to wait for one.

**What this document does not claim:** the full autonomous tool-use/action-taking layer — needed for Orchestration Intelligence's multi-worker delegation, and for any future workforce-creation flow that chains actions without a human step in between — is still real, still substantial, and still not designed here. This document scopes only the human-confirmed MVP.

---

## 1. Workforce creation inputs

**PROPOSED:**

- **Free-text request** — "I need help with cybersecurity for my retail business," typed into an existing chat session or a dedicated entry field. Never stored beyond the request's own processing (§6).
- **Organisation industry and tier** — already real fields (Package E's `organisations.industry`; tier from the local `licences` table).
- **Existing workforce composition** — the organisation's own `workers` table, reused exactly as Package E's overlap check already uses it.
- **The Worker Pack catalogue** — already published and local (Package D).

## 2. Workforce creation outputs

**PROPOSED:** never a created worker directly. The output is a **proposed workforce configuration** — a short natural-language summary of the extracted intent ("It sounds like you need help with security and compliance") plus a ranked set of candidate Worker Packs/personas (reusing Recommendation Engine's own ranked-list shape, [[recommendation-engine-mvp-v1]] §2), presented for the customer to review, adjust, or reject before anything is created. This is the same "propose, never automatically act" principle already established for the Recommendation Engine and, before that, [[digital-workforce-platform-v1]] §4.

## 3. Runtime responsibilities

**PROPOSED — everything in this MVP's actual computation and action-taking:**

- Running the intent-extraction LLM call against the **already-local** Ollama instance — a narrow, well-defined prompt ("extract an industry, team focus, and desired capability from this request"), not open-ended agentic reasoning, per [[digital-workforce-platform-v1]] §20's own "narrow prototype scoped to a small, well-defined intent set" framing.
- Feeding the extracted signals into the **already-local** Recommendation Engine ranking (Package E) — no new ranking logic is written; the same `get_recommended_packs`-shaped computation is reused, optionally with the extracted industry substituting for or filling in a not-yet-set `organisations.industry`.
- Rendering the wizard-tier confirmation UI.
- Calling the existing worker-creation (`POST /workers/`, Package 3) and knowledge-assignment endpoints once the customer confirms — the "action" in this MVP is exactly the same backend call an existing wizard/form already makes, not a new capability.

## 4. Teracom Intelligence Cloud responsibilities

**FINDING, following §0 directly:** for v1, **none** — the same conclusion [[recommendation-engine-mvp-v1]] §6 reached for Worker Pack ranking now holds for Workforce Creation Intelligence's MVP too. Every computation in §3 already runs in Core Runtime with data already local to it.

**PROPOSED, v2 only:** a Teracom-hosted, fine-tuned intent-extraction model — trained on the aggregate signal [[teracom-intelligence-cloud-mvp-v1]]'s Phase 2 pipeline accumulates — replacing the generic local Ollama prompt with one that actually understands this product's domain well. This is a **reachable enhancement** in [[model-c-revised-architecture-v1]] §3.1's vocabulary (a live call, local fallback to the v1 Ollama prompt if unreachable or ungated), not a delivered update — unlike Worker Pack content, an intent-extraction model doesn't need to be pre-delivered, since a live call while online is the natural shape for a per-request enhancement, with the v1 local prompt as the offline/ungated fallback.

**Honest limitation, stated plainly, mirroring [[core-runtime-exposure-assessment-v1]]'s own discipline:** the v1 local-Ollama intent extraction is a thin wrapper, exactly like today's chat generation — not defensible IP on its own. It is not meant to be. The differentiation in this MVP comes from the already-curated, already-Teracom-controlled Worker Pack catalogue and Recommendation ranking underneath it, which this feature surfaces through a natural-language entry point rather than reinventing.

## 5. Metadata required

**PROPOSED:** for v1, none needs to leave Core Runtime — the intent-extraction call, the ranking, and the confirmation flow are all local. For v2, only the same class of anonymised, aggregated signal already scoped for Recommendation Engine v2 ([[recommendation-engine-mvp-v1]] §6): which extracted-intent categories correlated with which accepted packs, never the customer's raw free-text request.

## 6. Data that must remain local

**DECIDED, restated, not re-argued:** the customer's free-text request (which may describe real business specifics), the extracted intent, the organisation's existing workforce, industry, and tier — none of this is ever required to leave the customer's environment to get baseline function, per [[model-c-revised-architecture-v1]] §3.3's data-ownership override, applied here exactly as it was for every other capability in this series.

## 7. How worker packs are selected

**PROPOSED:** identically to [[recommendation-engine-mvp-v1]] §4's existing ranking — this document adds no new selection algorithm. The only addition is an optional input substitution: if the free-text request names an industry the stored `organisations.industry` field doesn't already have (or contradicts it), the extracted value is used for that ranking call and the customer is offered a chance to save it to their organisation profile, closing the loop on the still-open gap that document's §1 named without this document needing to re-solve it as a separate feature.

## 8. How workforces are proposed

**PROPOSED, per [[ux-vision]]'s own evaluation order, and the reason this feature is called "Workforce Creation *Intelligence*" rather than "Workforce Creation *Automation*":** natural language gets the customer to a starting point; a **wizard** — not a silent action — is where the proposal is actually reviewed. Concretely: the ranked pack(s) from §7 are shown with the same rationale format Recommendation Engine already returns, the customer picks which packs/personas to accept (all, some, or none), and confirming runs the existing per-worker creation call for each accepted persona — one wizard step, not a multi-page flow, consistent with this MVP's narrow scope.

## 9. MVP implementation approach

**PROPOSED, in dependency order:**

1. **A narrow intent-extraction prompt against the existing local Ollama call** — scoped to industry/team-focus/capability extraction only, not general instruction-following. No new model, no new inference infrastructure.
2. **Wire extracted signals into the existing Recommendation Engine ranking** (Package E) — a parameter addition to an already-built function, not new ranking logic.
3. **Build the wizard confirmation UI** — reusing the existing `WizardShell.js` pattern already established for the Billing & Licensing wizards, and the existing `MarketplacePackCard`/rationale presentation from Package E.
4. **Confirm calls existing creation endpoints** — `POST /workers/` per accepted persona; no new backend action-taking capability.
5. **Gate this whole feature by tier** — reusing `capability_allowed_for_tier(tier, "workforce_creation_intelligence")`, already registered in Package B's capability table with an Enterprise/Platinum minimum; a Starter organisation (or one with no active licence) falls back to the existing Wizard/Forms-tier creation flow (Package 3) with no natural-language entry point offered at all — not a degraded version of this feature, simply the pre-existing flow, unchanged.
6. **v2 — Teracom-hosted intent model** — deferred, per §4, contingent on the same Phase 2 signal pipeline every other v2 in this series depends on.

**What this MVP explicitly does not require, contrary to what the earlier roadmap documents assumed:** a new shared tool-use/action-taking backend layer, a new Teracom Intelligence Cloud service, or any new inference infrastructure. The entire v1 scope is one narrow prompt against an LLM Core Runtime already runs, reuse of an already-built ranking function, and a wizard UI following an already-established pattern.
