# Foundation Workforce Catalogue V2 — Report

**Date:** 2026-08-16 · **Type:** Documentation-only change · **Scope:** `docs/workforce/`

---

## 1. Task

Review all 12 files under `docs/workforce/` (the catalogue index, its enhancement report, and the 11 worker definitions: CTO, Software Developer, Web Developer, QA, Cybersecurity Specialist, IT Infrastructure, Network Engineering, Licensing & Compliance, Project Manager, Marketing Manager, Content Production) and produce an expanded, standardised definition for each worker covering nine fields: Purpose, Scope, Responsibilities, Onboarding Sequence, Knowledge Sources, Collaboration With Other Workers, Constraints, Outputs, Success Criteria.

Documentation only. No frontend, backend, or code changes were made or considered — no files outside `docs/workforce/` were modified.

## 2. Files created

| File | Purpose |
|---|---|
| `docs/workforce/FOUNDATION_WORKFORCE_CATALOGUE_V2.md` | The expanded, standardised catalogue — all 11 workers, nine fields each, plus a shared cross-cutting-notes section |
| `docs/workforce/FOUNDATION_WORKFORCE_CATALOGUE_V2_REPORT.md` | This report |

## 3. Files reviewed, not modified

`WORKER_CATALOGUE.md`, `WORKFORCE_CATALOGUE_ENHANCEMENT_REPORT.md`, and all 11 individual worker files (`CTO_WORKER.md` through `CONTENT_PRODUCTION_WORKER.md`) — read in full and used as source material. None were edited, renamed, or deleted. Also reviewed for accuracy and cross-reference validity: `docs/standards/WORKER_OPERATING_STANDARDS.md`, `docs/standards/DOCUMENTATION_STANDARDS.md`, `docs/governance/ARCHITECTURE_DECISIONS.md` (confirmed current through ADR-012), `docs/governance/ROADMAP.md`, `docs/commercial/LICENSING_MODEL.md` and `LICENSING_MODEL_V1.md` (confirmed the former is explicitly superseded by the latter), `docs/backend/LICENSING_SERVICE_ARCHITECTURE_V1.md`, `docs/governance/UX_VISION.md`, `docs/governance/BILLING_AND_LICENSING_UX.md`, and `docs/governance/WEBSITE_INFORMATION_ARCHITECTURE_V1.md` — the last three had not existed when the original 11 files were written and are newly cited where relevant (Licensing & Compliance, CTO, Marketing Manager, Content Production, IT Infrastructure, Network Engineering).

## 4. What "expand, standardise, improve" meant in practice

- **Expand:** each worker's original ~20–30 lines of prose (structured as Product definition / Contributor role / a boundary section) is now organised into nine explicitly labelled fields, several of which — **Collaboration With Other Workers** and **Success Criteria** — did not exist as distinct concepts in any of the 11 originals and required synthesising new content from what was implicit across files (e.g. the CTO↔Software Developer "directs vs. implements" relationship was stated in both files separately; it's now a single explicit collaboration-table row on each side).
- **Standardise:** every worker now uses the identical nine-field shape in the identical order, rather than the prior three-section shape whose second/third section titles varied by file ("Scope boundary" vs. "What this role does not do" vs. "Escalation boundary"). §0 of the new document documents the shape once so it isn't repeated 11 times.
- **Improve:** corrected staleness found during review — the original `LICENSING_COMPLIANCE_WORKER.md` only cites `[[licensing-model]]` (the now-historical draft) and doesn't mention `LICENSING_MODEL_V1.md` (current source of record, ADR-011) or the newly-created `LICENSING_SERVICE_ARCHITECTURE_V1.md`. The V2 entry for Licensing & Compliance Worker cites the current documents and updates the "9 open questions" reference to point at V1 §19's consolidated list. Similarly, no original file cited `UX_VISION.md`, `BILLING_AND_LICENSING_UX.md`, or `WEBSITE_INFORMATION_ARCHITECTURE_V1.md` — all three postdate most of the 11 files and are now woven into the relevant workers' Knowledge Sources (Web Developer, CTO, Marketing Manager, Content Production, Licensing & Compliance).

