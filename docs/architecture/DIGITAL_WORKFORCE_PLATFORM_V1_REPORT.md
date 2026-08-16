# Digital Workforce Platform Architecture V1 — Report

**Date:** 2026-08-16 · **Type:** Documentation-only change · **Scope:** new `docs/architecture/` directory

---

## 1. Task

Produce a synthesis architecture document answering "How does a customer go from zero workers to a fully operational digital workforce?" across 22 named sections, by reviewing `docs/workforce/*`, `docs/governance/UX_VISION.md`, `docs/governance/WEBSITE_INFORMATION_ARCHITECTURE_V2.md`, `docs/commercial/LICENSING_MODEL_V1.md`, `docs/backend/LICENSING_SERVICE_ARCHITECTURE_V1.md`, and `docs/frontend/COMMERCE_STORE_ARCHITECTURE_V1.md`. Documentation only — no frontend, backend, or code changes.

## 2. Files created

| File | Purpose |
|---|---|
| `docs/architecture/DIGITAL_WORKFORCE_PLATFORM_V1.md` | The 22-section synthesis document |
| `docs/architecture/DIGITAL_WORKFORCE_PLATFORM_V1_REPORT.md` | This report |

## 3. New top-level directory

`docs/architecture/` did not exist before this task and was created to hold these two files, since the task specified this exact path. Per [[documentation-standards]] §1's caution against inventing new top-level directories without clear reason, this is called out explicitly rather than done silently: the reason a new directory (not `docs/governance/` or `docs/frontend/`) fits is that this document sits **across** the existing domain boundaries by design — it synthesises workforce, commercial, licensing, and commerce documents that each already live in their own correct home, and doesn't belong to any single one of those domains more than the others. Recommended follow-up, not executed here: a one-line addition to [[documentation-standards]] §1's directory list acknowledging `docs/architecture/` as a seventh category, so a future reader of that standards document isn't surprised by its existence.

## 4. Files reviewed first-hand

All six named source documents were read in full (not summarised from memory), plus, to ground §18's central finding, direct reads of `teracom-ai-backend`'s `api/organisations.py`, `api/auth.py`, and `api/users.py` (confirming both organisation- and user-creation endpoints require `require_role("admin")`, with no unauthenticated alternative anywhere), and a targeted search confirming no `register`/`signup` route exists in either `teracom-ai-frontend` or `teracom-ai-backend`. `docs/governance/PROJECT_STATE.md` and `docs/backend/BACKEND_STATUS.md` were also searched to confirm this bootstrap gap had not already been documented elsewhere in this knowledge base.

## 5. Key findings

- **§18 — the Day-0 bootstrap gap.** The single most significant first-hand finding: there is no unauthenticated path anywhere in `teracom-ai-backend` to create a brand-new organisation and its first admin user. Both endpoints capable of doing so require an existing admin. This was not previously documented anywhere in this knowledge base (confirmed by search) — every prior implementation report's own test-account creation went through direct database/script access, not a product-facing flow, which is itself indirect evidence this gap has been silently worked around throughout this project's build-out rather than noticed as a gap.
- **§8 — zero licensing enforcement.** [[licensing-service-architecture-v1]] §5 already stated `POST /workers/` has no limit check; this document's contribution is connecting that fact directly to the zero-to-workforce question: today's journey has no licensing gate at all, in either direction (nothing stops over-provisioning, nothing proves the tier model works).
- **§15 — the commerce/product bridge is not just a nice-to-have.** Re-reading [[commerce-store-architecture-v1]]'s finding that the store and the AI product are fully disconnected, in light of §18's finding, raises its priority: the already-proposed checkout-triggered provisioning bridge is not merely a convenience integration, it is the **only currently-conceivable bootstrap mechanism** for a self-service new customer, given §18.
- **§12 — department modelling likely isn't a separate question.** No reviewed document mentions "departments" at all; this document's own synthesis proposes (for review, not as fact) that it's the same open question as [[licensing-service-architecture-v1]] §4.1's organisation-cardinality item, not a distinct modelling problem.
- **§17 — reframing "Public AI Assistants."** [[website-information-architecture-v2]] lists five planned public assistants with no implementation; this document proposes reading them as org-less Worker personas reusing the existing chat mechanism, rather than a structurally new subsystem — offered as a design reading for [[cto-worker]] to confirm or reject, not asserted as settled.

