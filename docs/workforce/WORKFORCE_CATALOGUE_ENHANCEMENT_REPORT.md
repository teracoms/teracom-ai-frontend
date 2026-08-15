# Workforce Catalogue Enhancement Report

**Date:** 2026-08-15 · **Type:** Documentation-only change · **Scope:** `docs/workforce/`

---

## 1. Scope

Added two missing worker definitions to the workforce catalogue and updated the catalogue index. No code, frontend, or backend changes — documentation only, matching the format request.

## 2. Files created

| File | Purpose |
|---|---|
| `docs/workforce/MARKETING_MANAGER_WORKER.md` | New worker definition — marketing strategy, positioning, campaign/GTM sequencing |
| `docs/workforce/CONTENT_PRODUCTION_WORKER.md` | New worker definition — copywriting/content execution against a brief |
| `WORKFORCE_CATALOGUE_ENHANCEMENT_REPORT.md` | This report |

## 3. Files updated

| File | Change |
|---|---|
| `docs/workforce/WORKER_CATALOGUE.md` | Roster count 9 → 11; table extended with both new rows; status line dated; "11 rows" reference corrected in the domain-model paragraph; open-questions section's "9" → "11"; added a split-rationale note explaining the Marketing/Content division |

## 4. Structural decisions

- Followed the existing file shape exactly: H1 title → catalogue-entry/type line → `---` → §1 Product definition → §2 As a contributor role operating on this repository (numbered onboarding sequence) → §3 boundary section (title varies by file: "Scope boundary" / "What this role does not do", per existing precedent from Software Developer Worker and Project Manager Worker).
- All 9 content elements requested (product definition, contributor role, onboarding sequence, scope boundaries, knowledge requirements, inputs, outputs, responsibilities, what this role does not do) are present in both files but folded into the existing 3-section shape rather than given 9 separate headers — this matches how the 9 existing files handle the same content (e.g. QA Worker embeds "inputs to read" and "known gaps" inside §2/§3 rather than as standalone sections). Forcing 9 literal headers would have broken consistency with every existing file.
- **Marketing Manager Worker vs. Content Production Worker split** mirrors the CTO Worker / Software Developer Worker precedent already in the catalogue: one worker owns direction (strategy, positioning, sequencing), the other owns execution (producing the artifact). Cross-references between the two are explicit in both files' §1 and §3, same pattern as `[[cto-worker]]` ↔ `[[software-developer-worker]]`.
- Both new files reference existing knowledge-base docs already used elsewhere in the catalogue (`[[product-editions]]`, `[[commercial-model]]`, `[[pricing-model]]`, `[[project-state]]`, `[[roadmap]]`, `[[architecture-decisions]]` ADR-001, `[[development-standards]]`, `[[worker-operating-standards]]`) rather than inventing new knowledge-base entries — no new `[[...]]` targets were introduced that don't already exist in this knowledge base.
- Pricing caution carried through: both new files explicitly instruct against stating specific figures until `[[pricing-model]]` records an approved one, consistent with how Project Manager Worker and Licensing & Compliance Worker treat the same open item.

## 5. Not done (out of scope per request)

- No seed data, default `instructions` templates, or backend `workers` table rows created — the catalogue remains a documentation-only roster, consistent with `WORKER_CATALOGUE.md`'s own "not yet instantiated" caveat.
- No changes to any file outside `docs/workforce/` (governance docs, ADRs, roadmap) — if the project owner wants Marketing Manager / Content Production worker seeding sequenced into `[[roadmap]]`, that's a separate, out-of-scope decision for the Project Manager Worker to make.

## 6. Verification

- Both new files reviewed against all 9 existing `docs/workforce/*.md` files for structural and tonal consistency (heading levels, wikilink conventions, "Explicitly not this worker's job" phrasing pattern, numbered onboarding sequences, ADR-citation style).
- `WORKER_CATALOGUE.md` table row count and roster-count prose (title status line, "9 rows" paragraph, open-questions section) all updated consistently — no stale "9" references left in the file.
