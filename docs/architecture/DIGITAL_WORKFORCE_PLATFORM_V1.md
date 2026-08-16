# Digital Workforce Platform Architecture V1

**Status:** Draft V1, 2026-08-16. A synthesis architecture document — it does not introduce new commercial or technical decisions of its own weight, but combines five already-reviewed documents plus first-hand repository review into one coherent answer to a single question:

> **How does a customer go from zero workers to a fully operational digital workforce?**

**Sourcing:** First-hand for every repository claim below — `teracom-ai-backend`'s `api/organisations.py`, `api/auth.py`, and `api/users.py` were read directly while writing this document (see §18 for why this mattered more than expected), in addition to the six governing documents named below, each read in full.

**Governing documents reviewed:** [[worker-catalogue]] and [[foundation-workforce-catalogue-v2]] (the 11 worker personas and their operating model), [[ux-vision]] (Natural Language First / Wizard Second / Forms Last, ADR-012), [[website-information-architecture-v2]] (corporate structure, navigation, public assistants — mostly PROPOSED, not built), [[licensing-model-v1]] (tiers, hosting models, lifecycle — the commercial source of record), [[licensing-service-architecture-v1]] (the technical design for entitlement/licence issuance — none of it built yet), [[commerce-store-architecture-v1]] (the existing Stripe/Zoho store, confirmed disconnected from the AI product).

Per [[documentation-standards]] §2, this document separates four states, not two — collapsing them would misrepresent how much of the "zero to workforce" journey actually exists today versus how much is drafted or still open:

- **BUILT** — verified first-hand against the repository today, regardless of whether it's the target design.
- **DECIDED** — ratified in an ADR or an approved `docs/commercial/*`/`docs/governance/*` document, cited by section.
- **OPEN** — a question a governing document already states is unresolved, or one this document newly identifies.
- **PROPOSED** — this document's own synthesis: a journey stage, a sequencing choice, a bridge design. A recommendation for review, not a decision.

**New top-level directory note:** `docs/architecture/` did not exist before this document. It was created because this document sits above and across the existing `docs/{frontend,backend,commercial,governance}/` boundaries by design — it is the one place a reader goes to see the whole customer journey rather than one domain's slice of it. Per [[documentation-standards]] §1's caution against inventing directories without clear reason, this is flagged explicitly here and in the accompanying report rather than done silently; the task that produced this document named the path directly.

---

## 1. Vision

**DECIDED (ADR-012, [[ux-vision]]):** new screen and interaction design follows Natural Language First → Wizard Second → Forms Last.

**DECIDED ([[website-information-architecture-v2]] §6, itself PROPOSED-not-ratified but restated here as the clearest available statement of intent):** the platform's guiding statement is "Build Your Digital Workforce" — the product's core unit is a Worker persona, not a database row ([[ux-vision]] §1).

**PROPOSED — this document's synthesis of what "vision" means for the zero-to-workforce journey specifically:** a customer should be able to describe a business need in plain language, be matched to relevant Worker personas (templates, industry packs), have them provisioned with sensible default knowledge/permissions, and reach a working chat interaction — with wizards and forms as the fallback at each step where natural-language provisioning isn't yet possible, exactly mirroring [[ux-vision]]'s own three-tier evaluation order applied specifically to *workforce creation* rather than to individual screens in isolation. Sections 2–6 below are this vision applied stage by stage.

**OPEN:** whether this vision is itself something that needs project-owner ratification as a named artifact (a "Digital Workforce Platform vision"), or whether it remains an implicit synthesis of already-approved pieces. Flagged to [[project-manager-worker]].

---

## 2. Workforce Creation Journey

**BUILT (Package 3, [[frontend-architecture]] §C.2, confirmed via [[worker-catalogue]]):** today's only workforce-creation path is a single dense form — `/portal/workers/new` — collecting `name`, `role`, `purpose`, `instructions`, `status`, followed by a separate knowledge-assignment step (`WorkerKnowledgeAssignment`). This is a Forms-Last-tier interaction built *before* [[ux-vision]] was approved (ADR-012 postdates Packages 1–7) — [[ux-vision]] itself states it does not retroactively re-scope shipped packages.

