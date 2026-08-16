# Deployment and IP Protection Strategy V1

**Status:** Draft V1, 2026-08-16. A synthesis strategy document — it does not implement code, does not modify any existing commercial decision in [[licensing-model-v1]], and introduces exactly one new concept ("Air-Gapped" as a deployment model) that is not yet ratified anywhere. Documentation only.

**Sourcing:** First-hand. In addition to the governing documents below, this document adds direct review of `teracom-ai-backend`'s `services/context_builder.py`, `services/rag_service.py`, `services/ollama_service.py`, and `models/worker.py` — the actual orchestration code that turns a chat message into a model response — specifically to ground the "how sophisticated is the current technical moat, really" question in what the code actually does today, not an assumed level of sophistication.

**Governing documents reviewed:** [[licensing-model-v1]] (the three ratified hosting models — SaaS/Teracom Hosted, Dedicated Hosted, Customer Hosted/Sovereign), [[licensing-service-architecture-v1]] (signing-key custody, hardware fingerprinting, offline validation — directly load-bearing for this document's central recommendation), [[digital-workforce-platform-v1]] (the worker catalogue, recommendation engine, industry packs, marketplace — the platform's actual differentiation candidates), [[foundation-workforce-catalogue-v2]] (the 11 persona definitions themselves), [[customer-bootstrap-architecture-v1]] (the appliance/deployment delivery model).

