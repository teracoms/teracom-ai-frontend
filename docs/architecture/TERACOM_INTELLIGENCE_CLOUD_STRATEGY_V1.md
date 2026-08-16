# Teracom Intelligence Cloud — Strategy V1

**Status:** Decision document, 2026-08-16. Consolidates [[deployment-and-ip-protection-strategy-v1]] and [[model-c-revised-architecture-v1]] into one named product definition — the **Teracom Intelligence Cloud (TIC)** — rather than leaving the same set of capabilities scattered across two documents under the informal name "Teracom Cloud Intelligence." Documentation only. No code, no implementation.

**Naming note:** the two source documents used "Teracom Cloud Intelligence" as a working label. This document adopts **Teracom Intelligence Cloud (TIC)** as the formal product name going forward and is the source of record for it — the substance is unchanged from those two documents; only the name is being fixed in one place so future documents cite one consistent term.

Per [[documentation-standards]] §2: **DECIDED** (already established in the two source documents, cited by section, not re-argued here), **PROPOSED** (new in this document — a naming choice, a service grouping, or a recommendation, for review), **OPEN** (unresolved).

---

## 0. What the Teracom Intelligence Cloud is, in one paragraph

**PROPOSED, consolidating [[model-c-revised-architecture-v1]] §3:** TIC is the single, Teracom-operated service boundary that hosts every platform capability which either (a) must never run on customer infrastructure under any hosting model — the licensing/entitlement authority — or (b) represents sophisticated, differentiating intelligence that isn't required for a Core Runtime deployment to function offline. Every TIC capability is reachable only from a Core Runtime deployment holding a valid licence, and — per the design rule already decided in [[model-c-revised-architecture-v1]] §4 — every non-licensing TIC capability must be safely callable zero times over a deployment's lifetime with no loss of core product function.

---

## 1. Services hosted by Teracom

**DECIDED, consolidated from [[model-c-revised-architecture-v1]] §3 and §3.2:**

| Service | Nature |
|---|---|
| Licence signing (private key custody, licence generation) | Always-centralised authority |
| Staff approval plane (`staff_users`, request review) | Always-centralised authority |
| Licensing audit log | Always-centralised authority |
| Advanced retrieval / re-ranking | Optional reachable enhancement |
| Worker Recommendation Engine | Optional reachable enhancement |
| Workforce Creation natural-language interpretation | Optional reachable enhancement |
| Cross-worker orchestration intelligence | Optional reachable enhancement |
| Marketplace discovery/curation (first-party) | Delivered update + optional live discovery |
| Marketplace transaction mediation (third-party) | Always-centralised, structurally (§2) |
| Industry Workforce Pack curation authority | Delivered update |
| Advanced memory extraction/summarisation algorithm | Optional reachable enhancement, data-ownership-constrained (§9) |
| Knowledge enrichment algorithm | Optional reachable enhancement, data-ownership-constrained (§8) |
| Entitlement tracking (tier, limits, packs, subscription state) | Always-centralised authority (§12) |
| Activation (hardware-fingerprint binding, re-binding, ownership transfer) | Always-centralised authority (§11) |

## 2. Services that must never be deployed to customer infrastructure

**DECIDED, restated as a hard boundary, not a preference:** four services in the table above are not merely "usually centralised" — they are architecturally incapable of running correctly on customer infrastructure and must never be packaged into any Core Runtime build, Sovereign or otherwise:

1. **Licence signing** — per [[licensing-service-architecture-v1]] §13.2, shipping the private key anywhere defeats the entire purpose of a signed artefact; only the public key ever leaves Teracom.
2. **Staff approval plane** — a Teracom-internal, cross-tenant identity surface ([[licensing-service-architecture-v1]] §11.1); it must be able to see every customer's requests, which a customer-hosted instance structurally cannot do without breaking multi-tenant isolation for every other customer.
3. **Licensing audit log** — the record of what Teracom's staff decided and why; a customer holding their own copy could edit it, defeating its purpose as evidence.
4. **Third-party marketplace transaction mediation** — not for IP reasons but a structural one already identified in [[model-c-revised-architecture-v1]] §3.2: live transaction and revenue-share mediation cannot exist without connectivity to a mediating party. This is the one entry on this list that is Teracom-controlled by physics, not by design choice, and is therefore true for every hosting model, not only Sovereign/Air-Gapped.

