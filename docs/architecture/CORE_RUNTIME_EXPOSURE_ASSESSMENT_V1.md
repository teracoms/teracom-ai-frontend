# Core Runtime Exposure Assessment V1

**Status:** Final IP-protection review before Implementation Package 4, 2026-08-16. This document is deliberately more skeptical than [[deployment-and-ip-protection-strategy-v1]], [[model-c-revised-architecture-v1]], and [[teracom-intelligence-cloud-strategy-v1]] — its job is to stress-test those three documents' conclusions against a hostile reading ("what if a copier actually did this"), not to restate them. Documentation only. No code, no implementation.

**Sourcing:** First-hand, reusing the direct code review already performed for [[deployment-and-ip-protection-strategy-v1]] §2 (`services/context_builder.py`, `services/rag_service.py`, `services/ollama_service.py`, `models/worker.py`), re-examined here with a specifically adversarial lens rather than a descriptive one.

Per [[documentation-standards]] §2: this document states findings as **DECIDED** (confirmed against the three source documents, unchanged here), **FINDING** (this document's own honest assessment — the load-bearing content of this review), and **OPEN** (a question this assessment surfaces that it does not resolve).

---

## 0. Why this document exists, and why it is more blunt than its predecessors

The three source documents built a protection *strategy* (the Core Runtime / Teracom Intelligence Cloud split) largely by reasoning about what *should* be true of a well-executed architecture. This document asks a different question, deliberately adversarial: **if the strategy were fully implemented today, exactly as designed, what would a technically capable person holding a legitimate Sovereign deployment actually be able to do with it?** The honest answer, worked through below, is less comfortable than the prior three documents' tone might suggest — and that discomfort is the point of doing this review *before* Package 4, not after.

## 1. What intellectual property remains inside Core Runtime?

**FINDING, itemised and ranked, not merely restated from [[deployment-and-ip-protection-strategy-v1]] §4:**

| Asset | What it actually is | How much IP it really represents |
|---|---|---|
| Worker catalogue content | 11 personas' `Purpose`/`Responsibilities`/`instructions` text ([[foundation-workforce-catalogue-v2]]), stored as plain `String(5000)` columns (`models/worker.py`, confirmed first-hand) | Real, but it is *editorial* IP (curation and writing quality), not technical IP — equivalent to a well-written playbook, not an algorithm |
| Orchestration source code | `context_builder.py` (a flat string template), `rag_service.py` (unranked top-*k* Chroma search), `ollama_service.py` (an 18-line HTTP wrapper) | **Minimal.** Confirmed first-hand, again, for this review specifically: none of this contains a proprietary algorithm, model, or non-obvious technique. It is competent, working glue code around three open-source components (Ollama, Chroma, `sentence-transformers`) |
| Integration architecture | How organisation-scoped multi-tenancy, permissions, knowledge, memory, and chat compose into one coherent product | Moderate — this is standard SaaS architecture (`organisation_id` scoping, role-based gating), well-executed but not a novel pattern a competent architect couldn't reproduce |
| Local licence validation logic | JWS signature check against an embedded public key, hardware-fingerprint comparison ([[licensing-service-architecture-v1]] §14) | **This is Teracom IP that is *safe to expose in full*** — its security property (a customer cannot forge a valid licence) holds even with complete source visibility, because it depends on withheld key material (§4), not on the validation code being secret. This is the one Core Runtime asset whose full transparency does not weaken it at all |

**The uncomfortable summary:** ranked by conventional "technical moat" standards, Core Runtime today contains **one real content asset** (the catalogue) and **effectively no defensible algorithmic sophistication**. This is not a new finding — [[deployment-and-ip-protection-strategy-v1]] §2 already established it — but this document states its consequence more directly: there is currently very little *technical* IP inside Core Runtime for a copier to actually be stealing, beyond the catalogue text and the fact that everything already works together.

## 2. What commercial value remains inside Core Runtime?

**FINDING:** commercial value and technical IP are not the same thing, and Core Runtime has more of the former than the latter:

- **Integration/time-to-value.** A working, tested, packaged product has real value to a paying customer over "build it yourself from the same open-source pieces," even when no individual piece is sophisticated — assembly, testing, and support are themselves worth paying for.
- **Curation quality of the catalogue** — genuinely useful, saves a customer real evaluation and prompt-engineering time, independent of whether the underlying mechanism is simple.
- **The ongoing relationship**, not the artifact — appliance upgrade packages ([[licensing-model-v1]] §16), support (Tier 1/Tier 2, §17), and access to Teracom Intelligence Cloud (once it exists — see §7) are all things a static copy of Core Runtime cannot get, ever, regardless of how good the copy is.
- **Brand and warranty** — not code, but real commercial value bundled with a legitimate deployment.

**The point this framing makes explicit:** Core Runtime's commercial value is concentrated in things that don't get copied *even when the code does* — a copy is a frozen snapshot with no future, while a legitimate deployment is a relationship with one.

## 3. What could realistically be copied?

**FINDING — this is where the assessment gets genuinely adversarial:**

- **Trivially, today:** the entire Core Runtime source tree (plain, unobfuscated Python — confirmed across every file this and the prior review examined), the full worker catalogue content (plain database text), and the overall system architecture (observable by anyone with database access).
- **With deliberate technical effort, by a sophisticated actor holding a legitimate Sovereign/Air-Gapped deployment:** stripping the licence-validation check out of a copied codebase entirely. Because the *validation logic itself* is visible source code (§1), and because [[licensing-service-architecture-v1]] §14's validation step is a code path like any other in a fully-visible deployment, a sufficiently motivated party with source access could delete or bypass it and run an un-gated fork indefinitely. **This is a materially different and more serious risk than "reading the catalogue text"** — it is defeating the commercial control, not just observing the content — and it was not stated this plainly in any of the three source documents. It is bounded by two real deterrents that are legal, not technical: doing so is a clear breach of licence/contract and likely copyright law, and it forfeits all access to upgrades, support, and Teracom Intelligence Cloud (§2). Those deterrents are real, but they are not *technical* protections, and this document does not overstate them as such.
- **Not copyable under any of the above:** the signing private key (never present, §4), and therefore the ability to issue new valid licences for other deployments — a stripped fork is stuck running whatever licence file it had at the moment of copying (or none, if the check was removed), and cannot legitimately expand.

## 4. What could realistically be rebuilt (independently, without copying anything)?

**FINDING, and the least comfortable one in this document:** given §1's finding that current orchestration logic is genuinely simple, a competent, resourced engineering team could **rebuild equivalent Core Runtime functionality from scratch**, using the same open-source components (FastAPI, SQLAlchemy, Ollama, Chroma, `sentence-transformers`), in a matter of weeks to a few months — without touching a single line of Teracom's code and without any exposure/copying question arising at all. This is not a copying risk; it is a **competitive-parity** risk, and it exists independently of every protection this document's predecessors designed, because those protections govern *Teracom's own code*, not a competitor's freedom to write comparable code from the same public building blocks.

**What would be harder to rebuild:** the curated catalogue content specifically (requires real domain expertise and iteration, even though the *mechanism* for using it is trivial) and the accumulated product polish/testing across the packages already shipped this project. Both are real but modest moats — neither is a technical barrier a well-funded competitor couldn't clear.

## 5. What differentiates a copied Runtime from Teracom AI?

**FINDING — this is the central, load-bearing answer of this whole assessment.** Given §1–§4, the honest answer is: **almost nothing, today.** A copied (or independently rebuilt) Runtime, run with its licence check intact and a legitimately-obtained licence, would be *functionally indistinguishable* from genuine Teracom AI, because:

- It contains the same catalogue content (if copied) or comparably-curated content (if rebuilt).
- It runs the same open-source Ollama/Chroma/`sentence-transformers` stack.
- It has access to exactly the same orchestration sophistication — because that sophistication, today, is minimal (§1).
- **Teracom Intelligence Cloud, the thing every one of the three prior documents relies on as the actual differentiator, does not yet exist as a built product.** [[teracom-intelligence-cloud-strategy-v1]] §18 recommends a build order; none of it has shipped. A copier today is not missing a sophisticated recommendation engine or orchestration intelligence — they are missing *plans* for one.

**This document states plainly what the prior three implied but did not say outright:** the entire protection thesis — "the differentiating capability lives in TIC, which never ships" — is currently a **strategy for future differentiation**, not a description of present differentiation. Today, the gap between a legitimate Teracom AI deployment and a well-executed copy is the catalogue's editorial quality, ongoing support/updates, and legal standing — real, but thin, and entirely non-technical.

## 6. Is Core Runtime too valuable to deploy?

**FINDING, and a direct answer: no — and for a reason that should reframe how this question gets asked going forward.** "Too valuable to deploy" implies withholding Core Runtime would protect something substantial. §1–§5 found the opposite: Core Runtime today does not contain enough proprietary sophistication to make broad deployment (including Sovereign and Air-Gapped) a significant technical-IP risk. **The real risk this assessment surfaces is not that Core Runtime is too valuable to ship — it is that Teracom Intelligence Cloud is not yet valuable enough to constitute the differentiator the strategy assumes.** Withholding Core Runtime deployment would forgo real, current revenue to protect technical sophistication that mostly doesn't exist yet; it would not meaningfully change a competitor's or copier's position, since §4 already found independent rebuilding is realistic regardless of what Teracom does with its own deployment policy.

**The correct response to this finding is urgency on building TIC, not caution on shipping Core Runtime.** Every month Core Runtime ships broadly while TIC remains unbuilt is a month where §5's "almost nothing" answer stays true. This is this document's central recommendation, expanded in §7.

## 7. Which capabilities should move from Runtime into Teracom Intelligence Cloud?

**DECIDED, reconfirmed without change from [[teracom-intelligence-cloud-strategy-v1]] §1–§9:** Worker Recommendation Engine, Workforce Creation's natural-language interpretation layer, cross-worker Orchestration intelligence, Marketplace discovery/curation, Industry Workforce Pack curation authority, and the Knowledge/Memory enrichment *algorithms* (never the underlying data, per the data-ownership override). This review examined each of these against §1–§6's adversarial lens and found no reason to revise the list — every one of them is exactly the kind of capability whose absence from a copied Runtime (§5) would actually matter, once built.

**FINDING, new to this review:** the current Core Runtime components examined in §1 (`context_builder.py`, `rag_service.py`, the auto-memory heuristic) were re-examined for whether *any* of them are more sophisticated than they appear and should move now. None are — each is confirmed, again, to be simple enough that (a) withholding it would gain little protection (§1) and (b) it is required for basic offline function, so withholding it isn't structurally possible without breaking the offline-capability requirement anyway. **No current Core Runtime code is recommended for movement into TIC by this review** — the movement recommendation is entirely about *future* capability that does not exist yet, which is exactly why §6's urgency point matters: the protective architecture is correctly designed, but it is currently protecting a mostly-empty box.

## 8. Verdict for Package 4

**DECIDED:** nothing in this assessment blocks Implementation Package 4 ([[customer-bootstrap-implementation-plan-v1]] §10, Signup Frontend + Password Reset) — consistent with [[final-deployment-and-ip-protection-recommendation]] §8's finding, reconfirmed here with the additional scrutiny this review applied. Package 4 touches none of the assets examined in §1–§7.

**The one thing this review adds to that clearance:** Package 4 proceeding is safe *specifically because* it doesn't touch IP-sensitive surfaces — it is not evidence that the broader IP-protection posture is strong, only that this particular package doesn't test it. §6's urgency finding stands independently of Package 4's clearance.

## 9. Open questions this assessment surfaces, not resolved here

| # | Question | Owner |
|---|---|---|
| 1 | Should Teracom Intelligence Cloud's build order ([[teracom-intelligence-cloud-strategy-v1]] §18) be accelerated given §5–§6's finding that current differentiation is thin? | [[project-manager-worker]] / [[cto-worker]] |
| 2 | Should the licence-validation code path (§3) be hardened against deliberate removal (e.g. cryptographic self-checks, tamper-evidence) beyond what [[licensing-service-architecture-v1]] §22 already specifies, given this review's finding that source visibility makes stripping it a realistic technical possibility, not just a hypothetical one? | [[cybersecurity-worker]] |
| 3 | Is competitive-parity risk (§4 — independent rebuilding using the same open-source components) something the commercial/legal strategy should address directly (e.g. speed-to-market, patents on genuinely novel future TIC capability), given this document found no technical protection addresses it at all? | Project owner / [[cto-worker]] |