**PROPOSED journey, in stages, mapping today's reality to the target:**

| Stage | Today (BUILT) | Target (PROPOSED) |
|---|---|---|
| 1. Discover what worker to create | Nothing — customer must already know what persona they want | Recommendation Engine (§4) suggests personas from org profile/industry |
| 2. Configure the worker | Blank form, all fields free-text | Template (§5) pre-fills `role`/`purpose`/`instructions`; custom path (§6) remains available |
| 3. Assign knowledge | Manual, per-worker, post-creation | Unchanged in this document's proposal — already a reasonable wizard-tier step |
| 4. First interaction | Customer manually navigates to `/portal/chat` | Proposed: creation flow ends with a "try it now" handoff straight into a chat session with the new worker |

**OPEN:** none of the target-column items in stages 1, 2, or 4 exist. This document does not propose an implementation order in isolation — see §20 for how this fits the platform maturity sequence.

---

## 3. Natural Language Workforce Creation

**DECIDED ([[ux-vision]] §1):** natural language is the preferred tier when the backend can act on free-form intent.

**BUILT / OPEN, the hard blocker ([[ux-vision]] §2, verbatim, confirmed still true by this document's own review — no new chat capability has shipped since):** "chat is currently synchronous, informational Q&A only, with no verified function-calling/tool-use/action-taking mechanism." A customer cannot today type "create a cybersecurity worker for my team" into any chat surface and have a worker actually created — there is no backend path from a chat message to a `POST /workers/` call.

**PROPOSED, for review, not a resolution of the blocker above:** natural-language workforce creation requires the backend to expose a tool-use/function-calling layer where "create worker," "assign knowledge," and "start chat with worker" are callable actions the Ollama-backed chat loop can invoke, mediated through the standard chat session ([[frontend-architecture]] §C.9) rather than a new endpoint family. This is a backend capability this document does not design in detail — it is named here because every later PROPOSED stage that says "eventually natural-language" (recommendation delivery, industry-pack activation, marketplace browsing) depends on this same, single, currently-missing capability. Building it once unblocks all of them; this document flags it as the one shared dependency rather than re-deriving it per section.

**OPEN:** whether this is prioritised ahead of or alongside the Licensing Service's own backend prerequisites ([[licensing-service-architecture-v1]] §24.5) — both are backend-capability investments with no shipped code yet; sequencing them is a [[project-manager-worker]]/[[cto-worker]] call, not decided here.

---

## 4. Worker Recommendation Engine

**OPEN — entirely new territory; no reviewed document proposes this today.** Nothing in [[worker-catalogue]], [[foundation-workforce-catalogue-v2]], or any roadmap package describes matching a customer to relevant worker personas.

**PROPOSED, for review:** a recommendation surfaces a ranked subset of the 11 catalogue personas ([[foundation-workforce-catalogue-v2]]) based on signals available at or shortly after signup — industry (if the Industries taxonomy in [[website-information-architecture-v2]] §3 is ever collected at signup, itself PROPOSED-only today), organisation size (mapped loosely to tier, §8), and — once available — any knowledge documents uploaded before a single worker exists (a customer uploading, say, network-diagram PDFs before creating any worker is itself a strong signal, though today's knowledge-upload flow requires an existing worker to attach to, per [[frontend-architecture]] §C.10 — a sequencing conflict this document flags but does not resolve). A recommendation is a **suggestion**, never an automatic creation — worker creation remains a human-approved, explicit action even when recommended, consistent with the general principle (echoed from [[licensing-model-v1]] §9's human-approval principle, applied here to workforce composition rather than licensing) that the platform proposes, the customer decides.

**OPEN:** whether recommendations are rule-based (industry → fixed persona list, matching Industry Workforce Packs, §14) or model-driven (an LLM call reasoning over the customer's own early knowledge uploads) — the former is buildable today with zero new backend capability beyond a static mapping table; the latter depends on the same tool-use/action-taking gap named in §3. **This document recommends starting rule-based** (Industry Workforce Packs, §14, are exactly this mapping, already needed for a different reason) and treating model-driven refinement as a later maturity stage (§20), not a prerequisite to shipping any recommendation at all.

---

## 5. Worker Templates

**OPEN ([[worker-catalogue]] §Open questions, verbatim, carried forward unresolved):** "Is there a default/recommended `instructions` template per worker type, or is every customer expected to author their own from a blank persona? Not decided."

**BUILT:** none of the 11 catalogue personas has a seeded `instructions` template anywhere — the `workers` table has zero rows for any customer today ([[worker-catalogue]] confirms the catalogue is "not yet 11 rows seeded in any database"), so there is no reference implementation to draw a template from even informally.

**PROPOSED, for review:** each of the 11 [[foundation-workforce-catalogue-v2]] entries' **Purpose** and **Responsibilities** fields become the seed content for that persona's default `instructions` template — the catalogue document already contains the raw material this needs, it has simply never been transcribed into a seedable format. A template pre-fills the Package 3 creation form's `role`/`purpose`/`instructions` fields (§2 stage 2); the customer can edit any field before saving, so a template is a starting point, never a constraint on what `workers` rows can actually contain (the table itself imposes no such constraint, per [[worker-catalogue]]).

**OPEN:** whether templates are versioned (so an existing worker created from Template v1 isn't silently altered when Template v2 ships) — not addressed anywhere; this document recommends templates be a creation-time convenience only, never retroactively applied, to avoid an unexpected change to a customer's already-configured worker persona.

---

## 6. Custom Workers

**BUILT, and — notably — the one part of this entire journey that is fully operational today:** Package 3's worker creation form imposes no constraint tying a new worker to the 11-persona catalogue. A customer can set any `name`/`role`/`purpose`/`instructions` combination today, and it works exactly as well as a catalogue-aligned one, since the backend has no notion of "catalogue" at all — it is purely a frontend/commercial concept layered on top of an unconstrained table ([[worker-catalogue]] §Open questions, restated).

**OPEN ([[worker-catalogue]], verbatim):** "Can a customer create custom worker types outside this catalogue of 11, or is the catalogue meant to be the exhaustive set the product supports?" **This document's answer, for review, not a ratification:** yes — custom workers should remain fully supported regardless of how §4/§5 develop, because (a) it is already built and removing it would be a regression, and (b) the catalogue's own purpose (per [[foundation-workforce-catalogue-v2]] §12) is to give a *starting point*, not to gate what the platform allows a paying customer to configure for their own use.

---

## 7. Workforce Governance

**BUILT (Package 7, Administration):** organisation-scoped user/role/permission management exists, gated by a role-checking `layout.js` at the frontend (presentation-only, per ADR-006) backed by the real `require_role()` dependency at the backend (per [[foundation-workforce-catalogue-v2]] §2's citation of `auth/roles.py`). Knowledge access is scoped per-worker via `knowledge_permissions` ([[worker-catalogue]] §What a Worker is, technically).

**OPEN, carried from prior session findings, restated here because it is a governance-relevant gap, not fixed by this document:** the RSC flight-payload information exposure found during Package 9 (a non-admin's raw response briefly contained real organisation data for admin-only pages before the visible render suppressed it) was fixed on three Package 9 pages but flagged as "likely also affecting Package 7's pre-existing admin pages... not fixed there, explicitly out of scope for Package 9" (per that package's own implementation report). This document does not fix it either — it restates the flag so a Digital Workforce Platform governance review doesn't lose track of a real, previously-found gap.

**PROPOSED — governance scope specific to a growing workforce, not addressed by Package 7 alone:** as an organisation's worker count grows toward its tier limit (§8), governance needs a "who can create/deactivate a worker" question answered explicitly — today, Package 3's worker CRUD does not appear to be role-gated as tightly as user administration is (worth a direct verification pass by [[qa-worker]] before this document's assumption is treated as fact — flagged as OPEN, not asserted as BUILT, since this document did not re-review Package 3's role-gating code line by line).

---

## 8. Workforce Licensing

Full detail lives in [[licensing-model-v1]] (commercial) and [[licensing-service-architecture-v1]] (technical design) — not duplicated here per [[documentation-standards]] §6. Summary as it bears on the zero-to-workforce journey specifically:

**DECIDED:** worker limits are 5 (Starter) / 30 (Enterprise) / 50 (Platinum), plus optional +5/+10 packs ([[licensing-model-v1]] §2, §7). Worker creation is *policy*-blocked immediately at the limit.

**BUILT — the single most consequential fact for this whole document:** **zero enforcement exists.** [[licensing-service-architecture-v1]] §5 confirms `POST /workers/` (Package 3, already shipped) has no limit check of any kind. A brand-new customer today, however they came to have an account (§18), can create an unbounded number of workers regardless of tier. This means the "zero to fully operational digital workforce" journey today has **no licensing gate at all** — which is simultaneously why nothing currently blocks a customer from over-provisioning, and why nothing currently proves the tier structure means anything in practice.

**OPEN:** everything [[licensing-service-architecture-v1]] §24.5 already lists as a prerequisite (migration framework, signing algorithm ratification, `staff_users` plane, data-export endpoint) blocks licensing from becoming a *real* gate on this journey, not just a documented policy.

---

## 9. Worker-to-Worker Collaboration

**OPEN — entirely new territory, not addressed in any reviewed document.** Every existing chat session ([[frontend-architecture]] §C.9) is a single customer talking to a single worker; there is no mechanism for one worker to consult, delegate to, or hand off to another worker within the same organisation.

**PROPOSED, for review:** collaboration depends on the same tool-use/action-taking backend layer named in §3 — a worker persona invoking "ask the CTO Worker for a second opinion" is architecturally identical to a customer invoking "create a worker," both being a chat-driven call into a new action layer rather than a fresh subsystem. This document does not propose worker-to-worker collaboration as a near-term build — it is named here specifically so it is evaluated as a *consequence* of building §3's action layer once, rather than commissioned as a separate project that reinvents the same dependency.

**OPEN:** whether worker-to-worker collaboration ever crosses organisation boundaries (e.g. a Teracom Tier 1 Support Worker, [[licensing-model-v1]] §17, consulting a customer's own worker) — this document assumes not, since [[licensing-service-architecture-v1]] §11.1's multi-tenant isolation finding makes any cross-organisation data access a material security question, not a convenience feature.

---

## 10. Memory Architecture

**BUILT (Package 6, verified via [[changelog]]'s dated entry, first-hand against `api/memory.py`, `services/memory_service.py`, `services/auto_memory_service.py`, `models/worker_memory.py`):** memory is **per-worker**, not per-organisation — there is no org-wide memory endpoint. `memory_type` is always `"fact"` in practice (no other value is ever produced by the store path). Auto-capture triggers on exactly 7 fixed substring phrases and stores the **entire raw chat message**, not an extracted fact, despite the field name. There is no update or delete endpoint for a memory at all — once captured, a memory is permanent and unModifiable via the API.

**PROPOSED, for the zero-to-workforce journey specifically:** as a customer's workforce grows from one worker to many (§2, §7), memory's per-worker isolation means each new worker starts with **zero shared context** even about facts another of the customer's own workers already learned — there is no cross-worker memory query today. This document flags this as a natural next question for the platform (should a Network Engineering Worker and an IT Infrastructure Worker share organisational context, given [[foundation-workforce-catalogue-v2]] §6/§7 already describe them coordinating?) rather than proposing a specific cross-worker memory design — that is a substantial architecture question of its own, out of this document's scope to resolve in passing.

**OPEN:** whether the "entire raw message stored as a fact" behaviour is a known, accepted simplification or an undocumented gap — this document restates the Package 6 finding rather than re-deciding it, since [[qa-worker]]'s role (per [[foundation-workforce-catalogue-v2]] §4) is the appropriate place to confirm whether this was ever explicitly signed off.

---

## 11. Organisation Workforce Model

**DECIDED ([[licensing-model-v1]] §6):** organisation limits are 1 (Starter) / up to 5 (Enterprise) / up to 30 (Platinum).

**OPEN — the same unresolved cardinality question already raised in [[licensing-service-architecture-v1]] §4.1/§8, restated here because it directly determines what "an organisation's workforce" even means for Enterprise/Platinum:** does a tier's "up to N organisations" mean **one shared worker pool** across all N (so the tier's 30-worker Enterprise limit is shared across up to 5 organisations), or **per-organisation allocation** (each of the up to 5 gets its own slice)? This document does not re-litigate the question — it notes that the answer directly shapes §2's creation journey for any customer past Starter tier: a shared-pool answer means workforce planning happens once at the top level; a per-organisation answer means each sub-organisation runs its own independent zero-to-workforce journey, sequenced and governed separately (§7).

---

## 12. Department Workforce Model

**OPEN — no reviewed document mentions "department" as a concept at all.** The backend has exactly one grouping mechanism above an individual `user`/`worker` row: `organisation_id`. There is no department, team, or sub-organisation table anywhere in `teracom-ai-backend`'s models.

**PROPOSED, for review:** this document suspects "department workforce model" and §11's organisation-cardinality question are, practically, **the same open question wearing two names** — if Enterprise/Platinum's "up to 5/30 organisations" resolves to per-organisation allocation, then a customer's own internal departments most likely map onto that same `organisations` structure (e.g. an Enterprise customer's "Sales" and "Support" departments each provisioned as their own `organisations` row under one subscription), rather than requiring an entirely separate department-modelling layer. **This document does not propose building a distinct department concept** unless §11 resolves in a direction that leaves department-level grouping unaddressed — flagged to [[cto-worker]] to confirm or reject this reading before any schema work assumes it.

---

## 13. Marketplace Strategy

**OPEN — no reviewed document proposes a marketplace today.** [[commerce-store-architecture-v1]] documents the existing `/store` — hardware, services, digital products, and two SecurityOS AI subscription SKUs, sold via Stripe Checkout — which is confirmed, first-hand, to be entirely disconnected from worker/template/persona concepts of any kind.

**PROPOSED, for review — two distinct marketplace ideas should not be conflated:**

1. **A worker-template marketplace** (browse/preview/activate a persona template, §5, possibly beyond the base 11) — this is a **portal-native** concept, naturally living alongside worker creation (§2), not the existing hardware/services store.
2. **Third-party or partner-contributed workers** — a materially bigger idea (content moderation, revenue share, a partner/MSP model) that overlaps directly with [[licensing-model-v1]] §18's own **undecided** Partner/MSP model (that document states plainly: "No approved decisions were supplied for this heading"). This document does not propose resolving §18 — it flags that any marketplace strategy involving third-party contributors is blocked on the same open partner/MSP question, not a separate one.

**OPEN:** whether idea 1 above (a first-party template marketplace) should be sequenced before idea 2 (third-party) — this document recommends yes, since idea 1 requires no new commercial model at all (it's a discovery/activation UI over the existing 11-persona catalogue, §5), while idea 2 requires §18's partner model to exist first.

---

## 14. Industry Workforce Packs

**OPEN — [[website-information-architecture-v2]] §3 lists an Industries taxonomy (Critical Infrastructure, Small Business, Professional Services, Construction, Manufacturing, Education, Healthcare, Retail, Government) as PROPOSED only, with no corresponding built page or product concept.**

**PROPOSED, for review, tying §3's taxonomy to §4's recommendation engine and §5's templates directly:** an "Industry Workforce Pack" is a named, curated bundle of catalogue personas plus suggested default knowledge-source types, keyed to one Industries-taxonomy entry — e.g. a "Critical Infrastructure" pack might suggest the Cybersecurity Specialist, Network Engineering, and IT Infrastructure Workers together, given [[foundation-workforce-catalogue-v2]]'s own descriptions of that trio's natural collaboration (§5/§6/§7 of that document). This is the concrete, buildable form of §4's "rule-based recommendation" starting point — this document recommends treating Industry Workforce Packs as the *mechanism*, and the Recommendation Engine (§4) as the *delivery* of that mechanism at signup/early-onboarding time, rather than two separate initiatives.

**OPEN:** none of this depends on resolving §13's marketplace/partner questions — an Industry Workforce Pack built from the existing 11 first-party personas requires no new commercial model, only a static mapping table and the template content from §5. This document flags it as buildable independent of §13, not blocked by it.

---

## 15. Commerce Store Integration

Full detail in [[commerce-store-architecture-v1]] — not duplicated here. As it bears on this document's central question:

**BUILT, and the second-most consequential fact in this document after §8's licensing-enforcement gap:** the commerce store and the Teracom AI product are, today, **two completely disconnected systems** ([[frontend-architecture]], cited directly in [[commerce-store-architecture-v1]] §10). A customer can buy a "SecurityOS AI Starter" subscription SKU via `/store` right now, pay Stripe, receive a Zoho invoice — and this has **zero effect** on any `organisations`/`users`/`workers` row anywhere. The purchase and the product are not connected at any point in the current flow.

**PROPOSED (already designed in [[frontend-architecture]]'s Billing/Package 9 section, cited not re-derived):** the checkout flow needs to capture organisation identity, and the Stripe webhook needs to become a provisioning point calling a new backend endpoint — but per this document's own §18 finding, that provisioning call runs headlong into the same admin-role chicken-and-egg problem: creating a brand-new organisation's first admin user has no existing unauthenticated API path (§18). **This document's addition to the existing design:** the webhook-triggered provisioning path (already proposed in [[frontend-architecture]]) is not just a *convenience* bridge to build — it is the **only currently-conceivable bootstrap path** for a self-service new customer, since no other route to a first organisation/admin exists today. This raises its priority relative to how it might have read in isolation.

---

## 16. Website Integration

Full detail in [[website-information-architecture-v2]] — not duplicated here. As it bears on the zero-to-workforce journey:

**BUILT:** the marketing site's only two calls to action relevant to this journey are `Store` and `Portal` in the flat 5-item nav ([[website-information-architecture-v2]] §2). `Portal` leads to `/portal/login` — a login page, not a signup page (§18). There is no marketing-site path that leads a brand-new, never-seen-before visitor to a working account.

**OPEN, restating [[website-information-architecture-v2]] §7's open question #1:** whether the proposed Teracom Solutions/Teracom AI domain split changes where a "start your workforce" call to action would even live. This document does not resolve it — it notes that whichever site ends up owning the marketing funnel, the actual bootstrap mechanics (§18) are the same regardless of which domain serves the button.

---

## 17. AI Assistant Architecture

**OPEN ([[website-information-architecture-v2]] §5, restated):** five "Public AI Assistants" (General, Cybersecurity, Networking, Infrastructure, Commerce) are named as planned, with **no built implementation and no backend concept of an unauthenticated, public assistant** — every existing chat surface is authenticated, organisation-scoped, and tied to a specific customer-created Worker ([[frontend-architecture]] §C.9).

**PROPOSED, for review — this document's reading of the relationship between "Public AI Assistant" and "Worker":** a Public AI Assistant is best understood as a **pre-configured, org-less Worker persona** exposed on the marketing site rather than a structurally different product concept — reusing the same chat mechanism, `instructions`-field persona pattern (§5), and underlying Ollama/Chroma stack, just without an `organisation_id` scope and without persistence of the conversation into any customer's memory (§10). This reading, if adopted, means building the five public assistants is primarily a **product/access-model decision** (does an unauthenticated visitor's session need a lightweight non-organisation-scoped identity?) rather than a new AI/chat subsystem.

**OPEN:** whether a Public AI Assistant is itself a marketing-funnel tool feeding §18's onboarding (e.g. "Commerce Assistant" helping a visitor pick a product, then handing off to signup) — if so, it becomes directly relevant to the zero-to-workforce journey as a top-of-funnel step; if it's purely informational marketing content, it is out of this document's scope. Not decided; flagged to [[marketing-manager-worker]]/[[cto-worker]].

---

## 18. Customer Onboarding Experience

**BUILT — the single most consequential first-hand finding of this entire document, not previously documented anywhere in this knowledge base (confirmed by direct search of [[project-state]] and [[backend-status]] finding no mention):** both `POST /organisations/` and `POST /users/` — the only two backend endpoints capable of creating a new organisation or a new user — require `require_role("admin")` (`api/organisations.py`, `api/users.py`, read directly). **There is no unauthenticated path to create the first organisation and first admin user for a brand-new customer anywhere in the current backend.** Every organisation and user that exists in any environment today was necessarily created by a human with direct database or superuser access (consistent with this session's own prior practice of seeding test accounts via direct Python scripts against Postgres, not through any product-facing flow) — not through a flow a real customer could ever go through themselves.

**This is a structural gap, not a missing screen.** Building a "Sign Up" page on the frontend would not fix it — the backend has no endpoint that page could call. The fix requires a new backend capability: an endpoint that creates an organisation *and* its first admin user together, deliberately outside the `require_role("admin")` gate that (correctly) protects every other organisation/user-creation path, since by definition no admin exists yet for a brand-new customer.

**PROPOSED, for review:** exactly the mechanism [[commerce-store-architecture-v1]] §10 and [[frontend-architecture]]'s Billing/Package 9 section already gesture toward — a Stripe-checkout-triggered provisioning call (§15) — is the **only currently-designed candidate** for this bootstrap path. This document recommends treating "new customer, no account yet" provisioning as its own named, explicitly-scoped backend capability (not folded silently into the billing bridge as a side effect), precisely because it is a security-sensitive exception to an otherwise-correct authorization rule, and deserves its own review by [[cybersecurity-worker]] before being built alongside (not as an afterthought to) the billing work.

**OPEN:** whether this bootstrap endpoint is gated by anything at all (e.g. must the Stripe payment succeed first, preventing anyone from calling it to spray-create empty organisations?) — not decided anywhere in any reviewed document; flagged as a required design question before implementation, not an oversight this document is positioned to resolve unilaterally.

---

## 19. First 30-Day Customer Journey

This section synthesises §2–§18 into a single narrative — **PROPOSED throughout**, since it depends on multiple not-yet-built stages; BUILT/OPEN markers are given per beat so a reader can see exactly how much of "Day 0" is real today.

| Day | Beat | Status |
|---|---|---|
| 0 | Visitor discovers the site, reaches `/store` or a future workforce-focused CTA (§16) | BUILT (site, store) / OPEN (CTA) |
| 0 | Purchases a SecurityOS AI subscription SKU or is otherwise provisioned | BUILT (Stripe checkout) / OPEN (org+admin bootstrap, §18) |
| 0–1 | First login, greeted with a licence status view (once §8's service exists) and — ideally — a Recommendation Engine (§4) suggestion | OPEN (licensing service) / OPEN (recommendation engine) |
| 1–3 | First worker created — from a template (§5), an Industry Pack (§14), or fully custom (§6) | PROPOSED template/pack path / BUILT custom path |
| 1–7 | Knowledge assigned to the new worker(s) | BUILT (Package 4/existing worker-knowledge assignment) |
| 3–10 | First real chat usage; memory begins accumulating per worker (§10) | BUILT |
| 7–14 | Additional workers added, approaching but (today) never actually blocked by tier limits (§8) | BUILT (creation) / OPEN (enforcement) |
| 10–20 | Administration: additional users invited, roles assigned (Package 7, §7) | BUILT |
| 20–30 | First look at Usage & Capacity (illustrative data only today, per [[commerce-store-architecture-v1]]'s companion billing package) | BUILT UI / OPEN real data (§8) |

**The honest summary this table is built to make visible:** roughly the *middle* of this journey (creating a custom worker, assigning knowledge, chatting, basic administration) is solidly BUILT. Both **ends** of the journey — Day 0 bootstrap (§18) and any licensing ceiling ever actually being enforced (§8) — are OPEN. A customer today can reach a fully operational digital workforce only if someone with direct backend access got them an organisation and an admin user in the first place; everything after that point works.

---

## 20. Platform Maturity Roadmap

**PROPOSED, sequencing this document's own findings into stages — not a ratified roadmap, a synthesis for [[project-manager-worker]] to sequence into [[roadmap]] if adopted:**

- **Stage 0 (today):** worker creation (custom only, §6), knowledge assignment, chat, memory, administration are BUILT. No licensing enforcement (§8), no self-service onboarding (§18), no store/product bridge (§15).
- **Stage 1 — close the two structural gaps found in this document:** (a) the org/admin bootstrap endpoint (§18) and its accompanying checkout-triggered provisioning (§15), and (b) [[licensing-service-architecture-v1]] §24.5's prerequisite list (migration framework, signing algorithm, `staff_users` plane, data-export endpoint) so licensing becomes real rather than documentary. **These two are this document's highest-priority recommendation (§22)** — every later stage assumes a customer can actually get in the door and that tier limits mean something.
- **Stage 2 — templates and packs:** seed the 11 catalogue personas as templates (§5), build Industry Workforce Packs (§14) as a static mapping, ship a rule-based Recommendation Engine (§4) using that mapping. No new backend capability class required beyond what Stage 1 already needed.
- **Stage 3 — the action layer:** the tool-use/function-calling backend capability named in §3, unlocking natural-language workforce creation (§3), worker-to-worker collaboration (§9), and model-driven recommendation refinement (§4) — one investment, three payoffs.
- **Stage 4 — marketplace and partner model:** first-party template marketplace (§13 idea 1) can follow Stage 2 directly; third-party/partner marketplace (§13 idea 2) is blocked on [[licensing-model-v1]] §18's undecided Partner/MSP model and should not be scheduled until that's resolved.

---

## 21. Open Decisions (consolidated)

| # | Question | Raised in | Owner |
|---|---|---|---|
| 1 | Is there an unauthenticated bootstrap path for a brand-new organisation + first admin user, and if so, what gates it? | §18 (new finding) | [[cto-worker]] / [[cybersecurity-worker]] |
| 2 | Organisation cardinality for Enterprise/Platinum (shared pool vs. per-organisation) | §11, [[licensing-service-architecture-v1]] §4.1/§8 | Project owner |
| 3 | Does "department" need its own model, or does it map onto §11's organisation cardinality answer? | §12 (new framing) | [[cto-worker]] |
| 4 | Should worker creation gain explicit role-gating verification as workforce size grows? | §7 | [[qa-worker]] |
| 5 | Is a template versioned, and does a template update ever retroactively touch existing workers? | §5 | [[cto-worker]] |
| 6 | Should cross-worker memory sharing exist, given catalogue personas are already described as collaborating? | §10 | [[cto-worker]] |
| 7 | Sequencing: the action-layer investment (§3) vs. the Licensing Service prerequisites (§24.5 of that document) — which comes first? | §3, §20 | [[project-manager-worker]] / [[cto-worker]] |
| 8 | Is a Public AI Assistant a marketing-funnel onboarding step or purely informational content? | §17 | [[marketing-manager-worker]] |
| 9 | Partner/MSP model ratification, blocking third-party marketplace | §13, [[licensing-model-v1]] §18 | Project owner |
| 10 | Should this document itself be ratified via ADR, given it makes several sequencing recommendations? | (whole document) | [[project-manager-worker]] |

---

## 22. Recommendations

In priority order, as this document's own synthesis (PROPOSED, for review):

1. **Fix the Day-0 bootstrap gap (§18) before anything else in this list.** No amount of recommendation-engine, template, or marketplace polish matters if a real customer cannot reach an account without someone's direct database access. This is the one finding in this document that blocks the entire journey at its very first step.
2. **Close [[licensing-service-architecture-v1]] §24.5's prerequisite list** so tier limits (§8) become an enforced fact, not a documented policy with zero code behind it — a customer-facing product that advertises "5 workers on Starter" while enforcing nothing is a credibility risk once anyone outside this knowledge base notices.
3. **Seed the 11 catalogue personas as templates (§5) and build the static Industry-Pack mapping (§14)** — this is the cheapest, most self-contained improvement to the middle of the journey (§2/§19), requiring no new backend capability class, only content work already half-written in [[foundation-workforce-catalogue-v2]].
4. **Invest once in the tool-use/action-taking backend layer (§3)** — it is the shared dependency behind natural-language creation, worker-to-worker collaboration, and model-driven recommendations; building it once and evaluating all three as consequences avoids three separate, redundant efforts.
5. **Defer marketplace/partner work (§13) until [[licensing-model-v1]] §18 is ratified** — building toward an undecided commercial model risks throwaway design work.

This document makes no claim that this order is the only defensible one — it is a synthesis grounded in what's actually built versus open, offered to [[project-manager-worker]] and the project owner as a starting sequencing proposal for [[roadmap]], not a substitute for their decision.
