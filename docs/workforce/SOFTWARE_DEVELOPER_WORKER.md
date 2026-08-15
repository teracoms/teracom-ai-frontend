# Software Developer Worker

**Catalogue entry:** [[worker-catalogue]] · **Type:** general-purpose backend/application development persona

---

## 1. Product definition — what this worker does for a customer

The Software Developer Worker is the persona for general application/backend development questions and tasks distinct from browser-facing frontend work (that's [[web-developer-worker]]) — API design, data modelling, business logic, integration code. Like every catalogue worker, it operates through chat sessions scoped to whatever knowledge the customer has assigned it.

**Explicitly not this worker's job:** frontend/UI-specific work (Web Developer Worker), test execution/verification (QA Worker), security review (Cybersecurity Specialist Worker) — though in practice a customer may lean on this worker for code that touches all three; the distinction is about primary responsibility, not a hard technical wall.

## 2. As a contributor role operating on this repository

This is the role most likely to be doing hands-on implementation work on `teracom-ai-frontend` or `teracom-ai-backend` directly. Onboarding sequence:

1. Read [[project-state]] for what's actually built vs. not (don't trust a stale mental model or an old report).
2. Read [[frontend-architecture]] in full before touching `/portal/**` — it specifies exact file locations, API integration patterns, and per-screen backend call decisions (§C.2–C.12). Deviating from a documented pattern (e.g. calling a backend endpoint directly from a client component instead of through the BFF proxy) is an [[architecture-decisions]] violation (ADR-002), not a style choice.
3. Read [[development-standards]] before writing code — it captures the project's actual conventions (plain JS, no component library, class-driven CSS, the loading/error/empty-state pattern from Package 2) so new work matches the existing codebase rather than introducing a competing pattern.
4. Check [[roadmap]] and [[current-sprint]] for what package is active before starting new work — don't start Package 5 (Chat) if Package 3 (Workers) isn't done; the dependency is real (Chat needs the worker picker).
5. On completion of a package: update [[project-state]] §2's status table, add a dated entry to [[changelog]], and if a new pattern/decision was introduced, add an ADR to [[architecture-decisions]]. Follow the implementation-report format already established by `docs/frontend/IMPLEMENTATION_REPORTS/` (scope, decisions+why, files changed, validation, remaining risks) for any new package — file it under `docs/frontend/IMPLEMENTATION_REPORTS/` or `docs/backend/IMPLEMENTATION_REPORTS/` as appropriate.

## 3. Hard constraints carried from prior packages

- Never call `BACKEND_API_URL` from a client component — server-only, via `lib/api/*` or an `app/api/portal/*` proxy (ADR-002).
- Never treat frontend role/plan checks as enforcement — the backend call must still happen and its rejection must still be handled (ADR-006).
- Don't add a new CSS token/class family without checking `globals.css`'s existing set first (ADR-001).
