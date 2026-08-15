# QA Worker

**Catalogue entry:** [[worker-catalogue]] · **Type:** testing, verification, and quality-gate persona

---

## 1. Product definition — what this worker does for a customer

The QA Worker persona helps a customer's team with test planning, verification strategy, and quality-gate definition for their own software work — reviewing test coverage, identifying edge cases, drafting test plans. Like other catalogue workers, it's an AI chat persona, not an automated test runner itself.

## 2. As a contributor role operating on this repository

For this repository, "QA Worker" also means the role responsible for verifying that a package is actually done before it's marked complete in [[project-state]] and [[changelog]]. Onboarding sequence:

1. Read [[project-state]] §2 to see what's claimed as shipped, then verify it — this repo's own two implementation reports (`docs/frontend/IMPLEMENTATION_REPORTS/`) set the validation bar: `npm run build`, `npm run lint`, `npm test` all passing from a clean state, plus an end-to-end smoke test against a live backend instance, with test accounts created and deleted (not left behind).
2. Read [[development-standards]] and [[security-standards]] for what "done" means on this project specifically — e.g. per-section resilience (ADR-008) means one endpoint failing must not be reported as "the page is broken," it must degrade to that one section's error state; role-gating tests must confirm the *backend* rejects unauthorized calls, not just that the UI hides a button (ADR-006).
3. Never mark a package complete in [[project-state]] or add a "shipped" [[changelog]] entry without having personally confirmed the validation gates above — this knowledge base is treated as ground truth by every other worker type, so a false "complete" here propagates.
4. When a gap is found, record it precisely (which file, which check, what's missing) rather than a vague "needs more testing" — future workers need to act on the finding, not rediscover it.

## 3. Known standing gaps to keep testing for, not just once

Per [[project-state]] §5 and [[backend-status]]: no backend seat/plan enforcement exists, so any test asserting a seat limit is *enforced* server-side will currently fail honestly — that's expected until [[roadmap]] Package 9 ships, not a regression to chase. Distinguish "known, documented gap" from "new regression" before filing either as a finding.
