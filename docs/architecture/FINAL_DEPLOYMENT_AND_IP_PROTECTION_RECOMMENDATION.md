# Final Deployment and IP Protection Recommendation

**Status:** Definitive recommendation, 2026-08-16. Synthesises [[deployment-and-ip-protection-strategy-v1]], [[model-c-revised-architecture-v1]], and [[teracom-intelligence-cloud-strategy-v1]] into one closing decision record, and checks that record against the in-progress Customer Bootstrap implementation track ([[customer-bootstrap-implementation-plan-v1]], Packages 1–2 already built and validated — see [[customer-bootstrap-package-1-implementation-report]], [[customer-bootstrap-package-2-implementation-report]]). Documentation only. No code, no implementation.

This document does not re-argue anything already decided in the three source documents — it answers eight specific questions definitively, citing the source that settles each one, and states plainly wherever this document is the first place a question is actually being closed out.

**Note on "Package 4" in question 5:** the only numbered "Package 4" anywhere in this knowledge base is [[customer-bootstrap-implementation-plan-v1]] §10's build order ("Signup Frontend + Password Reset"). This document answers question 5 against that package, since no other numbered "Package 4" exists to be meant instead.

---

## 1. What is the recommended deployment model?

**Definitive recommendation:** there is no single hosting model to recommend over the others — SaaS (Teracom Hosted), Dedicated Hosted, and Sovereign each serve a different customer need and all three remain commercially valid per [[licensing-model-v1]] §3. What this document does recommend definitively is the **architecture pattern**: the Core Runtime / Teracom Intelligence Cloud split designed for Model C in [[model-c-revised-architecture-v1]] should be the **universal architecture for all hosting models**, not a special case built only for Sovereign.

Concretely: SaaS and Dedicated Hosted should be built (or, if built differently today, migrated toward) the same Core Runtime codebase that Sovereign and Air-Gapped run, with Teracom Intelligence Cloud always reachable for SaaS/Dedicated (since Teracom operates that infrastructure directly) rather than a structurally different, more-capable codebase existing only for those two models. This is a stronger, cleaner position than "Sovereign gets a stripped-down build" — it means **one codebase, one architecture, with connectivity and build-target as the only variables**, and it maximises IP protection even for SaaS: TIC-tier capability never needs to exist as shipped code in the Core Runtime artifact at all, for any customer, under any hosting model. This is the single most important architectural decision this document closes out, and it was implicit but not stated outright in either source document — this document makes it explicit and definitive.

## 2. What remains customer-owned?

**Definitive, unchanged from [[deployment-and-ip-protection-strategy-v1]] §3 — no new analysis needed, no exceptions found across any of the three source documents:**

- Knowledge base content, memory content, chat history, user/organisation records.
- Any fully custom worker configuration a customer authors themselves.
- The physical/virtual infrastructure itself, for Dedicated Hosted, Sovereign, and Air-Gapped.
- Per [[model-c-revised-architecture-v1]] §3.3's data-ownership override, confirmed again here: **no future Teracom Intelligence Cloud enrichment capability may make customer knowledge or memory data itself dependent on Teracom's infrastructure to get baseline function.** This override is binding on every future TIC capability without exception, per [[teracom-intelligence-cloud-strategy-v1]] §8–§9.

## 3. What remains Teracom-controlled?

**Definitive, consolidated from [[teracom-intelligence-cloud-strategy-v1]] §1–§12:** every capability inside the Teracom Intelligence Cloud boundary — Licensing, Entitlement, and Activation services (§10–§12 of that document); the Worker Recommendation Engine; Workforce Creation's natural-language interpretation layer; cross-worker Orchestration intelligence; Marketplace discovery/curation; Industry Workforce Pack curation authority; and the Knowledge/Memory enrichment *algorithms* (never the data they operate on — see §2 above). This list is definitive as of this document; any future capability should be tested against the same rule TIC already established: **if Core Runtime does not need it to function offline, it belongs in TIC, permanently.**

## 4. What must never be deployed?

**Definitive, unchanged from [[teracom-intelligence-cloud-strategy-v1]] §2 — this document confirms these four as non-negotiable, not subject to future case-by-case exception:**

1. Licence signing (private key custody and issuance).
2. The staff approval plane (`staff_users`).
3. The licensing audit log.
4. Third-party marketplace transaction mediation — Teracom-controlled by structural necessity (no connectivity, no mediated transaction), not by policy choice, and therefore true in every hosting model, not only Sovereign/Air-Gapped.

Every other Teracom Intelligence Cloud capability is centralised by design choice and could, in principle, be revisited; these four cannot be relaxed without breaking the licensing model or multi-tenant isolation itself.

## 5. What should be implemented before Package 4?

