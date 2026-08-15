# UX Vision

**Status:** The core philosophy — **Natural Language First, Wizard Second, Forms Last** — is approved direction from the project owner, 2026-08-15. See ADR-012 in [[architecture-decisions]]. The roadmap, priority ordering, and evaluation rubric below are this document's proposed operationalisation of that philosophy — they are a working draft for review, not a binding sequencing commitment, per [[documentation-standards]] §2's decided/not-decided separation.

This document governs *new* screen and interaction design going forward. It does not retroactively re-scope Packages 1–7, which shipped as form/table-driven screens before this direction was approved (see [[roadmap]]).

---

## 1. UX philosophy

Teracom AI's core product unit is not a database row — it's a conversational AI **Worker** persona ([[worker-catalogue]], [[frontend-architecture]]). Chat is not one feature among many; it is the platform's native interaction mode, already shipped and working end-to-end (Package 5, [[roadmap]]). The UX vision follows directly from that: administrative and operational tasks should default to the same interaction mode users already use to get value from the product, rather than defaulting to a second, disconnected UI paradigm (forms and tables) for everything that isn't chat.

This gives a three-tier hierarchy, in order of preference:

1. **Natural language first.** If a task can reasonably be expressed as "ask a worker to do X" and the system can act on that intent, that is the preferred interface.
2. **Wizard second.** Where natural language isn't yet feasible (backend can't yet act on free-form intent) or isn't appropriate (the task has many interdependent fields a user needs to see structured), a short, guided, multi-step wizard is the next preference over a single dense form.
3. **Forms last.** A traditional static form is the fallback — appropriate for bulk/tabular data, repeated power-user configuration, or precise/auditable input — not the default starting point for a new screen.

This is a design *evaluation order*, not a mandate that every screen must literally be chat. Many screens will still land on "wizard" or even "form" after evaluation (§6) — the point is that the evaluation happens, in that order, rather than reaching for a form by default because it's the fastest thing to build.

## 2. UX roadmap

Today, every shipped package (Packages 1–7, [[roadmap]]) is form/table-driven: worker creation is a single dense form, knowledge upload is a multipart form, admin user creation is a form, and so on. This is a reasonable starting point — it got a working product shipped across a well-established `DataTable`/card/detail-page pattern (ADR-007, [[architecture-decisions]]) — but it is the baseline this vision proposes to build *from*, not the target state.

Proposed direction for future packages and any revisit of existing ones:

- **Package 8 onward** (knowledge connectors, and anything beyond the current roadmap) should be evaluated against §6's rubric before defaulting to a form.
- Existing form-first flows are **candidates for wizard treatment** (§5), not scheduled work — no package has been re-opened or re-scoped by this document alone.
- The natural-language tier depends on backend capability that does not exist today: chat is currently synchronous, informational Q&A only, with no verified function-calling/tool-use/action-taking mechanism ([[project-state]] §3). NL-first for *action-taking* screens is a direction to build toward, not something to promise as available now.

## 3. Wizard strategy

A "wizard," in this document's usage, is a guided, multi-step flow with:

- One thing at a time — a small number of fields per step, not a full form on one screen.
- Sensible defaults, so a user can move forward without deciding every field explicitly.
- Progressive disclosure — later steps only appear once earlier ones make them relevant (e.g. don't ask about knowledge assignment before a worker exists).

A wizard sits deliberately between the other two tiers: it is less flexible than natural language (a user can't phrase an unanticipated request), but more structured and discoverable than a chat prompt (a new user doesn't have to guess what's possible or supply every parameter unprompted). It is the right fit for tasks that are inherently multi-step and benefit from visible structure — e.g. creating a worker *and* assigning its initial knowledge *and* setting initial permissions in one guided flow, rather than three separate form pages a user has to know to visit in order.

## 4. AI-native platform vision

The long-term vision is that most administrative actions a user takes in Teracom AI — creating a worker, assigning knowledge, managing users, checking a licence/renewal status — become achievable by asking a worker in natural language, with the underlying system translating that intent into the same backend calls the current forms already make. Forms and wizards do not disappear in this vision; they remain the deterministic, auditable, always-available fallback for cases where precision and auditability matter more than conversational convenience — most notably, anything in [[licensing-model-v1]] that requires human approval (ownership transfer, licence issuance) is not a candidate for pure NL automation regardless of how far this vision progresses, because the human-approval step is itself the point (see [[licensing-model-v1]] §9).

This vision is intentionally aspirational and multi-year in scope — it is not a claim that the current backend supports action-taking chat today (it does not, per §2). It is the direction new capability investment should bend toward.

## 5. Priority wizard list (proposed, not approved sequencing)

A draft-recommended order for which existing form-first flows should get wizard treatment first, derived from the highest-frequency and highest-friction points in [[roadmap]]/[[project-state]]:

1. **New Worker creation** (Package 3) — currently a single dense form; the highest-frequency setup action for any new organisation, and a strong candidate for a short guided flow (name/role/purpose → instructions → initial knowledge → done).
2. **Knowledge upload + assignment** (Package 4) — already conceptually a two-step flow (upload, then assign to workers) that today happens as two separate form pages; a natural fit for an explicit wizard.
3. **Organisation/user onboarding** (Package 7, Admin) — first-user and initial-org setup for a brand-new customer, where guided defaults reduce early mistakes more than an open form would.
4. **Licence renewal / ownership transfer request** ([[licensing-model-v1]] §11–12) — a guided flow is a natural fit here regardless of NL feasibility, since a human-approval step is mandatory either way (§4 above).
5. **Natural-language "ask a worker to do X" actions** — the most ambitious tier, explicitly last because it depends on backend action-taking capability that doesn't exist yet (§2); listed here as the eventual destination for items 1–3 above, not a near-term deliverable.

This ordering is a proposal for review, not an approved commitment — treat it the same way [[pricing-model]] treats unapproved figures: a starting point to bring back for sign-off, not something to build against silently.

## 6. Design evaluation rules

Before building a new screen or feature as a form, apply this rubric, in order:

1. **Can this be accomplished by asking a worker in natural language today, or with reasonable near-term backend support?** If yes, prefer that path.
2. **If not, can it be a short guided wizard** — a handful of steps, sensible defaults, one thing at a time? Prefer that over a single large form.
3. **Reserve a traditional static form for:** bulk/tabular data entry, power-user/admin configuration screens used repeatedly by the same operator, or actions requiring precise, auditable, non-conversational input (e.g. exact licence terms, legal/compliance fields).
4. **"It's faster to build a form" is not, by itself, a valid reason to skip this evaluation.** The rubric exists precisely because a form is the path of least resistance for whoever is building the screen, not necessarily the best interface for whoever is using it.
5. **Record the outcome.** Any new screen's implementation report (per [[documentation-standards]] §4) should note which of the three tiers it landed on and why — this keeps the rubric something that's actually applied, not just stated here and ignored in practice.
