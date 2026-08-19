# Wave 2, Workstream 4 — Package GOV1 (Governance Cascade) — Implementation Report

**Date:** 2026-08-19 · **Repo:** `teracom-ai-backend` (all code changes); `teracom-ai-frontend` (governance docs only — no frontend change needed for this v1). **Source:** `WAVE2_IMPLEMENTATION_PLAN.md` (`teracom-ai-docs`) §4, derived from `MASTER_RECOMMENDATION.md`'s identification of Package GOV1 as the next package to greenlight and `teracom-ai-docs/TERACOM_DECISIONS.md` SD-002's "one cascade engine" discipline. **Scope:** the cascade mechanism itself, four named rule types, and Knowledge Inheritance — not a retrofit of the ~24 pre-existing ad hoc admin checks elsewhere in the codebase, and not an admin-facing management UI (a read/write API only).

---

## 1. Investigation before implementation

Before writing any code, the exact current state of `services/governance_policy_service.py` was traced in full, confirming:

- Its `_ACTION_MIN_ROLE` dict and `role_allows_action()` function have **zero real call sites outside their own module** — the four "new endpoints" its own docstring claims it enforces (`worker_creation_request.decide`, `worker.status_update`, `deployment_record.decide`, `deployment_record.complete`) actually enforce via plain `require_role("admin")` in their own routers, never calling into this registry at all. Only `list_policies()` has a real caller (`api/governance_policies.py`).
- `test_worker_governance.py`'s one real test of this module asserts `all(policy["required_role"] == "admin" for policy in policies)` — a hard constraint to avoid breaking if this module were reshaped.
- `Worker.department_id` is **never set at creation time** — `POST /workers/`'s `WorkerCreate` schema doesn't even carry the field. Department assignment is a strictly separate, later `PATCH /workers/{id}/department` call, routed through `services/department_service.py#assign_worker_department()`.
- `Organisation` has zero governance-related columns today — a genuinely clean slate at the top of the intended cascade.

These findings directly shaped the two most important design decisions below.

---

## 2. What was implemented

### A new, additive cascade mechanism
- `models/governance_rule.py` (new) — `GovernanceRule`: `organisation_id`, `department_id` (nullable — NULL means an organisation-level default; set means a department-level override), `rule_type`, `rule_key`, `rule_value` (JSONB, for value-shape flexibility across rule types), `created_by_user_id`, timestamps.
- `models/governance_audit_log.py` (new) — `GovernanceAuditLog`, mirroring this codebase's established one-audit-log-per-domain convention (same shape as `LicensingAuditLog`/`WorkerAuditLog`/`FinanceAuditLog`) rather than reusing an existing one — no existing audit table covers this domain.
- Migration `3f8a1c6e9b2d` (revises `9d4b6f1e2c7a`), applied to the real dev database and verified via the standard migration-correctness suite.
- `services/governance_cascade_service.py` (new) — `set_organisation_rule()`, `set_department_override()`, `resolve_rule()` (department override wins if one exists, else the organisation default, else `None`), `list_effective_rules()`. One generic resolution mechanism across all four rule types — adding a fifth rule_key later requires no new resolution logic.
- **The pre-existing `services/governance_policy_service.py` is completely unchanged** — confirmed by the full suite passing with zero modification to that file or its test.

### Four rule types, deliberately narrow
`governance` (`approval_threshold_aud`), `policy` (`support_response_sla_hours`), `standards` (`require_human_approval_for_ai_content`), `knowledge_assignment` (`default_knowledge_tags`) — exactly the four named in prior planning work, validated in `governance_cascade_service.py` itself (raising `ValueError` → translated to a 400 at the API layer), matching this project's established "hard v1 boundary" discipline.

### API surface
- `schemas/governance_rule.py` (new) — `GovernanceRuleSet`, `GovernanceRuleResponse`, `EffectiveRuleResponse`.
- `api/governance_rules.py` (new router, registered in `main.py`) — `POST`/`GET /governance-rules/organisation` (admin-only write, any-member read) and `POST`/`GET /governance-rules/departments/{department_id}` (same pattern, scoped to one department, using the existing `get_owned_department()` ownership check for cross-organisation isolation).

### Knowledge Inheritance (the fourth rule type, in action)
- `services/knowledge_inheritance_service.py` (new) — `apply_department_knowledge_defaults(worker, department, db)`: resolves the department's `default_knowledge_tags` rule, finds every `Knowledge` document in the same organisation carrying any of those tags (via Wave 1's own `KnowledgeTag` table), and grants a `KnowledgePermission` for each one the worker doesn't already have — additive and idempotent, never revoking existing access or duplicating on reassignment. A no-op, not an error, when no rule is configured.
- `services/department_service.py#assign_worker_department()` — now calls `apply_department_knowledge_defaults()` whenever a worker is assigned to a real department (not cleared). This is the confirmed real integration point, not worker creation.

---

## 3. Tests

New file `tests/test_governance_cascade.py`, 12 tests:
- Organisation-level default set/read.
- A newly-created department inheriting an organisation default with zero configuration.
- A department override taking precedence, correctly recorded as an override, with the organisation default itself left untouched.
- Rejection of an unrecognised `rule_type`.
- Admin-only enforcement on writes (403 for a member, 200 for an admin).
- Cross-organisation isolation.
- A real `GovernanceAuditLog` entry recorded on a rule set.
- Knowledge Inheritance: applying a department's `default_knowledge_tags` grants the correct `KnowledgePermission`; a no-op with no configured rule; idempotent across a clear-and-reassign cycle; a department override of `default_knowledge_tags` taking precedence over an organisation default.
- A regression test confirming `services/governance_policy_service.py`'s own pre-existing registry and its exact expected shape are completely unaffected.

---

## 4. Validation

- **Backend:** full suite — 298/298 passing (286 before this workstream, +12 new). Zero regressions.
- **Frontend:** 302/302 passing, unaffected — no frontend code changed.

---

## 5. What was deliberately not done

- **The ~24 pre-existing ad hoc `require_role("admin")` call sites elsewhere in the codebase were not retrofitted onto this cascade** — an explicit, stated scope boundary (matching the same boundary `governance_policy_service.py`'s own docstring already drew for its narrower registry), not an oversight.
- **No admin-facing management UI (frontend)** — this workstream ships a real, working read/write API; a UI for browsing/editing the cascade is separate, future frontend work.
- **No fifth rule type or open-ended rule schema** — the four named types/keys are the hard v1 boundary, per this project's established discipline against scope creep on foundational packages.

---

## 6. Commit status

Backend and frontend (governance docs) changes complete and tested, ready to commit locally. **Not pushed** — per instruction ("Commit locally... Do not push").