Every other TIC service (recommendation, orchestration, enrichment, marketplace *discovery*, pack curation) is centralised **by design choice** (it doesn't need to be local, and centralising it protects IP per §17), not by structural necessity — worth distinguishing from the four above, since a future architectural change could in principle relax those, while the four above cannot be relaxed without breaking the licensing model or multi-tenant isolation itself.

## 3. Worker recommendation services

**DECIDED ([[model-c-revised-architecture-v1]] §3.2):** Teracom-controlled, optional reachable enhancement. Advisory only — a recommendation the customer can accept or ignore, never an automatic action (consistent with [[digital-workforce-platform-v1]] §4's own "never automatic creation" framing). No fallback is needed when unreachable; the product simply shows no recommendation.

## 4. Marketplace services

**DECIDED, split per [[model-c-revised-architecture-v1]] §3.2:** first-party template discovery/curation is Teracom-controlled but delivered as a periodic catalogue update (§3.1 of that document), not a live dependency. Third-party/partner marketplace transaction mediation is Teracom-controlled structurally (§2 above) — it is unavailable, not degraded, in Sovereign and Air-Gapped by definition, and this document does not propose a workaround, since none exists that preserves live transaction integrity without connectivity.

## 5. Worker pack services

**DECIDED ([[model-c-revised-architecture-v1]] §3.2), Industry Workforce Packs specifically:** curation authority (which personas suit which industries) is Teracom-controlled IP; the resulting content, once curated, is delivered via the same signed upgrade bundle as everything else ([[licensing-model-v1]] §16) and instantiated locally by Core Runtime — it must be present on the device to function, exactly like the base 11-persona catalogue.

**Distinguished from commercial "Worker Packs" ([[licensing-model-v1]] §7, +5/+10 add-on capacity):** that is an entitlement concept (how many workers a licence permits), not a content concept — it belongs to §12 (Entitlement Services), not here. This document uses "worker pack" only in the Industry Workforce Pack (content-bundle) sense per the task's own §5 heading, and flags the naming overlap with the commercial worker-pack entitlement so a future reader doesn't conflate the two.

## 6. Workforce creation intelligence

**DECIDED ([[model-c-revised-architecture-v1]] §3.2):** the natural-language *interpretation* layer of workforce creation (turning "I need a cybersecurity worker for a 50-person manufacturing firm" into a concrete template and configuration) is Teracom-controlled — this is the Natural-Language-First tier of [[ux-vision]]'s own hierarchy, and it turns out to be exactly the interpretive-intelligence boundary this whole strategy protects. The Wizard and Forms tiers underneath it (today's Package 3 creation flow) remain Core Runtime, always available, and are the fallback when this TIC service is unreachable or absent.

## 7. Orchestration intelligence

**DECIDED ([[model-c-revised-architecture-v1]] §3.2), split:** basic single-worker message-to-context orchestration (`context_builder.py`, `rag_service.py` in their current form) is Core Runtime — required for any offline function at all. **Cross-worker** orchestration — delegation, hand-off, arbitration between multiple workers on one task ([[digital-workforce-platform-v1]] §9's worker-to-worker collaboration) — is Teracom-controlled, since it is genuinely sophisticated, differentiating logic with no offline-necessity argument. A Sovereign/Air-Gapped deployment without this service can still use every individual worker normally; it simply cannot orchestrate them together.

## 8. Knowledge enrichment services

**DECIDED ([[model-c-revised-architecture-v1]] §3.2/§3.3):** the enrichment *algorithm* (summarisation, richer metadata extraction beyond today's local `sentence-transformers` embedding) is a legitimate Teracom-controlled, optional enhancement. **The knowledge content it operates on is never required to leave the customer's environment merely to get baseline function** — the data-ownership override (§3.3 of the architecture document) applies without exception. Local embedding/chunking remains the mandatory, always-available baseline in every hosting model.

## 9. Memory enrichment services

**DECIDED ([[model-c-revised-architecture-v1]] §3.2/§3.3), identical shape to §8:** an improved extraction/summarisation algorithm over today's 7-trigger-phrase heuristic ([[digital-workforce-platform-v1]] §10) can be Teracom-controlled IP; the memory data itself is customer-owned and must always retain a fully-functional local fallback. This document treats §8 and §9 as the same principle applied to two different data types, not two independent design questions.

## 10. Licensing services

**DECIDED, fully designed already in [[licensing-service-architecture-v1]] — not re-derived here:** licence generation (§12 of that document), signed licence file structure (§13), and the customer-facing `/licensing/*` API (§23.1) are the mechanism that turns a commercial entitlement into a verifiable technical artefact. This is the most mature part of TIC — the only one with a substantially complete design already — and this document's contribution is placing it inside the named TIC boundary alongside the newer, less-developed services rather than treating it as a separate concern.

## 11. Activation services

**PROPOSED — a service grouping named here for the first time, assembled from pieces already designed elsewhere, not a new capability:** "Activation" is the process of binding a specific physical or virtual deployment instance to a licence, and covers exactly three flows already specified individually in [[licensing-service-architecture-v1]]:

1. **Initial activation** — hardware fingerprint capture and binding at first licence issuance (§9, §12).
2. **Re-activation / hardware re-binding** — the `hardware_rebind` request type (§9.3, §10), for legitimate hardware changes.
3. **Ownership transfer activation** — re-establishing (or deliberately not re-establishing, per [[licensing-model-v1]] §11's still-open question) the hardware binding when a licence changes hands (§16 of the architecture document).

**Why this is worth naming as its own service rather than folding into "Licensing":** activation is specifically about *this device*, whereas licensing more broadly (§10) is about *this customer's entitlement*. Keeping them conceptually distinct (even though they share the same `licence_requests` table and approval pipeline today) matters once Sovereign/Air-Gapped deployments are considered, since activation is the one licensing-adjacent flow that has genuinely different mechanics depending on connectivity (§14, §15), while the underlying entitlement does not.

## 12. Entitlement services

**PROPOSED — a distinction this document draws explicitly for the first time, separating two things [[licensing-service-architecture-v1]] §2 already keeps in separate tables but had not named as separate *services*:** Entitlement Services are the source of commercial truth — tier, worker/user/organisation limits, worker-pack additions, subscription payment state (`subscriptions` and `entitlements` tables, §4–§7 of that document). **Licensing Services (§10) are the mechanism that expresses a snapshot of entitlement as a signed, offline-verifiable artefact.** The distinction matters operationally: entitlement can change the moment a payment clears or a staff member approves a pack addition, while the *licence file* reflecting that change is only produced when the Licence Generation Workflow runs (§12 of that document) — Entitlement Services own the "what's true now," Licensing Services own "what's provably true to a deployment that can't ask."

## 13. Customer Runtime API boundaries

**DECIDED, per [[model-c-revised-architecture-v1]] §4, restated with TIC's now-formal name:** every TIC capability is reached through one clearly namespaced boundary from Core Runtime — this document renames the namespace from that document's placeholder `/cloud-intelligence/*` to **`/teracom-intelligence-cloud/*`** for consistency with §0's naming decision (a naming change only; every endpoint, fallback behaviour, and design rule already specified there is unchanged):

- `/teracom-intelligence-cloud/retrieval/rerank`, `/recommendations/workers`, `/orchestration/*`, `/enrichment/knowledge`, `/enrichment/memory`, `/marketplace/discover` — optional reachable enhancements, all governed by the same rule: safely callable zero times with no loss of core function.
- `/teracom-intelligence-cloud/catalogue/updates` — delivered-update polling (§3.1 of the architecture document), never on a request's critical path.
- `/licensing/*`, `/activation/*` — the licensing/entitlement/activation lifecycle itself (§10–§12), distinguished from the enhancement endpoints above because they are not optional in the same sense — a deployment without a valid licence is in Grace or Locked Mode ([[licensing-service-architecture-v1]] §17–§18) regardless of connectivity, though the *validation* of an already-issued licence still runs entirely locally (§14 of that document).

**PROPOSED, new in this document:** every call to any `/teracom-intelligence-cloud/*` endpoint (not just `/licensing/*`) should present the deployment's current licence/hardware-fingerprint-derived credential as authentication — meaning TIC access itself is entitlement-gated, not just anonymously available to anyone who can reach the URL. This gives Entitlement Services (§12) a natural enforcement point (e.g., a Starter-tier deployment could be denied a Platinum-only enhancement) without needing separate plumbing, and is elaborated in §18.

## 14. Sovereign deployment impacts

**DECIDED, per [[model-c-revised-architecture-v1]] §6, unchanged by this document:** intermittent connectivity is assumed. Every optional TIC enhancement is called opportunistically; its absence degrades nothing in Core Runtime. Licence renewal uses the existing 90-day-window API path over whatever connectivity is available. Activation (§11) and Entitlement (§12) flows use the same `/licensing/*`/`/activation/*` paths as any other Model C deployment.

## 15. Air-gapped deployment impacts

**DECIDED, per [[model-c-revised-architecture-v1]] §7, unchanged by this document:** the Air-Gapped build must exclude every `/teracom-intelligence-cloud/*` client code path at packaging time, not merely fail to reach it at runtime (a runtime flag inside fully-visible code is not real protection, per [[deployment-and-ip-protection-strategy-v1]] §5). Cloud-based knowledge connectors cannot function. Activation and licensing use the file-export/physical-media/file-import workflow already specified. Marketplace transaction mediation (§2, §4) is unavailable, not degraded — the one TIC capability that is unavailable for structural reasons rather than by the build-exclusion policy applied to everything else.

## 16. Commercial benefits

**PROPOSED — new in this document, not previously analysed in either source document:**

- **Faster iteration without a re-appliance cycle.** Every enhancement inside TIC can improve continuously for SaaS/Dedicated customers without waiting for the signed-upgrade-package cadence ([[licensing-model-v1]] §16) that Sovereign/Air-Gapped content updates depend on — a real, ongoing product-velocity advantage for the hosting models Teracom operates directly.
- **A natural upsell axis.** Because TIC access is proposed to be entitlement-gated (§13), specific TIC capabilities (recommendation engine, advanced enrichment) can be tied to specific tiers, giving [[licensing-compliance-worker]]/the project owner a lever for tier differentiation beyond raw worker/user/organisation counts — not previously available, since today's tiers ([[licensing-model-v1]] §2) differ only by numeric limits.
- **A durable moat that competitive replication can't shortcut by reading shipped code.** Per [[deployment-and-ip-protection-strategy-v1]] §5, a competitor (or a customer) with full access to a Sovereign deployment's source code learns nothing about TIC's actual sophistication, because none of it ships. This is a commercial advantage, not only an IP one: differentiating capability stays differentiating for as long as it stays inside TIC.
- **A future revenue line from the third-party marketplace** (§2, §4), once the partner/MSP model ([[licensing-model-v1]] §18) is ratified — structurally only possible because transaction mediation is centralised in the first place.

## 17. IP protection benefits

**DECIDED, restated as the direct payoff of [[deployment-and-ip-protection-strategy-v1]]'s central finding, not re-argued:** that document found (§5) that source code and content shipped to Sovereign/Air-Gapped deployments are not technically protectable once there — no obfuscation or licence flag changes that. TIC's entire value as an IP-protection mechanism is that it sidesteps the question rather than attempting to solve it: capability that never ships cannot be exposed, regardless of how much infrastructure access a customer has. Every service in §1 gains this protection **only if** §2's boundary is actually held — the moment a "Teracom-controlled" service is packaged into a Core Runtime build for convenience, this protection is void for that service, permanently, for every customer who ever receives that build. This is why §2's four structural exclusions are framed as hard rules rather than defaults that could reasonably be overridden case by case.

## 18. Recommended architecture

**PROPOSED, for review:**

1. **One authenticated boundary, entitlement-gated (§13).** Every TIC capability sits behind `/teracom-intelligence-cloud/*`, authenticated by the calling deployment's licence credential — not a separate API-key scheme per capability. This also gives Entitlement Services (§12) a single enforcement point rather than one per feature.
2. **Bounded services, not one monolith**, mirroring the groupings in §1's table: Licensing, Entitlement, and Activation (§10–§12) as one closely-related cluster (they already share data today, per [[licensing-service-architecture-v1]] §10's `licence_requests` table); Recommendation, Orchestration-intelligence, and Workforce-creation-intelligence as a second cluster (all advisory, all optional, all likely to share underlying model infrastructure); Knowledge/Memory enrichment as a third cluster, architected from day one with the data-ownership override (§8, §9) as a hard constraint — e.g., processing customer content in-memory only, with no retention beyond the transient call, contractually and technically.
3. **Marketplace discovery and curation ship as delivered updates first**, with live discovery as a later enhancement — this matches [[model-c-revised-architecture-v1]] §3.1's existing distinction and is the lowest-engineering-cost cluster to stand up, since it requires no new ML/LLM capability, only a curation and packaging workflow.
4. **Build order follows maturity, not the numbering above:** Licensing/Entitlement/Activation first (already substantially designed — this is mostly implementation of existing architecture, per [[licensing-service-architecture-v1]] §24.5's own prerequisite list), then Marketplace/Industry-Pack delivery (content-and-packaging shape, no new inference infrastructure), then Recommendation/Workforce-creation/Orchestration intelligence (require real model-serving infrastructure), then Knowledge/Memory enrichment last — not because it matters least, but because it carries the data-ownership constraint (§8, §9) that the other clusters don't, and deserves a considered design rather than being retrofitted onto infrastructure built for the other clusters' simpler data-handling assumptions.

**OPEN, carried forward:** every open decision already listed in [[model-c-revised-architecture-v1]] §9 applies unchanged to TIC under its new name; this document adds one more — whether TIC access should genuinely be entitlement-gated per capability (§13, §18) or uniformly available to any deployment holding any valid licence, is a project-owner/[[licensing-compliance-worker]] commercial decision, not decided here.