**Definitive answer: nothing new, for Package 4 itself.** [[customer-bootstrap-implementation-plan-v1]] §10 already scoped Package 4 (Signup Frontend + Password Reset) as pure frontend/BFF work over an already-built backend endpoint — it has no dependency on Teracom Intelligence Cloud, Model C, or IP-protection architecture, because it does not touch licensing, entitlement, or any TIC-boundary capability at all. Reviewing all three source documents against Package 4's actual scope found no new prerequisite this document needs to impose.

**What this document does recommend, before the *next* package that does intersect — Package 6, Minimal Staff Approval:** [[customer-bootstrap-implementation-plan-v1]] §1/§6 originally scoped Package 6's `licence_requests`/`staff_users` tables as an undifferentiated "minimal subset" of the full Licensing Service schema. This document recommends that, before Package 6 is designed in detail, its schema be shaped around the three-way **Licensing / Entitlement / Activation** distinction [[teracom-intelligence-cloud-strategy-v1]] §11–§12 draws for the first time — even a minimal implementation should keep these conceptually (and, ideally, structurally) separate from the start, since retrofitting the distinction after Package 6 ships would mean a schema rework rather than a clean addition. This is a recommendation to carry into Package 6's own design step, not a blocker on anything currently in flight.

## 6. Is Package 2 safe to continue?

**Yes, definitively.** Package 2 is already implemented and validated ([[customer-bootstrap-package-2-implementation-report]]) — `POST /signup`, the `organisations.status`/timestamp columns, and the collision/rate-limit fixes. Checked against all three source documents produced since: none of them touch the `organisations`/`users` schema, the signup mechanism, or anything Package 2 built. `organisations.status = "pending_licence"` remains exactly the right placeholder value Package 6 will act on later — nothing here needs rework.

**A clarifying finding this document adds, relevant to why there's no conflict:** self-service signup (Packages 2–4) is, by its nature, a **SaaS/Dedicated Hosted onboarding path** — an anonymous website visitor creating an account. A Sovereign or Air-Gapped deployment is, per [[licensing-model-v1]] §16's appliance-delivery model, provisioned through a negotiated commercial process and Activation Services ([[teracom-intelligence-cloud-strategy-v1]] §11), not through a public `/signup` endpoint. This means the entire bootstrap track sits structurally outside the Core Runtime / TIC boundary question this document otherwise addresses — it is Teracom's own onboarding system, not something that ships inside any customer's deployment, Model A/B/C alike. **This is an inference this document draws, not something explicitly stated in any reviewed document — flagged as an assumption worth the project owner's explicit confirmation (§9), not asserted as settled fact.** If wrong (i.e., if Sovereign customers are ever expected to self-serve through the same `/signup` flow), Packages 2–4 would need revisiting against connectivity assumptions they do not currently make.

## 7. Is Package 3 safe to continue?

**Yes, definitively, for the same reason as Package 2.** Package 3 (Email Integration) is not yet built. Nothing in the three source documents constrains it, and — per §6's clarifying finding — Package 3's email-sending capability lives in Teracom's own onboarding infrastructure, not inside any Core Runtime build, so it carries **no Air-Gapped packaging concern of any kind**: it was never going to be part of an Air-Gapped artifact in the first place, since Air-Gapped customers don't reach it via self-service signup. This removes a question that might otherwise have been raised (does the email layer need an offline fallback?) — it doesn't, because it never runs in an offline deployment.

## 8. Is Package 4 blocked pending architecture decisions?

**No — not blocked.** Per §5, Package 4 has no dependency on any decision made across the three source documents. It may proceed on its existing schedule. The only package in the current build order that this document recommends pausing to reconsider before detailed design is **Package 6** (§5 above), and even that is a schema-shaping recommendation, not a hard block — Package 6 could technically be built exactly as originally scoped and still function; this document simply recommends against that, to avoid predictable rework.

---

## 9. Consolidated recommendations

1. **Adopt the Core Runtime / Teracom Intelligence Cloud split as the universal deployment architecture** (§1) — the single definitive architectural decision this document closes out.
2. **Hold the four structural exclusions (§4) as permanent, not case-by-case** — this is the load-bearing guarantee behind every IP-protection claim made across all three source documents.
3. **Continue Packages 2 and 3 without modification** (§6, §7) — confirmed safe; no rework required.
4. **Proceed with Package 4 immediately** (§8) — not blocked by anything in this review.
5. **Before designing Package 6 in detail, shape its schema around the Licensing/Entitlement/Activation distinction** (§5) — a design-time recommendation, not a current blocker.
6. **Confirm explicitly, with the project owner, whether Sovereign/Air-Gapped customers are ever expected to use self-service `/signup`** (§6) — this document's finding that the bootstrap track is SaaS/Dedicated-only is an inference, not a ratified scope statement, and is the one open item this final review did not close out definitively.
