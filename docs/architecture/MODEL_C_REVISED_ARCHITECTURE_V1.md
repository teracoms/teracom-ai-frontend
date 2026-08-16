# Model C (Customer Hosted / Sovereign) — Revised Architecture V1

**Status:** Decision document, 2026-08-16. Builds directly on [[deployment-and-ip-protection-strategy-v1]]'s central recommendation (the two-layer Core Runtime / Teracom Cloud Intelligence split) and makes it concrete for **Model C** — this document's shorthand for [[licensing-model-v1]] §3's third hosting model, "Customer Hosted (Sovereign)" (Model A = Teracom Hosted/SaaS, Model B = Dedicated Hosted, Model C = Customer Hosted, in that document's own listed order). No code, no implementation — this is an architecture decision record for what should be built, not a build.

**Governing constraint, restated as this document's starting premise, not re-argued:** the customer owns their data, their knowledge, and their memory, in every deployment model, without exception (per [[deployment-and-ip-protection-strategy-v1]] §3). Every decision below is filtered through that constraint first, and through "maximum *practical* IP protection" second — practical meaning this document does not propose protections that are technically impossible given Model C's own offline-capability requirement ([[licensing-model-v1]] §8), only ones that are actually achievable.

---

## 1. The governing design principle

Model C's entire technical challenge is that it must satisfy two requirements that pull in opposite directions:

1. **The product must work fully on customer-controlled infrastructure**, including with no live connection to Teracom at request time ([[licensing-model-v1]] §8).
2. **Teracom must retain maximum practical control over its own IP**, per [[deployment-and-ip-protection-strategy-v1]] §5's finding that code and content shipped to customer infrastructure are not technically protectable once there.

