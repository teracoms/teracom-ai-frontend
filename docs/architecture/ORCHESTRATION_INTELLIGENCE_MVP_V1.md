# Orchestration Intelligence — MVP Design V1

**Status:** Decision document, 2026-08-16. Designs the MVP scope of Orchestration Intelligence — the third and last of the three capabilities the TIC roadmap deferred to Phase 3 pending a shared tool-use/action-taking layer. Documentation only. No code.

**Unlike the two documents this one reviews, this one does not reach the same "nothing new is needed" conclusion — and says so plainly.** [[recommendation-engine-mvp-v1]] and [[workforce-creation-intelligence-mvp-v1]] both found their MVPs needed no new Core Runtime capability beyond reusing what already existed. Orchestration is different in kind: today's chat pipeline (`context_builder.py`, confirmed single-worker only — [[core-runtime-exposure-assessment-v1]] §1) has never run more than one worker per turn. A real, new piece of Core Runtime code is required here. What this document *does* find, matching the other two, is that this new code is small, bounded, and needs no new Teracom Intelligence Cloud service and no general autonomous tool-use framework — only a narrow, fixed-shape primitive.

---

## 1. Worker-to-worker delegation

**PROPOSED, deliberately narrow:**

- **Single-hop only.** Worker A consults exactly one other worker, Worker B, once per delegation. No chains (A asks B asks C), no cycles, no worker-initiated recursive delegation. This is the single most important scope boundary in this document — it bounds cost, latency, and failure modes to a fixed, small shape rather than an open-ended graph.
- **Same organisation only.** A worker can only delegate to another worker belonging to the **same** organisation — never across tenants, restated firmly per [[teracom-intelligence-cloud-strategy-v1]] §2's isolation principle. This is not a new decision; it is this document's explicit confirmation that Orchestration Intelligence introduces no exception to it.
- **Customer-triggered, not autonomous.** Delegation happens only when a customer explicitly acts on a suggestion (§7) — never silently, never as a side effect of a worker's own unprompted reasoning.

## 2. Tool execution requirements

**PROPOSED, and the section where this document is most deliberately restrictive:** the only "tool" this MVP defines is **invoke another worker's chat generation with its own persona/knowledge context** — nothing more general. This is explicitly **not** a general function-calling or external-tool framework (database queries, web search, arbitrary API calls) — [[ux-vision]] §2 already confirms no such mechanism exists anywhere in this codebase, and building one is a separate, larger undertaking this document does not attempt. "Tool execution" here means exactly one thing: a second Ollama call, scoped to a second worker's own context, with a bounded, predictable cost — not a general capability a worker could extend to call anything else.

## 3. Runtime responsibilities

**PROPOSED:**

- **A local delegation-suggestion heuristic** — a simple, rule-based match (not a model) between the customer's current message and another of the organisation's own workers' declared `role`/`purpose` fields (already-existing data, no new schema). This surfaces as a UI affordance ("Consult the Network Engineering Worker about this?"), never an automatic action.
- **The two-call sequence itself, entirely local:** on customer confirmation, Core Runtime calls Ollama once for Worker B's response (using Worker B's own context, exactly as an ordinary chat turn would), then calls Ollama a second time for Worker A's final reply, with Worker B's answer appended as additional context. Both this backend logic and the two Ollama calls run inside Core Runtime — no network call to Teracom Intelligence Cloud is required for this sequence to execute.
- **Transparent presentation** — both the delegation and Worker B's contribution are shown to the customer as part of the visible conversation (§7), not merged silently into Worker A's reply as if it were Worker A's own unaided answer.
- **The entitlement gate** — reusing `capability_allowed_for_tier(tier, "orchestration_intelligence")`, already registered in Package B with a Platinum-only minimum, read from the already-local `licences` table exactly as the other two MVPs in this series already established.

## 4. Teracom Intelligence Cloud responsibilities

**FINDING:** for v1, none of the *mechanics* — the two-call sequence, the heuristic, the gate check — require a live Teracom Intelligence Cloud call, matching the pattern in [[recommendation-engine-mvp-v1]] and [[workforce-creation-intelligence-mvp-v1]]. What is genuinely new here (§0) is Core Runtime code, not Teracom Intelligence Cloud code.