## 5. Structural decisions

- **New file, originals untouched.** `FOUNDATION_WORKFORCE_CATALOGUE_V2.md` is a new, additional document; the 11 individual worker files and `WORKER_CATALOGUE.md` were not edited, superseded-banner'd, or deleted. This mirrors the append-only spirit of [[documentation-standards]] §2 (decision logs are never rewritten in place) applied to a definitional document: rather than editing 11 files in place and risking silent loss of their original framing, a new consolidated document supersedes them *in level of detail* while they remain as historical, still-accurate-as-far-as-they-go artifacts. The task's own instruction list named exactly two files to create and none to update — the same narrow-scope precedent followed in the immediately preceding Licensing Service Architecture task.
- **Not done, flagged as a recommended follow-up (not executed here):** adding a "see [[foundation-workforce-catalogue-v2]] for the current expanded reference" banner to each of the 11 original files and to `WORKER_CATALOGUE.md`, the same pattern already used when `LICENSING_MODEL_V1.md` superseded `LICENSING_MODEL.md`; and a corresponding ADR entry in `docs/governance/ARCHITECTURE_DECISIONS.md` recording that the workforce catalogue's reference shape changed. Both are reasonable next steps consistent with [[documentation-standards]] §4's binding table, but were left undone to respect the request's explicit two-file "Create:" scope — a Project Manager Worker (per its own new V2 definition's responsibilities) would be the natural owner of sequencing that follow-up.
- **Roster unchanged.** Still 11 workers, no additions, removals, or renames. This task was about depth and consistency of definition, not catalogue membership.
- **No new open questions were resolved.** Where a worker's scope touches a still-open item (e.g. Licensing & Compliance Worker's driving of `LICENSING_MODEL_V1.md` §19), the V2 entry restates the open item accurately and points to the correct current document — it does not invent an answer, per [[worker-operating-standards]] §6.
- **New §12 "Cross-cutting notes"** added at the end, capturing three things that applied identically across all 11 original files and would otherwise have been repeated 11 times: the dual-sense (product persona vs. contributor role) reading discipline, the standing "catalogue not yet seeded" caveat from `WORKER_CATALOGUE.md`, and the shared expectation that escalation is a first-class duty rather than a fallback.

## 6. Verification

- Every `[[wikilink]]` target introduced or carried forward in the new document was checked against an actual file on disk under `docs/` (via directory listings of `governance/`, `commercial/`, `standards/`, `frontend/`, `backend/`, `workforce/`) — no dangling references to a document that doesn't exist were introduced.
- ADR citations (ADR-001 through ADR-012) were checked against the current `docs/governance/ARCHITECTURE_DECISIONS.md` heading list to confirm the numbers and one-line descriptions used in the new document match what's actually recorded there.
- The superseded relationship between `LICENSING_MODEL.md` and `LICENSING_MODEL_V1.md` was confirmed by reading both files' status headers directly, not assumed from a prior summary.
- Every one of the 11 workers' new **Collaboration With Other Workers** table was cross-checked for symmetry — where worker A's table lists a relationship to worker B, worker B's own entry (either its table or its Scope/Responsibilities) reflects the same relationship from its side, so no one-sided or contradictory collaboration claim was introduced.

## 7. Not done (explicitly out of scope)

- No changes to `docs/governance/*`, `docs/commercial/*`, `docs/standards/*`, `docs/frontend/*`, or `docs/backend/*` — read for accuracy, not modified.
- No backend `workers` table seed data, default `instructions` templates, or any code — this remains, as before, a documentation-only catalogue describing personas that are not yet instantiated in any database.
- No frontend or backend code was created, edited, or run; no build/lint/test validation was performed, consistent with a documentation-only task.
