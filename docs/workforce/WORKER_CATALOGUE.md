# Worker Catalogue

**Status:** Roster of 17 worker types approved by the project owner, 2026-08-15 (9 original + Marketing Manager Worker and Content Production Worker added 2026-08-15), 2026-08-17 (CFO, Head of Sales, Head of Operations, Head of Customer Success Workers added — the recommended Executive/Department Head roster's remaining four; CTO Worker and Marketing Manager Worker already covered "CTO" and "Head of Marketing"), and same-day (Sales Manager Worker, Customer Success Manager Worker added — Phase 0 Package J's operational, "doer" counterparts to the advisory-only Head of Sales/Head of Customer Success Department Head personas). This is the commercial/functional catalogue definition — for the technical mechanism a "worker" runs on, see [[backend-status]] §Domain model. For how workers map to editions/seats, see [[product-editions]]. For the Department Head structural layer six of these roles are recommended for, see [[department-head-layer]] (Phase 0 Package I) — none of the six is auto-created or bootstrapped; an admin creates and assigns each one manually, exactly like any other worker/department in this catalogue.

---

## What a "Worker" is, technically

In `teracom-ai-backend`, a Worker is a row in the `workers` table: `name, role, purpose, instructions, status`, scoped to an `organisation_id`. Practically, a worker is an **AI agent persona** — the `role`/`purpose`/`instructions` fields become system-prompt components for that agent's chat sessions (backed by Ollama + a Chroma-indexed knowledge base scoped via `knowledge_permissions`). A worker is not a human staff record and has no login of its own — humans (the `users` table) interact *with* workers through chat sessions.

This means the catalogue below is a **commercial/product catalogue of worker personas**, not yet 11 rows seeded in any database — no worker type below is currently instantiated in the backend. Standing up the catalogue (seed data, default `instructions` templates, default knowledge assignments) is unbuilt work, not yet sequenced in [[roadmap]] — the roadmap so far only covers the generic worker CRUD screens (Package 3), which manage whatever workers a customer creates, not a specific catalogue seeding mechanism.

## The 17 approved worker types

| Worker | One-line purpose | Detail | Recommended Department Head role? |
|---|---|---|---|
| **CTO Worker** | Strategic/technical leadership persona — architecture judgment calls, technology direction | [[cto-worker]] | CTO |
| **Software Developer Worker** | General-purpose backend/application development | [[software-developer-worker]] | — |
| **Web Developer Worker** | Frontend/web-specific development, distinct from general software development | [[web-developer-worker]] | — |
| **QA Worker** | Testing, verification, quality gates | [[qa-worker]] | — |
| **Cybersecurity Specialist Worker** | Security review, threat modelling, hardening | [[cybersecurity-worker]] | — |
| **IT Infrastructure Worker** | Servers, environments, deployment infrastructure | [[it-infrastructure-worker]] | — |
| **Network Engineering Worker** | Networking, connectivity, network security posture | [[network-engineering-worker]] | — |
| **Licensing & Compliance Worker** | Licensing model administration, regulatory/compliance tracking | [[licensing-compliance-worker]] | — |
| **Project Manager Worker** | Planning, sequencing, cross-worker coordination | [[project-manager-worker]] | — |
| **Marketing Manager Worker** | Marketing strategy, positioning, campaign/GTM sequencing | [[marketing-manager-worker]] | Head of Marketing |
| **Content Production Worker** | Copywriting, technical/content writing, execution layer beneath marketing strategy | [[content-production-worker]] | — |
| **CFO Worker** | Financial planning, budget/cost trade-offs, commercial-risk framing | [[cfo-worker]] | CFO |
| **Head of Sales Worker** | Pipeline review, deal structuring, negotiation preparation | [[head-of-sales-worker]] | Head of Sales |
| **Head of Operations Worker** | Cross-functional process, resourcing, recurring operational execution | [[head-of-operations-worker]] | Head of Operations |
| **Head of Customer Success Worker** | Retention, onboarding, account health | [[head-of-customer-success-worker]] | Head of Customer Success |
| **Sales Manager Worker** | Operational: prospect intake, lead qualification, proposal drafting | [[sales-manager-worker]] | — |
| **Customer Success Manager Worker** | Operational: customer health tracking, onboarding checklist execution | [[customer-success-manager-worker]] | — |

The four rightmost-marked rows plus CTO Worker and Marketing Manager Worker are the six roles [[department-head-layer]] (Phase 0 Package I) recommends for the target executive hierarchy (Human → Orchestrator → CTO → CFO → Head of Sales → Head of Marketing → Head of Operations → Head of Customer Success → Specialist Workers). "Recommended" is doing real work in that sentence: none of the six is auto-created, seeded, or bootstrapped by any endpoint — an admin creates each department and worker and assigns headship manually, one action at a time, exactly like every other worker/department in this catalogue. A customer is free to use any worker as a department head, or none at all; these six are simply the documented, recommended starting point.

**Sales Manager Worker and Customer Success Manager Worker are deliberately not on this Department Head list.** They are Phase 0 Package J's operational, "doer" personas — the ones that actually run prospect intake, lead progression, proposal drafting, and onboarding-checklist execution — distinct from Head of Sales/Head of Customer Success, which Package I built as advisory-only executives that explicitly decline any operational role. A customer's actual Sales department might reasonably be headed by a Head of Sales Worker while staffed with one or more Sales Manager Workers doing the day-to-day work; nothing in this catalogue or the backend prevents also designating a Sales Manager Worker as a department head, but it is not the recommended pairing.

Each linked document follows the same shape (per [[worker-operating-standards]]): purpose, scope boundaries (what this worker does *not* do), inputs it should read before acting, outputs/artifacts it produces, and how it should use this knowledge base.

**Split rationale (Marketing Manager vs. Content Production):** mirrors the existing CTO/Software Developer and Marketing/Content split pattern already established in this catalogue (direction vs. execution) — Marketing Manager Worker owns strategy, positioning, and sequencing; Content Production Worker owns producing the actual customer-facing text against a brief. Same relationship as CTO Worker (decides direction) to Software/Web Developer Workers (implement).

## Relationship between "Workers" here and this codebase's own contributor roles

There is a second, easy-to-confuse sense of "worker" in this project: the *Teracom Developer/QA/Security/etc. Workers* the project owner has asked this knowledge base to support (per the request that created this `docs/` tree) are **automated or human contributors operating on this repository** — they use this knowledge base to onboard and act. The **catalogue above** is the **product** those contributors build and ship to customers. A future Software Developer Worker (contributor sense) may well be the one implementing the Software Developer Worker (product sense) persona's default instructions — don't conflate the two meanings when reading elsewhere in this knowledge base; context (a workforce/*.md file vs. a governance/standards file) disambiguates which sense is meant.

## Open questions (do not silently resolve)

- Does the catalogue vary by edition (e.g. is every worker type available at Starter, or are some Enterprise/Sovereign-only)? Not decided — see [[product-editions]] §Cross-edition notes.
- Is there a default/recommended `instructions` template per worker type, or is every customer expected to author their own from a blank persona? Not decided.
- Can a customer create custom worker types outside this catalogue of 11, or is the catalogue meant to be the exhaustive set the product supports? The backend's `workers` table technically allows any `name`/`role`/`purpose`/`instructions` combination today — whether the product intends to constrain this to the catalogue is a commercial/UX decision, not decided.
