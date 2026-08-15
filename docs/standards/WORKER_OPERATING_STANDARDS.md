# Worker Operating Standards

**Applies to:** every future Teracom Developer, QA, Security, Licensing, and Project Manager Worker (and any human) operating on this repository, using this knowledge base as their onboarding and reference source. See [[worker-catalogue]] for the product-catalogue sense of "worker" — this document is about the contributor sense (see [[worker-catalogue]] §Relationship between "Workers" here and this codebase's own contributor roles for the disambiguation).

---

## 1. Onboarding order — read this knowledge base in this sequence, not randomly

1. **`docs/governance/PROJECT_STATE.md`** — what's actually true right now. Always first; everything else is context for interpreting this.
2. **`docs/governance/ARCHITECTURE_DECISIONS.md`** — what's already been decided and why, so you don't re-litigate settled questions or violate a constraint you didn't know existed.
3. **The relevant domain document** for your task — `docs/frontend/FRONTEND_ARCHITECTURE.md` for frontend work, `docs/backend/BACKEND_STATUS.md` for backend-adjacent awareness (remembering it's second-hand), `docs/commercial/*` for anything commercial/licensing, your own role file in `docs/workforce/*` for scope and escalation boundaries.
4. **`docs/governance/ROADMAP.md`** and **`docs/governance/CURRENT_SPRINT.md`** — what's sequenced and what's active, so new work doesn't jump ahead of an unmet dependency.
5. **`docs/standards/*`** relevant to your role — [[development-standards]] for anyone writing code, [[security-standards]] for anything auth/session/gating-adjacent, [[documentation-standards]] for how to update this knowledge base correctly when you're done.

## 2. Never trust a stale snapshot over live verification

Every status document in this knowledge base ([[project-state]], [[frontend-status]], [[backend-status]]) is a snapshot with a "last verified" date. Before acting on a specific claim (a file exists, an endpoint behaves a certain way, a package is complete), verify it against the actual repository/system if the action has real consequences — the same standard the assistant's own memory system applies. A memory or doc that says "X exists" is a claim about when it was written, not proof X exists now.

## 3. Memory and state hygiene

- Update [[project-state]]'s status table and [[frontend-status]]'s package table in the **same change** that ships or removes something — not as a follow-up "docs" commit that might never happen.
- Add a dated entry to [[changelog]] for anything that changes what's true about the project — new entries only, never rewritten history.
- Record new architectural decisions as new ADRs in [[architecture-decisions]], never as an undocumented judgment call buried in a PR description or chat transcript.
- Overwrite (don't accumulate in) [[current-sprint]] at sprint boundaries.

## 4. Scope discipline

- Stay inside your role's documented scope (see your entry in `docs/workforce/`) and explicitly hand off work that belongs to another role rather than silently absorbing it — e.g. a Software Developer Worker finding a licensing design gap should flag it to a Licensing & Compliance Worker (or the project owner), not invent an answer.
- Respect [[roadmap]] sequencing — later packages have real, documented dependencies on earlier ones (e.g. Chat needs the Worker picker). Reordering requires a recorded reason, not convenience.
- Respect ADR-001 in [[architecture-decisions]]: the public marketing site is off-limits for redesign regardless of what package you're working on.

## 5. Validation bar — "done" is defined, not vibes

Per [[development-standards]] §7: build, lint, and unit tests passing, plus an end-to-end smoke test against a live backend covering the real states involved (logged-out/in, admin/non-admin, rate-limited, etc.), with any test data cleaned up afterward. Don't mark something complete in [[project-state]] without meeting this bar — see [[qa-worker]] for the role most directly responsible for enforcing it, but every role is expected to hold this line for its own work.

## 6. Escalate genuinely open questions; don't silently resolve them

Several documents in this knowledge base ([[pricing-model]], [[licensing-model]] §3, [[commercial-model]] §5) contain explicit lists of undecided questions. These are marked "not decided" on purpose — a worker encountering one should raise it to the project owner or the relevant specialist role (see the escalation-boundary section of each `docs/workforce/*.md` file), not infer a plausible-sounding answer and proceed as if it were settled. An inferred answer that later turns out wrong is more expensive to unwind than a flagged question.

## 7. Security and commercial claims require a higher bar

Never present second-hand backend information (see [[backend-status]]) with more confidence than its source warrants. Never quote a price, licensing term, or commercial figure that isn't explicitly recorded as approved in `docs/commercial/*` — draft/placeholder numbers must never reach a customer-facing artifact.

## 8. This document itself

If following these standards turns out to be impractical for a specific situation, that's a signal to raise with the Project Manager Worker role (or project owner) and update this document accordingly — not a signal to quietly ignore it. See [[documentation-standards]] §7 for the same principle applied to the knowledge base as a whole.