**PROPOSED, v2 only:** a Teracom-hosted model that decides delegation opportunities across *all* of an organisation's workers (not just a simple keyword match against one candidate), weighs which worker(s) to consult, and can synthesise input from more than one — the genuinely sophisticated, differentiating capability [[teracom-intelligence-cloud-strategy-v1]] §7 originally had in mind, trained on the aggregate signal from [[teracom-intelligence-cloud-mvp-v1]]'s Phase 2 pipeline (which delegation suggestions were accepted, generic role-pairing patterns — never conversation content). A **reachable enhancement**, with the v1 local heuristic as its fallback when unreachable or ungated.

## 5. Data that remains local

**DECIDED, restated, not re-argued:** the customer's actual conversation content, both workers' knowledge/instructions/memory, and the synthesised final reply are never required to leave the organisation's environment to get baseline function, per [[model-c-revised-architecture-v1]] §3.3's data-ownership override — identical application to every other capability in this series. Only for v2 does any signal reach Teracom Intelligence Cloud, and only as anonymised role-pairing acceptance patterns, never raw conversation text.

## 6. Multi-step action execution

**PROPOSED, and the section that most needed the scope discipline stated in §1–§2:** "multi-step" in this MVP means exactly **two fixed steps** — consult Worker B, then generate Worker A's synthesised reply. It does not mean an open-ended loop, a variable number of consultations, or a worker deciding mid-conversation to chain further delegations. This bounded shape is what allows this MVP to avoid the general autonomous tool-use/action-taking problem entirely: a fixed two-step sequence, triggered once by an explicit customer action, is not an agent loop, and does not need one built to exist.

## 7. Approval workflow requirements

**PROPOSED:** the customer's explicit action on the suggestion affordance (§3) **is** the approval gate — there is no separate, second confirmation step before Worker B's contribution is incorporated, because that contribution is shown transparently as part of the same conversation the customer already opted into, not silently merged. This differs deliberately from [[workforce-creation-intelligence-mvp-v1]] §8's wizard-confirm step: workforce creation has a natural pause point (nothing is created until confirmed) that conversational orchestration does not have without breaking the chat experience — showing the work transparently, rather than gating a second time, is this document's proposed equivalent safeguard for a conversational feature. **OPEN:** whether an organisation-level default ("always ask before consulting" vs. "ask once per session") is worth adding later — not needed for the MVP, since every delegation in v1 is already explicitly customer-triggered.

**DECIDED, restated:** no Teracom-staff approval applies here — this is a customer-side, in-session action between two of the *same* organisation's own workers, not a cross-tenant or commercial action, so it does not route through the Licensing/Entitlements staff-approval plane at all.

## 8. MVP implementation approach

**PROPOSED, in dependency order:**

1. **Build the narrow two-call delegation function** (§3) — the one genuinely new piece of Core Runtime code in this whole series, but small and fixed-shape: given (worker A, worker B, customer message, worker A's own context), call Ollama for B's response, then call Ollama again for A's final reply incorporating it.
2. **Build the local suggestion heuristic** — a simple keyword/role match, no model, over already-existing `role`/`purpose` fields.
3. **Surface the suggestion affordance in the chat UI**, gated by `capability_allowed_for_tier(tier, "orchestration_intelligence")` — a Starter/Enterprise organisation never sees it; today's single-worker chat is entirely unchanged for them.
4. **Present both workers' contributions transparently** in the conversation — no hidden merging.
5. **v2 — Teracom-hosted delegation-decision model** — deferred, contingent on the same Phase 2 signal pipeline every v2 in this series depends on, and on this MVP's own suggestion-acceptance data existing to train it.

**What this MVP explicitly does not require:** a general function-calling/tool-use framework, autonomous multi-step chaining, cross-organisation delegation, or a new Teracom Intelligence Cloud service. **What it does require, unlike the other two documents in this series:** one small, new, bounded piece of Core Runtime code — the two-call delegation sequence — stated here without minimising it, since claiming otherwise would repeat exactly the kind of overstatement [[core-runtime-exposure-assessment-v1]] was written to catch.