Per [[documentation-standards]] §2: **DECIDED** (ratified, cited by section), **BUILT** (verified first-hand today), **OPEN** (unresolved, existing or newly identified), **PROPOSED** (this document's own strategic recommendation, for review).

---

## 0. Terminology: four deployment models, one of them new

**DECIDED ([[licensing-model-v1]] §3):** three hosting models are ratified — **Teracom Hosted** (multi-tenant, Teracom-operated — what this document calls "SaaS," the same thing under a more common industry name), **Dedicated Hosted** (single-tenant, still Teracom-operated), and **Customer Hosted (Sovereign)** (the customer's own infrastructure, no live Teracom server in the loop at request time).

**OPEN, new to this document:** "Air-Gapped" is not one of the three ratified hosting models. This document treats it as a **strictly stricter sub-mode of Sovereign**, not a fourth independent axis: everything [[licensing-model-v1]] §3 says about Customer Hosted (Sovereign) applies, *plus* the additional constraint that the deployment has **no network connectivity at any time**, for any purpose — not just "no live Teracom server at request-validation time" (already required for ordinary Sovereign per §8's offline-capability requirement), but no connectivity at all, including for licence delivery and renewal, which must therefore happen via physical/out-of-band media transfer rather than any network call whatsoever. **This document does not ratify Air-Gapped as a formally distinct hosting model** — it uses the term because the task that produced this document did, and because the distinction (occasional connectivity permitted vs. never) turns out to matter for §7's licensing-renewal analysis below. Formal ratification, if wanted, is a [[licensing-compliance-worker]]/project-owner decision, flagged in §11.

## 1. What "Crown Jewel" means here — a framework, not just a list

Before naming specific assets, this document distinguishes four different *kinds* of thing a "crown jewel" question can be asking about, because they are protected by different mechanisms and fail in different ways if protection lapses:

1. **Technical IP** — source code, algorithms, prompt/context construction logic. Protected (if at all) by code control: not shipping it, obfuscating it, or keeping it server-side.
2. **Content IP** — the worker persona catalogue, instructions templates, industry-pack curation. Protected by copyright/trade secret law and by *not exposing the raw content* where avoidable — but, as §5 shows, this is much harder to protect than code once it ships anywhere.
3. **Commercial/relationship IP** — the licensing mechanism itself, the customer relationship, brand, pricing model. Protected by contract, by the signing-key custody design already in [[licensing-service-architecture-v1]], and by law (trademark, breach-of-contract), not by code at all.
4. **Customer data** — a customer's own knowledge base content, chat history, memory, user records. **This is explicitly not Teracom IP** — see §3. Conflating "protect Teracom's IP" with "control customer data" would be a trust and legal problem distinct from, and worse than, the IP question this document is actually answering.

Every asset named in §4–§5 is tagged with which of these four kinds it is, because "which components must remain Teracom-controlled" has a different answer for each kind.

## 2. A finding that reframes the whole question: today's technical moat is thin

**BUILT, confirmed by direct code review, not assumption:** the actual orchestration code that turns a chat message into a response is genuinely simple. `services/context_builder.py` assembles a flat string template (`WORKER / Name / Role / Instructions / KNOWLEDGE / ... / MEMORIES / ...`) with no ranking, weighting, or conditional logic. `services/rag_service.py`'s "RAG" is a single top-*k* Chroma similarity search with no re-ranking, no query rewriting, no hybrid search. `services/ollama_service.py` is an 18-line HTTP POST wrapper around a locally-run, open-source Ollama model (`llama3` by default). None of Ollama, Chroma, or `sentence-transformers` (the embedding model) is Teracom IP — they are open-source dependencies, used, not authored.

**Why this matters for an IP-protection strategy specifically:** it would be a mistake to design a protection strategy around defending sophisticated proprietary algorithms that do not currently exist. Today's actual crown jewels are concentrated in **content** (the persona catalogue) and **commercial mechanism** (licensing), not in defensible technical sophistication — and any future technical sophistication (a real recommendation engine, cross-customer learning, advanced retrieval) is exactly the kind of thing §8's architectural recommendation is built to protect *before* it exists, rather than after.

## 3. Customer-owned components

Regardless of hosting model, the following are the customer's own property, not Teracom's, and this document explicitly does not propose treating them otherwise:

- **Knowledge base content** — every document a customer uploads (`knowledge.content`, per [[frontend-architecture]] §B) is their own business information.
- **Memory content** — auto-captured or manually entered facts about *their* operations (`worker_memories.memory_content`).
- **Chat history** — the actual conversations between their users and their workers.
- **User/organisation records** — names, emails, org structure.
- **Any custom worker configuration** — a customer-authored `name`/`purpose`/`instructions` combination for a fully custom worker (per [[digital-workforce-platform-v1]] §6) is their own configuration choice, built on Teracom's platform but not Teracom's content.
- **The physical/virtual infrastructure**, for Dedicated Hosted, Sovereign, and Air-Gapped specifically — Teracom does not own the hardware in these models by definition.

## 4. Teracom-owned components

- **The application source code** (technical IP) — every `.py` file in `teracom-ai-backend` and `teracom-ai-frontend`.
- **The 11-persona worker catalogue's curated content** (content IP) — the `Purpose`/`Responsibilities`/proposed `instructions` template text in [[foundation-workforce-catalogue-v2]], the product of deliberate curation, not a mechanical default.
- **Industry Workforce Packs and any future Recommendation Engine logic** (content IP, once built — [[digital-workforce-platform-v1]] §4/§14) — the curation judgment of *which* personas suit *which* industries.
- **The licence signing private key and issuance authority** (commercial/relationship IP) — per [[licensing-service-architecture-v1]] §13.2/§22.1, this must never leave Teracom's custody under any hosting model, including Air-Gapped.
- **The `staff_users` approval plane and audit log** (commercial/relationship IP) — [[licensing-service-architecture-v1]] §11.1/§21, Teracom-internal by design.
- **The commerce/enrichment pipeline logic**, to the extent it is ever built ([[commerce-store-architecture-v1]] §4–§7) — the category-mapping and markup rules are Teracom's business logic, distinct from any supplier's raw feed data.
- **Brand, trademarks, and the commercial relationship itself** — not code at all, protected by conventional legal means.

## 5. Crown-jewel intellectual property, ranked by actual protectability

This is the core answer to "which components must remain Teracom-controlled if the goal is to maximise IP protection" — ranked not by importance alone, but by **how protectable each one actually is** once a deployment leaves Teracom's own infrastructure, since that is where the real strategic tension in this task lives.

| # | Asset | Kind | Protectable in SaaS/Dedicated? | Protectable in Sovereign/Air-Gapped? |
|---|---|---|---|---|
| 1 | Licence signing private key + issuance service | Commercial | Yes — never leaves Teracom | **Yes, unconditionally** — the one asset that structurally never ships anywhere, in any model (§7) |
| 2 | `staff_users` approval plane, audit log | Commercial | Yes — Teracom-side only | Yes — same reasoning as #1; never part of any customer deployment |
| 3 | Future advanced retrieval/ranking/recommendation logic, if kept server-side | Technical | Yes, if architected that way (§8) | **No, if it must run inside the deployment** — this is the central trade-off §8 addresses |
| 4 | Worker catalogue content (`instructions` templates, industry packs) | Content | Weakly — visible to Teracom's own ops staff and, for Dedicated Hosted, potentially to a customer with infra access | **No** — ships as plain text in a `String(5000)` database column (`models/worker.py`, confirmed first-hand) inside the customer's own database; any customer with ordinary database access in a Sovereign/Air-Gapped deployment can read every word of it |
| 5 | Application source code (today's thin orchestration layer, §2) | Technical | Weakly — Teracom operates the server, but the code still exists as plain, unobfuscated `.py` files | **No** — a Sovereign/Air-Gapped customer receives and runs this code directly; there is currently no compilation, bytecode, or obfuscation step anywhere in this repository or its deployment story |
| 6 | Brand, customer relationship, contract terms | Commercial | Yes | Yes — legal protection is hosting-model-independent by nature |

**The honest conclusion this ranking forces:** rows 4 and 5 — exactly the two rows [[licensing-model-v1]] §16's "appliance, not files" framing was meant to protect — are **not actually protectable by technical means today** in a Sovereign or Air-Gapped deployment, because (a) there is no code-obfuscation/compilation step in this codebase's current build story (confirmed by direct review; `create_tables.py`/`main.py`/every service file ships as readable Python), and (b) persona content is stored as plain database text, not compiled into the application at all. Rows 1, 2, and 6 are genuinely, structurally protectable regardless of hosting model. Row 3 is protectable **only if** future sophistication is deliberately architected to stay server-side — which is exactly what §8 recommends, and exactly what is *not yet at risk*, since it doesn't exist yet (§2).

## 6. Visibility matrix — what a customer can see, by deployment model

| Component | SaaS (Teracom Hosted) | Dedicated Hosted | Sovereign Hosted | Air-Gapped |
|---|---|---|---|---|
| Application source code | Not visible (Teracom-operated) | Not visible in principle; visible if the customer has infra-level access to Teracom-operated hardware, which Dedicated's single-tenancy makes more plausible than SaaS's multi-tenancy | **Fully visible** — the customer runs it | **Fully visible** — same as Sovereign |
| Worker catalogue / `instructions` content | Not visible (Teracom's DB) | Same caveat as above | **Fully visible** in the customer's own database | **Fully visible** |
| Customer's own data (§3) | Teracom-operated storage, customer-owned content | Same | Customer's own storage | Customer's own storage |
| Licence signing private key | Never present | Never present | Never present — only the *public* key is embedded (§7) | Never present |
| Future server-side-only sophistication (§5 row 3, if built per §8) | Present, reachable | Present, reachable | **Absent, not degraded** — simply not shipped | **Absent, not degraded** |

The last row is this document's central architectural recommendation, expanded in §8.

## 7. Licensing architecture impact

**DECIDED, and the one unconditional answer to this task's "which components must remain Teracom-controlled" question:** the licence signing private key. [[licensing-service-architecture-v1]] §13.2 already establishes, as a direct finding (not a stylistic recommendation), that the existing symmetric HS256 session-JWT scheme cannot be reused for licence signing precisely *because* a Sovereign deployment must verify a licence without Teracom in the loop — the fix (§22.1) is that Teracom holds the private key and every deployment, including Air-Gapped ones, ships only the public key. This document adds nothing new to that design; it confirms that this is already the correct, and only structurally sound, answer to "what must never leave Teracom" for the licensing layer, and that it already accounts for Air-Gapped correctly (a public key needs no network access to verify a signature).

**OPEN, newly surfaced by the Air-Gapped distinction (§0):** [[licensing-service-architecture-v1]] §12 step 7 already flagged licence *delivery* mechanism as open for ordinary Sovereign. For Air-Gapped specifically, this document notes that **renewal (§15 of that document) cannot use any network-based delivery path at all** — not even an occasional check-in — so the renewal request → approval → signed-file-delivery cycle must be designed to work entirely over physical media (a customer exports a renewal request to a file, carries it out, Teracom's staff approve and generate a new signed licence file, the customer carries it back in). This is a workflow-shape question the existing Licensing Service architecture does not yet address, since it was written against ordinary Sovereign's "no live server at request time" constraint, not Air-Gapped's stricter "no network, ever" constraint. Flagged to [[licensing-compliance-worker]] as a required addition if Air-Gapped is formally adopted.

**DECIDED, restated because it directly bears on hardware-fingerprint protection ([[licensing-service-architecture-v1]] §9):** hardware binding exists specifically so that even though the *code* is fully visible to a Sovereign/Air-Gapped customer (§5, §6), the *licence* cannot simply be copied onto a second, unauthorized deployment. This is the mechanism that protects the **commercial** relationship (how many deployments a customer is entitled to run) even though it does nothing to protect the **technical/content** IP (§5 rows 4–5) once a legitimate deployment exists. These are two different protection problems and this document does not conflate them.

## 8. Deployment architecture impact — the central recommendation

**PROPOSED, for review, not yet a decision:** given §5's ranking, this document recommends a deliberate **two-layer architecture**, not a single codebase shipped identically everywhere:

1. **Core Runtime** — the layer that ships to every deployment, including Sovereign and Air-Gapped: worker CRUD, chat, the current (thin, per §2) retrieval/context-assembly logic, knowledge/memory storage, administration. This is exactly what exists today. Its IP exposure in Sovereign/Air-Gapped (§5 rows 4–5) is **accepted as a residual risk**, not solved — this document does not propose retrofitting obfuscation onto today's simple orchestration layer, since (per §2) there is not yet much sophistication there worth obfuscating, and obfuscating trivial code for its own sake adds engineering cost without a proportionate protection benefit.
2. **Teracom Cloud Intelligence** (proposed name, not a commitment) — any *future* sophistication that would meaningfully differentiate the product (real ranking/re-ranking, a model-driven Recommendation Engine per [[digital-workforce-platform-v1]] §4, cross-customer pattern learning, advanced industry-pack curation logic) is architected from the start as a **Teracom-operated service**, reachable only from SaaS and Dedicated Hosted deployments over a network call, and **simply absent** — not present-but-disabled, not shipped-but-locked — from Sovereign and Air-Gapped builds. A Sovereign/Air-Gapped customer gets a capable, functional product (the Core Runtime), just not the most advanced layer, by design, not by a licence flag that could be bypassed once the code is already on their machine (§5 row 5's finding is precisely why a flag/lock inside shipped code is not a real protection).

**Why this is the right cut, given §5's ranking:** it draws the boundary exactly where technical protection is still *possible* (server-side-only, network-gated) and gives up gracefully where it structurally is not (code and content that must run on customer-controlled hardware to satisfy the offline-capability requirement, [[licensing-model-v1]] §8). It also means Air-Gapped's total lack of connectivity (§0) is not a special case requiring extra protection engineering — it simply never has access to Teracom Cloud Intelligence at all, the same as Sovereign, consistently.

**OPEN:** whether any *current* capability should be retroactively moved into "Teracom Cloud Intelligence" (e.g., a future improved `context_builder.py`) — this document takes no position; that is a product-roadmap sequencing question for [[cto-worker]] and [[project-manager-worker]], not an IP-protection question this document is positioned to answer unilaterally.

## 9. Open decisions (consolidated)

| # | Question | Section | Owner |
|---|---|---|---|
| 1 | Should "Air-Gapped" be formally ratified as a distinct hosting (sub-)model in [[licensing-model-v1]], or remain an informal stricter reading of Sovereign? | 0 | [[licensing-compliance-worker]] / project owner |
| 2 | What is the physical-media renewal workflow for Air-Gapped deployments? | 7 | [[licensing-compliance-worker]] |
| 3 | Is the two-layer (Core Runtime / Teracom Cloud Intelligence) architecture adopted as a forward design principle? | 8 | [[cto-worker]] / project owner |
| 4 | Should any current capability be retroactively classified as Cloud-Intelligence-only? | 8 | [[cto-worker]] |
| 5 | Is code obfuscation/compilation for the Core Runtime worth the engineering cost given today's thin technical moat (§2), or only worth revisiting once real sophistication exists? | 2, 5 | [[cto-worker]] |

## 10. Recommendations

1. **Do not conflate "protect Teracom's IP" with "control customer data"** (§3) in any customer-facing or contractual material — the two are structurally different and confusing them is a trust risk, not an IP-protection strategy.
2. **Treat the signing-key custody design already in [[licensing-service-architecture-v1]] as complete and correct** for "what must remain Teracom-controlled" at the licensing layer — this document found no gap in that design, only a follow-on workflow question for Air-Gapped renewal specifically (§7, Open Decision #2).
3. **Adopt the two-layer architecture (§8) before building the next piece of genuine technical sophistication** (the Recommendation Engine, advanced retrieval) — retrofitting a network boundary after such a feature is already built and shipped into every deployment is far more expensive than designing it in from the start.
4. **Do not overinvest in obfuscating today's Core Runtime** — §2's finding that current orchestration logic is genuinely simple means the marginal protection value of obfuscating it is low; effort is better spent on §8's architectural boundary for *future* capability than on hardening what exists today.
5. **Flag the Air-Gapped renewal workflow gap (§7) to [[licensing-compliance-worker]] explicitly** if Air-Gapped deployments are actually being sold or planned — this is a real operational gap, not a theoretical one, the moment a customer with zero network connectivity needs a licence renewed.
