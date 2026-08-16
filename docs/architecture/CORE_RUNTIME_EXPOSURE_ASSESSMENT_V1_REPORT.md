# Core Runtime Exposure Assessment V1 — Report

**Date:** 2026-08-16 · **Type:** Documentation-only change · **Scope:** `docs/architecture/`

---

## 1. Task

Produce a final, adversarial IP-exposure assessment of Core Runtime before Implementation Package 4, reviewing [[deployment-and-ip-protection-strategy-v1]], [[model-c-revised-architecture-v1]], [[teracom-intelligence-cloud-strategy-v1]], and [[final-deployment-and-ip-protection-recommendation]], and answering seven specific questions about what remains inside Core Runtime, what could be copied or rebuilt, what actually differentiates a legitimate deployment from a copy, whether Core Runtime is too valuable to deploy, and which capabilities should still move to Teracom Intelligence Cloud. Documentation only — no code, no implementation.

## 2. Files created

| File | Purpose |
|---|---|
| `docs/architecture/CORE_RUNTIME_EXPOSURE_ASSESSMENT_V1.md` | The assessment itself |
| `docs/architecture/CORE_RUNTIME_EXPOSURE_ASSESSMENT_V1_REPORT.md` | This report |

## 3. Files reviewed

All four named source documents, re-read in full. First-hand code review was **reused, not repeated**, from the review already performed for [[deployment-and-ip-protection-strategy-v1]] (`services/context_builder.py`, `services/rag_service.py`, `services/ollama_service.py`, `models/worker.py`) — this task deliberately re-examined the same code under a hostile/adversarial framing rather than re-reading it as if for the first time, since the code itself hadn't changed since that review.

## 4. Why this document takes a different tone than its three predecessors

The task explicitly asked for this to be "the final IP-protection review before Licensing Package 4" — a stress test, not a restatement. The three source documents build a protection strategy by reasoning about what a well-executed architecture *should* achieve; this document instead asks what a technically capable holder of a legitimate Sovereign deployment could *actually do* with it today, and follows that question to its honest conclusion even where the conclusion is less reassuring than the prior documents' framing.

## 5. Key findings, and why each one is new rather than restated

- **§3's licence-stripping finding is new.** The three prior documents established that source code and content are visible in Sovereign/Air-Gapped deployments (a passive exposure risk). This document adds the active-risk case: because the licence-validation logic is itself visible source code, a sophisticated actor could deliberately remove it and run an unlicensed fork. This is a materially different threat model (defeating a control, not just observing content) that none of the three source documents stated explicitly.
- **§5's central finding is the sharpest departure from the prior documents' tone.** [[teracom-intelligence-cloud-strategy-v1]] and [[model-c-revised-architecture-v1]] both rely on "the differentiating capability lives in TIC, which never ships" as the reason Core Runtime's exposure is acceptable. This document makes explicit what was previously only implicit: that reasoning is currently a *strategy for future differentiation*, since TIC does not yet exist as a built product — meaning a copy made today would be functionally close to indistinguishable from genuine Teracom AI. This is not a contradiction of the prior documents' architecture (which remains correctly designed) but a statement that the architecture is currently protecting a largely empty box.
- **§4's competitive-parity finding is a genuinely new risk category**, distinct from copying: given how simple current orchestration logic is, a competitor could rebuild equivalent functionality independently, without any copying or exposure question arising at all. No prior document addressed this, because all three were scoped to protecting *Teracom's own* code and content, not to competitive dynamics from parties who never touch it.
- **§6 reframes "is Core Runtime too valuable to deploy" as the wrong question**, and answers it directly: no, because there isn't yet enough proprietary sophistication inside it to make withholding deployment meaningful — the correct response to this assessment's findings is urgency on building TIC's actual capability, not caution about shipping Core Runtime.
- **§7 reconfirms, rather than expands, the existing TIC capability list** — this document specifically re-examined whether any *current* Core Runtime code is more sophisticated than previously assessed and should move now, and found none. The "movement" recommendation remains entirely about future capability, which is precisely why §6's urgency finding is the practical takeaway of this whole review.

## 6. Structural decisions

- **Three labels, not the four-way scheme used elsewhere this session:** DECIDED (confirmed unchanged from a source document), FINDING (this document's own assessment — most of the document's content), and OPEN (surfaced, not resolved). PROPOSED was dropped because this document isn't proposing new architecture — it's testing existing architecture against a hostile reading, so its own contributions are better labelled as findings than as proposals.
- **§8 (Verdict for Package 4) is kept short and separate from the substantive findings**, mirroring how [[final-deployment-and-ip-protection-recommendation]] treated its own Package-safety questions — this review's contribution to that specific question is narrow (confirms the existing clearance, adds one caveat about what the clearance does and doesn't mean), and keeping it short avoids diluting §1–§7's more consequential findings.
- **§9's open questions are pointed rather than generic** — each one names a concrete follow-up action (accelerate TIC's build order, harden licence-validation against deliberate tampering, consider a commercial/legal response to competitive-parity risk) rather than restating "this is unresolved" without direction, since a review whose whole purpose is to be more actionable than its predecessors should not end on vaguer open items than they had.

## 7. Verification

- Every claim about current code sophistication (§1, §3, §7) was checked against the actual file contents reviewed first-hand for [[deployment-and-ip-protection-strategy-v1]], not re-asserted from that document's summary of them — this document independently re-derived its own conclusions from the same underlying evidence, arriving at a more pointed reading (§3, §5) than the earlier, more descriptive pass.
- The claim that Teracom Intelligence Cloud "does not yet exist as a built product" was checked against [[teracom-intelligence-cloud-strategy-v1]] §18's own build-order recommendation (which is prescriptive, not a status report of completed work) and against this session's own implementation history (only Customer Bootstrap Packages 1–2 have been built; no TIC capability of any kind has been implemented) — confirmed accurate.
- Every `[[wikilink]]` target was checked against a document that exists on disk, including all three prior architecture documents and the final recommendation document from the immediately preceding task.

## 8. Not done (explicitly out of scope)

- No resolution of any of §9's three open questions — each is a named worker's or the project owner's decision.
- No changes to [[teracom-intelligence-cloud-strategy-v1]]'s build order, [[licensing-service-architecture-v1]]'s security requirements, or any other existing document — this review's findings are flagged for those owners to act on, not applied unilaterally.
- No code, no implementation — consistent with every task in this documentation track.
