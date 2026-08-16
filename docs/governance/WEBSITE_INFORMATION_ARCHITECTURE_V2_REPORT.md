# Website Information Architecture V2 — Report

**Date:** 2026-08-16 · **Type:** Documentation-only change · **Scope:** `docs/governance/`

---

## 1. Task

Expand [[website-information-architecture-v1]] into a V2 with the same rigor applied to the two prior architecture-documentation tasks this session (Licensing Service Architecture V1, Foundation Workforce Catalogue V2): first-hand review, explicit decided/open/proposed separation, production-ready structure, and this report. Documentation only — no frontend, backend, or code changes.

## 2. Files created

| File | Purpose |
|---|---|
| `docs/governance/WEBSITE_INFORMATION_ARCHITECTURE_V2.md` | Expanded IA doc — corporate structure, navigation, taxonomy, commerce store (linked, not duplicated), public assistants, homepage, consolidated open-questions log |
| `docs/governance/WEBSITE_INFORMATION_ARCHITECTURE_V2_REPORT.md` | This report |

## 3. Files reviewed, not modified

`docs/governance/WEBSITE_INFORMATION_ARCHITECTURE_V1.md` (source document, read in full), `docs/frontend/FRONTEND_ARCHITECTURE.md` §A (existing nav/route/page inventory), `components/Header.js`'s described nav (via `FRONTEND_ARCHITECTURE.md`, not re-read directly since already fully documented there), `docs/governance/ARCHITECTURE_DECISIONS.md` (confirmed no ADR references the IA document), `docs/governance/CHANGELOG.md` and `docs/governance/ROADMAP.md` (confirmed no entry references it either), `docs/commercial/COMMERCIAL_MODEL.md`, `docs/governance/UX_VISION.md`. None were edited.

## 4. Key finding that shaped this document

**V1 describes a target, not the current site, and this was not previously stated anywhere.** V1's own status line says only "Draft V1" — unlike every other governance document that has been ratified (e.g. `UX_VISION.md`: "approved direction from the project owner... ADR-012"), and a direct search of `ARCHITECTURE_DECISIONS.md`, `CHANGELOG.md`, and `ROADMAP.md` for any reference to it returned nothing. Meanwhile the actual built site — confirmed first-hand via `FRONTEND_ARCHITECTURE.md` §A, which itself was produced from direct source review — is a single Next.js application with a flat 5-item nav (`What We Do`, `SecurityOS AI`, `Expertise`, `Store`, `Portal`), not the two-domain, two-navigation-set structure V1 describes. V2's entire structure (BUILT vs. DECIDED vs. PROPOSED, in that priority order per section) exists specifically to make this gap explicit rather than let a future reader treat V1's content as a description of the current site.

## 5. Structural decisions

- **Three-way labelling (BUILT / DECIDED / PROPOSED)**, distinct from the two-way DECIDED/OPEN scheme used in `LICENSING_SERVICE_ARCHITECTURE_V1.md`. A third label was necessary here because, unlike the licensing document (where nearly everything not "decided" was a genuinely undecided business question), most of this document's content is neither an undecided *question* nor a ratified *decision* — it's a **drafted target** (V1's nav, taxonomy, and pipeline) that nobody has yet approved or rejected. Collapsing that into "open" would have understated how fully specified V1's draft already is; collapsing it into "decided" would have overstated its authority.
- **New file, V1 untouched.** Same non-destructive precedent as `FOUNDATION_WORKFORCE_CATALOGUE_V2.md` relative to the 11 original workforce files: V1 remains on disk, unedited. Recommended, not executed here: a superseded/see-also banner on V1 pointing to V2 (the same pattern already used for `LICENSING_MODEL.md` → `LICENSING_MODEL_V1.md`), and an ADR ratifying whichever parts of the IA are approved, so this document's own "no ADR references this" gap doesn't simply repeat itself for V2.
- **Commerce store detail linked, not duplicated.** V1 §4 (formerly its "Commerce Store" section) now points to the new `docs/frontend/COMMERCE_STORE_ARCHITECTURE_V1.md` rather than repeating store detail — per [[documentation-standards]] §6 and consistent with how this knowledge base already treats `FRONTEND_ARCHITECTURE.md` as the single source of truth for the backend endpoint inventory.
- **Open-questions log consolidated at the end** (§7), mirroring the same consolidated-table pattern used in `LICENSING_SERVICE_ARCHITECTURE_V1.md`, rather than leaving open items scattered only inline.

## 6. Verification

- Every navigation item, domain, category, and pipeline stage quoted from V1 was checked against V1's actual text (re-read in full) before being labelled PROPOSED, to avoid misquoting a draft.
- The "no ADR/changelog/roadmap reference exists" claim was verified by direct grep across `ARCHITECTURE_DECISIONS.md`, `CHANGELOG.md`, `ROADMAP.md`, and `PROJECT_STATE.md` for "information architecture," "website ia," and "teracom solutions" — zero matches, confirming the finding rather than assuming it.
- The built-nav description was cross-checked against `FRONTEND_ARCHITECTURE.md` §A rather than re-reading `Header.js` directly, consistent with [[documentation-standards]] §6's link-don't-duplicate rule, since that file already documents it as a first-hand finding.
- Every new `[[wikilink]]` target was confirmed to exist on disk (including the new `[[commerce-store-architecture-v1]]`, created in the same batch of work).

## 7. Not done (explicitly out of scope)

- No superseded-banner added to V1, no ADR added to `ARCHITECTURE_DECISIONS.md`, no `CHANGELOG.md` entry — flagged in §5 above as recommended follow-ups, left undone to match this session's established precedent of doing only what was named.
- No resolution of any of §7's six open questions — each is a project-owner or named-worker decision, not inferred here.
- No frontend/backend code was created, edited, or run.
