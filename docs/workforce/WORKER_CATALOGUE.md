# Worker Catalogue

**Status:** Roster of 11 worker types approved by the project owner, 2026-08-15 (9 original + Marketing Manager Worker and Content Production Worker added 2026-08-15). This is the commercial/functional catalogue definition — for the technical mechanism a "worker" runs on, see [[backend-status]] §Domain model. For how workers map to editions/seats, see [[product-editions]].

---

## What a "Worker" is, technically

In `teracom-ai-backend`, a Worker is a row in the `workers` table: `name, role, purpose, instructions, status`, scoped to an `organisation_id`. Practically, a worker is an **AI agent persona** — the `role`/`purpose`/`instructions` fields become system-prompt components for that agent's chat sessions (backed by Ollama + a Chroma-indexed knowledge base scoped via `knowledge_permissions`). A worker is not a human staff record and has no login of its own — humans (the `users` table) interact *with* workers through chat sessions.

This means the catalogue below is a **commercial/product catalogue of worker personas**, not yet 11 rows seeded in any database — no worker type below is currently instantiated in the backend. Standing up the catalogue (seed data, default `instructions` templates, default knowledge assignments) is unbuilt work, not yet sequenced in [[roadmap]] — the roadmap so far only covers the generic worker CRUD screens (Package 3), which manage whatever workers a customer creates, not a specific catalogue seeding mechanism.

## The 11 approved worker types

| Worker | One-line purpose | Detail |
|---|---|---|
| **CTO Worker** | Strategic/technical leadership persona — architecture judgment calls, technology direction | [[cto-worker]] |
| **Software Developer Worker** | General-purpose backend/application development | [[software-developer-worker]] |
| **Web Developer Worker** | Frontend/web-specific development, distinct from general software development | [[web-developer-worker]] |
| **QA Worker** | Testing, verification, quality gates | [[qa-worker]] |
| **Cybersecurity Specialist Worker** | Security review, threat modelling, hardening | [[cybersecurity-worker]] |
| **IT Infrastructure Worker** | Servers, environments, deployment infrastructure | [[it-infrastructure-worker]] |
| **Network Engineering Worker** | Networking, connectivity, network security posture | [[network-engineering-worker]] |
| **Licensing & Compliance Worker** | Licensing model administration, regulatory/compliance tracking | [[licensing-compliance-worker]] |
| **Project Manager Worker** | Planning, sequencing, cross-worker coordination | [[project-manager-worker]] |
| **Marketing Manager Worker** | Marketing strategy, positioning, campaign/GTM sequencing | [[marketing-manager-worker]] |
| **Content Production Worker** | Copywriting, technical/content writing, execution layer beneath marketing strategy | [[content-production-worker]] |

Each linked document follows the same shape (per [[worker-operating-standards]]): purpose, scope boundaries (what this worker does *not* do), inputs it should read before acting, outputs/artifacts it produces, and how it should use this knowledge base.

**Split rationale (Marketing Manager vs. Content Production):** mirrors the existing CTO/Software Developer and Marketing/Content split pattern already established in this catalogue (direction vs. execution) — Marketing Manager Worker owns strategy, positioning, and sequencing; Content Production Worker owns producing the actual customer-facing text against a brief. Same relationship as CTO Worker (decides direction) to Software/Web Developer Workers (implement).

## Relationship between "Workers" here and this codebase's own contributor roles

There is a second, easy-to-confuse sense of "worker" in this project: the *Teracom Developer/QA/Security/etc. Workers* the project owner has asked this knowledge base to support (per the request that created this `docs/` tree) are **automated or human contributors operating on this repository** — they use this knowledge base to onboard and act. The **catalogue above** is the **product** those contributors build and ship to customers. A future Software Developer Worker (contributor sense) may well be the one implementing the Software Developer Worker (product sense) persona's default instructions — don't conflate the two meanings when reading elsewhere in this knowledge base; context (a workforce/*.md file vs. a governance/standards file) disambiguates which sense is meant.

## Open questions (do not silently resolve)

- Does the catalogue vary by edition (e.g. is every worker type available at Starter, or are some Enterprise/Sovereign-only)? Not decided — see [[product-editions]] §Cross-edition notes.
- Is there a default/recommended `instructions` template per worker type, or is every customer expected to author their own from a blank persona? Not decided.
- Can a customer create custom worker types outside this catalogue of 11, or is the catalogue meant to be the exhaustive set the product supports? The backend's `workers` table technically allows any `name`/`role`/`purpose`/`instructions` combination today — whether the product intends to constrain this to the catalogue is a commercial/UX decision, not decided.