**The resolution this document adopts:** split the system into two tiers along exactly the line where requirement 1 stops applying. Anything the product needs to function offline runs on customer infrastructure and is accepted as IP-exposed (per the prior document's residual-risk finding — restated, not re-litigated, in §9). Anything not required for offline function is never shipped to customer infrastructure at all — it stays Teracom-hosted, reachable only when connectivity exists, and simply produces no output (not an error, not a disabled button) when it doesn't.

## 2. Components deployed on customer infrastructure (Model C "Core Runtime")

Everything below runs inside the customer's own environment, is included in every Model C build (Sovereign and Air-Gapped alike — §7, §8), and must function with zero connectivity to Teracom:

| Component | Source (`teracom-ai-backend`) | Why it must be local |
|---|---|---|
| Application server (FastAPI) | `main.py` and all 40+ routers | The product itself |
| Organisation/user/worker data | `models/organisation.py`, `models/user.py`, `models/worker.py`, `api/organisations.py`, `api/users.py`, `api/workers.py` | Customer-owned records (§0) |
| Knowledge storage and ingestion | `services/knowledge_service.py`, `knowledge_ingestion_service.py`, `document_service.py`, `document_management_service.py`, `upload_service.py` | Customer-owned content (§0); must be usable offline |
| Vector search | `services/chroma_service.py`, `embedding_service.py` (Chroma + `sentence-transformers`, both open-source, not Teracom IP) | Must run locally for offline retrieval |
| Memory | `services/memory_service.py`, `auto_memory_service.py`, `memory_summary_service.py` | Customer-owned content (§0); capture happens during every chat turn, which must work offline |
| Chat | `services/chat_session_service.py`, `chat_persistence_service.py`, `services/ollama_service.py` (Ollama, open-source, not Teracom IP) | Core product function; must work offline |
| Context assembly (today's simple version) | `services/context_builder.py`, `services/rag_service.py` | Deliberately kept local — see §2.1 |
| Knowledge connectors | `services/connectors/*` (OneDrive, SharePoint, Teams) | Local, but see §8 for a hard Air-Gapped caveat |
| Administration, permissions | `api/permissions.py`, admin/portal routers | Customer-owned organisational control |
| Local licence validation | New module, per [[licensing-service-architecture-v1]] §14 — validates the signed licence file against the embedded **public** key | Must work with zero network access (§6) |
| Worker catalogue content, as delivered at build/update time | The 11 persona `instructions` templates ([[foundation-workforce-catalogue-v2]] §5), embedded in the local database | Must be present locally for workers to function offline — this is the accepted content-exposure residual risk (§9), not something this architecture attempts to hide |

### 2.1 Why `rag_service.py`/`context_builder.py` stay local, deliberately, even though they're the seam

[[deployment-and-ip-protection-strategy-v1]] §2 found today's retrieval/context logic is genuinely simple (a flat template, an unranked top-*k* search). This document's decision: the **current** implementation stays part of Core Runtime and ships everywhere, because a customer deployment cannot function at all without *some* retrieval and context-assembly step, and today's version is not sophisticated enough to be worth withholding. What changes going forward is described in §3 — any *future*, materially more sophisticated version of this logic is where the architectural boundary actually bites.

## 3. Components hosted by Teracom ("Teracom Cloud Intelligence")

These components exist only in Teracom's own infrastructure, are called over a network API from Core Runtime when reachable, and are **absent by build**, not merely unreachable, from Air-Gapped deployments (§8):

| Component | Status today | Reachability |
|---|---|---|
| Licence signing service (private key custody, licence generation) | Designed, not built — [[licensing-service-architecture-v1]] §12, §22.1 | Teracom-only, always — never reachable from any customer deployment as a callable service; a signed *file* is delivered to the customer, the *signing capability* never is |
| Staff approval plane (`staff_users`, licence request review) | Designed, not built — §11.1 of that document | Teracom-only, always |
| Licensing audit log | Designed, not built — §21 of that document | Teracom-only, always |
| Advanced retrieval / re-ranking (future) | Does not exist yet | Reachable from Core Runtime as an optional enhancement over §2.1's local fallback, when connectivity exists |
| Worker Recommendation Engine (future) | Does not exist yet — [[digital-workforce-platform-v1]] §4 | Same — optional enhancement, never a hard dependency |
| Industry Workforce Pack curation / catalogue updates (future) | Does not exist yet — [[digital-workforce-platform-v1]] §14 | Delivered as versioned content updates via the existing appliance upgrade-package mechanism ([[licensing-model-v1]] §16), not queried live — see §3.1 |
| Any future cross-customer analytics/learning | Does not exist yet | Teracom-only, always — this class of capability structurally requires data from more than one customer, so it can never be architected to run inside a single customer's Sovereign/Air-Gapped deployment regardless of connectivity |

### 3.1 A distinction worth making explicit: "reachable enhancement" vs. "delivered update"

Two different relationships between Core Runtime and Teracom Cloud Intelligence are both valid and both used above, for different reasons:

- **Reachable enhancement** (advanced retrieval, recommendation engine): Core Runtime calls out live, uses the response if it gets one, falls back to its own local logic if it doesn't. This requires connectivity *at the moment of use*.
- **Delivered update** (catalogue curation, industry packs): Teracom's curation work happens entirely on Teracom's side and is periodically packaged into the same signed upgrade bundle every Model C deployment already receives ([[licensing-model-v1]] §16). This requires connectivity only *occasionally, out of band from normal operation* — which is why it is the right shape for catalogue content specifically, since (per §2) that content must ultimately live locally regardless.

### 3.2 Classification of named future platform capabilities

The capabilities most often raised as candidates for "should this stay permanently Teracom-controlled" are classified here explicitly, so future work on any of them starts from a decided placement rather than re-deriving one. **The governing test is not "is this valuable" but "does Core Runtime need it to function offline" — anything that fails that test is a Cloud Intelligence candidate; anything that passes it stays local regardless of how sophisticated it later becomes.**

| Capability | Verdict | Reasoning |
|---|---|---|
| Worker orchestration — single worker, single message | **Core Runtime** | Basic operation (§2.1); must work with zero connectivity |
| Worker orchestration — cross-worker delegation/collaboration | **Teracom-controlled** | Sophisticated, differentiating logic (per [[digital-workforce-platform-v1]] §9); no offline-necessity argument for it |
| Worker Recommendation Engine | **Teracom-controlled** | Advisory only — safe to be absent per §4's design rule; already placed in §3's table |
| Workforce Creation Engine — forms/wizard tiers | **Core Runtime** | Basic CRUD (existing Package 3); must always work |
| Workforce Creation Engine — natural-language interpretation | **Teracom-controlled** | The NL tier of [[ux-vision]]'s own Natural-Language-First hierarchy turns out to be exactly the interpretive-intelligence boundary this architecture protects; falls back to the wizard/form tier when unreachable |
| Marketplace — first-party template discovery/curation | **Teracom-controlled** | Curation judgment, not required for offline function |
| Marketplace — third-party/partner marketplace | **Teracom-controlled, structurally** | Not a policy choice — live transaction and revenue-share mediation cannot exist without connectivity at all; this one is Teracom-controlled by physics, not by design preference |
| Industry Workforce Packs — curation authority | **Teracom-controlled** | Judgment of which personas suit which industries |
| Industry Workforce Packs — delivered content | **Core Runtime**, via delivered update (§3.1) | Must be present locally to function, same as the base catalogue (§2) |
| Advanced memory services — extraction/summarisation algorithm | **Teracom-controlled** (optional) | Legitimate algorithmic enhancement over today's 7-trigger-phrase heuristic |
| Advanced memory services — the memory data itself | **Core Runtime, always** | Customer-owned (§0); must never become dependent on leaving the customer's environment to function — see §3.3 |
| Knowledge enrichment — enrichment model/algorithm | **Teracom-controlled** (optional) | Legitimate enhancement over local embedding/chunking |
| Knowledge enrichment — the knowledge content itself | **Core Runtime, always** | Customer-owned (§0); same rule as memory data — see §3.3 |

### 3.3 The data-ownership override

Two rows above (memory, knowledge enrichment) needed a different rule than the rest, and the difference is important enough to name as a standing principle, not just a pair of table entries: **"Teracom-controlled" is a statement about judgment, curation, and algorithms — it is never license to make customer data itself dependent on Teracom's infrastructure to function.** An enrichment or extraction *model* can legitimately be Teracom-hosted IP. The *data* it operates on cannot be required to leave the customer's environment merely to get baseline function, because that would quietly convert "Teracom controls its own IP" into "Teracom requires custody of customer data" — precisely the conflation [[deployment-and-ip-protection-strategy-v1]] §1 warned against. Concretely: Sovereign and Air-Gapped deployments must always retain a fully-functional local fallback (today's simple heuristics) for memory and knowledge processing, never a deliberately crippled one that pressures a customer toward sending their own data to a Teracom-hosted enhancement to get ordinary product function.

This principle has no exception among the capabilities classified in §3.2 — it is the reason "advanced memory services" and "knowledge enrichment" split into two rows each while every other capability in that table did not.

## 4. API boundary specification

All Teracom Cloud Intelligence access from Core Runtime goes through one clearly namespaced boundary, so it is trivial to identify (and, for Air-Gapped, to remove — §8) every call site that crosses it:

- `POST /cloud-intelligence/retrieval/rerank` — optional; falls back to §2.1's local top-*k* result unmodified if unreachable or not present.
- `POST /cloud-intelligence/recommendations/workers` — optional; the Recommendation Engine (once built). Absent response → Core Runtime shows no recommendation, not an error.
- `GET /cloud-intelligence/catalogue/updates` — polled occasionally (or triggered manually by an admin), never on a request's critical path; feeds the delivered-update mechanism (§3.1).
- `POST /licensing/requests`, `GET /licensing/status`, `POST /licensing/upload` — the customer-facing licensing endpoints already specified in [[licensing-service-architecture-v1]] §23.1. Distinguished from the three endpoints above because these are not "enhancements" — they are the licensing lifecycle itself, and their reachability rules differ by sub-model (§7, §8).

**Design rule, decided by this document:** every endpoint under `/cloud-intelligence/*` must be safe to call zero times over a deployment's entire lifetime without any loss of core function — this is the acceptance test for whether something belongs in this namespace at all, versus belonging in Core Runtime.

## 5. Licensing implications

- The signing-key/staff-approval boundary (§3) requires no change from what [[licensing-service-architecture-v1]] already specifies — this document confirms that design is already correctly shaped for Model C and adds no new requirement to it.
- **Local licence validation is Core Runtime, always** (§2) — this is non-negotiable given [[licensing-model-v1]] §8's offline-capability requirement, and is why the public/private key split (§13.2 of the licensing service document) is the mechanism that makes the rest of this architecture's boundary possible at all: without it, licence validation itself would have to be a Cloud Intelligence call, which would violate offline capability outright.
- **Renewal reachability differs by sub-model** — see §7 and §8.

## 6. Sovereign deployment implications

"Sovereign" (ordinary Model C, not the Air-Gapped sub-mode) is assumed to have **intermittent** outbound connectivity — no live Teracom server is required *in the loop at request time* ([[licensing-model-v1]] §8's actual wording), but the deployment is not assumed to be permanently disconnected.

- Core Runtime (§2) functions fully with zero connectivity, as required.
- Teracom Cloud Intelligence (§3) is called opportunistically whenever connectivity exists; its absence never degrades Core Runtime function, only the optional enhancements.
- Licence renewal (within the existing 90-day window, [[licensing-model-v1]] §12) uses the normal `/licensing/requests` API path over whatever intermittent connectivity is available — no new mechanism is required beyond what [[licensing-service-architecture-v1]] already specifies.
- Knowledge connectors (`services/connectors/*`) work normally, since OneDrive/SharePoint/Teams are themselves cloud services reachable over the same intermittent connectivity.

## 7. Air-gapped deployment implications

Air-Gapped is treated, per [[deployment-and-ip-protection-strategy-v1]] §0, as Model C with **zero network connectivity, permanently, for any purpose**. This has four concrete consequences this document specifies as decisions, not open questions:

1. **The Air-Gapped build must not contain Teracom Cloud Intelligence call sites at all**, not merely fail to reach them at runtime. Per [[deployment-and-ip-protection-strategy-v1]] §5 row 5's finding that a runtime flag inside fully-visible code is not real protection, this document decides that Air-Gapped is a **distinct build artifact** with the `/cloud-intelligence/*` client code excluded at packaging time, not a runtime configuration toggle on the same artifact SaaS/Dedicated/Sovereign ship. This requires a build/packaging pipeline capable of producing more than one artifact from one codebase — which does not exist today (no dependency manifest, no containerisation, per [[licensing-service-architecture-v1]] §24.4) and is therefore a concrete new prerequisite this document adds to that document's own §24.5 list.
2. **Cloud-based knowledge connectors (OneDrive, SharePoint, Teams) cannot function in an Air-Gapped build**, because each one is, by definition, a connection to a Microsoft-operated cloud service — a newly surfaced, concrete implication not previously stated in [[commerce-store-architecture-v1]] or any Package 8 (Connectors) documentation. An Air-Gapped deployment's knowledge ingestion is limited to direct file upload (`services/upload_service.py`) — this document decides the connector routers should simply not be registered in an Air-Gapped build, consistent with decision 1's build-time-exclusion principle.
3. **Licence renewal cannot use any network path.** This document decides the renewal workflow for Air-Gapped is: the local deployment exports a renewal request to a file (via the existing `/licensing/requests` logic, but writing to a file instead of POSTing it); the file is carried out by physical media; Teracom's staff approval plane (§3) processes it exactly as any other request; the resulting signed licence file is carried back in via `/licensing/upload` ([[licensing-service-architecture-v1]] §23.1), identically to how any other licence file reaches a Model C deployment. No new licensing data model is required — only an export/import affordance around the existing request/approval pipeline.
4. **Catalogue updates (§3.1) arrive only via the signed upgrade package**, never via `GET /cloud-intelligence/catalogue/updates` — for Air-Gapped, that endpoint's client code is excluded per decision 1, and any catalogue refresh ships bundled into the same signed upgrade artefact as everything else, per [[licensing-model-v1]] §16.

## 8. What this architecture does not solve — restated honestly, not re-litigated

Consistent with [[deployment-and-ip-protection-strategy-v1]] §5–§6, this document does not claim to make the worker catalogue content or the Core Runtime source code technically unreadable inside a Sovereign or Air-Gapped deployment — both remain fully visible to a customer with ordinary access to their own infrastructure, exactly as the prior document found. What this architecture achieves is narrower and real: it ensures that **nothing more sophisticated than what exists today ever becomes visible this way**, by giving every future enhancement a home (Teracom Cloud Intelligence) that is structurally absent from exactly the deployment models where it would otherwise leak.

## 9. Open decisions carried forward

| # | Question | Owner |
|---|---|---|
| 1 | Ratify Air-Gapped as a formally distinct build target (not just a stricter reading of Sovereign) — decision 1 in §7 depends on this | Project owner / [[licensing-compliance-worker]] |
| 2 | Commission the multi-artifact build/packaging pipeline this document's §7 decision 1 requires | [[cto-worker]] / [[it-infrastructure-worker]] |
| 3 | Confirm the file-based renewal export/import affordance (§7 decision 3) as the adopted Air-Gapped renewal mechanism | [[licensing-compliance-worker]] |
| 4 | Sequence when Teracom Cloud Intelligence's first real component (retrieval re-ranking or the Recommendation Engine) gets built, now that its home is architecturally decided | [[project-manager-worker]] |
| 5 | Promote §3.3's data-ownership override from a Model C-specific rule into [[deployment-and-ip-protection-strategy-v1]] itself, since it applies to any future capability in any hosting model, not just Model C | [[project-manager-worker]] |