## 6. Structural decisions

- **Four-way labelling (BUILT / DECIDED / OPEN / PROPOSED)**, one more than the Commerce Store and Licensing Service documents' three-way DECIDED/OPEN/PROPOSED scheme, and matching Website IA V2's BUILT/DECIDED/PROPOSED scheme with OPEN added back in. A fourth label was necessary here because this document, uniquely among the four architecture documents produced this session, has to talk about *all four* states in nearly every section: what's ratified commercially, what's actually running in the repository, what's an acknowledged unresolved question, and what this document itself is newly proposing by synthesis.
- **Every one of the 22 requested sections is present as its own numbered heading**, even where several (e.g. §9 Worker-to-Worker Collaboration, §12 Department Workforce Model) have almost no existing material to review and are mostly OPEN — consistent with the same choice made in `COMMERCE_STORE_ARCHITECTURE_V1.md` (report each requested pipeline stage even when the honest answer is "doesn't exist yet"), rather than silently compressing thin sections.
- **§19 (First 30-Day Journey) and §20 (Maturity Roadmap) are explicitly synthesis, not new decisions** — each entry is traceable back to a specific BUILT/OPEN citation earlier in the document rather than asserted freestanding, so a reader can verify the journey table isn't inventing capability that doesn't exist.
- **§21 (Open Decisions) consolidates every OPEN item raised across all 20 preceding sections into one table**, mirroring the consolidated-open-questions-table pattern already used in `LICENSING_SERVICE_ARCHITECTURE_V1.md` §24.5 and `LICENSING_MODEL_V1.md` §19, rather than leaving them scattered.
- **§22 (Recommendations) is explicitly framed as this document's own proposal, not a ratified sequencing decision** — it says so directly in its closing line, consistent with this session's established pattern of never letting a synthesis document's own judgment calls read as approved.

## 7. Verification

- Every `[[wikilink]]` target used was checked against a document that exists on disk (including the three other architecture documents produced this session: `foundation-workforce-catalogue-v2`, `website-information-architecture-v2`, `commerce-store-architecture-v1`).
- The §18 bootstrap-gap finding was verified by reading the actual route decorator and dependency (`require_role("admin")`) on both `POST /organisations/` and `POST /users/`, not inferred from documentation, and cross-checked against a direct grep for any `register`/`signup` route in both repositories, which returned none.
- Every claim attributed to [[licensing-model-v1]] or [[licensing-service-architecture-v1]] was checked against those documents' actual section numbers (both re-read in full for this task) rather than recalled from an earlier conversation summary, since those documents are large and precision on section citations mattered for this document's own cross-references to remain accurate.
- The Package 6 Memory findings (§10) and the RSC flight-payload gap (§7) were restated only as already-established facts from prior work in this knowledge base/session, clearly marked as restated rather than newly investigated in this task.

## 8. Not done (explicitly out of scope)

- No resolution of any of §21's ten open decisions — each is a named worker's or the project owner's call.
- No ADR added recording this document's existence or its recommendations; no `docs/standards/DOCUMENTATION_STANDARDS.md` update acknowledging the new `docs/architecture/` directory; no `docs/governance/ROADMAP.md` changes reflecting §20's proposed maturity stages. All three are flagged as reasonable follow-ups in §3 and §6 above but left undone, consistent with this session's established precedent of doing only what a task explicitly names.
- No frontend or backend code was created, edited, or run; no build/lint/test validation was performed, consistent with a documentation-only task.
