# Documentation Standards

**Applies to:** everything under `docs/` in this repository — the Teracom Operating Knowledge Base itself. This document is self-referential by design: it's the rule set that keeps this knowledge base from decaying the way the pre-existing scattered root-level reports would have. See [[worker-operating-standards]] for how each worker type is expected to *use* this knowledge base; this document is about how to *maintain* it.

---

## 1. Structure is fixed; content is not

The `docs/` tree structure (`governance/`, `commercial/`, `workforce/`, `frontend/`, `backend/`, `standards/`) was deliberately chosen to separate concerns that decay at different rates and get read by different roles. Don't invent new top-level directories without a clear reason a new domain doesn't fit an existing one — six categories with clear ownership beats twelve with overlapping scope.

## 2. Every document states its own freshness and confidence

- Snapshot-style documents ([[project-state]], [[frontend-status]], [[backend-status]]) must carry a "last verified" date and, where the source is indirect, an explicit confidence caveat — see [[backend-status]]'s "second-hand documentation" header as the pattern to follow whenever documenting a system this repo doesn't contain.
- Decision-log documents ([[architecture-decisions]], [[changelog]]) are **append-only** — never rewrite a past entry to reflect new understanding; add a new entry that supersedes it and leave the old one for history. This is what makes them trustworthy as a record of *why*, not just *what*.
- Open-question documents ([[pricing-model]], parts of [[licensing-model]]) must clearly separate "decided" from "not decided" — never let an inferred placeholder read as an approved figure.

## 3. Cross-linking convention

Documents reference each other with `[[kebab-case-name]]` links, where the name matches the target document's identity (lowercase, hyphenated version of its filename, without the `.md`/directory prefix — e.g. `docs/governance/PROJECT_STATE.md` is referenced as `[[project-state]]`). This mirrors the convention used by the assistant's own memory system and keeps intra-KB references greppable. Link liberally, including to documents that logically should exist even if a specific line item hasn't been written yet — a broken-looking link is a to-do marker, not an error.

## 4. Every package/change updates specific, named documents — not "docs" in the abstract

When a worker ships a package or makes a decision, the following updates are not optional extras — they are part of "done":

| What happened | Update |
|---|---|
| A package/feature shipped | [[project-state]] status table, a dated entry in [[changelog]], a new report under the relevant `IMPLEMENTATION_REPORTS/` following the existing report shape (scope, decisions+why, files changed, validation, remaining risks) |
| A new architectural or process decision was made | A new entry in [[architecture-decisions]] (never edit a past entry) |
| A commercial/licensing decision was made or changed | The relevant `docs/commercial/*.md` file, plus a [[changelog]] entry if it changes previously-published guidance |
| A standing risk/gap was newly discovered | The relevant status doc's risk section, plus [[security-standards]] if security-relevant |
| A sprint starts or ends | [[current-sprint]] is overwritten (not appended to) |

## 5. Second-hand vs. first-hand sourcing

If a document describes a system whose source code isn't in this repository (currently: `teracom-ai-backend`), it must say so explicitly and cite where the claim came from (which document, which section) rather than presenting it as directly verified. See [[backend-status]] and [[remediation-history]] as the reference pattern. Upgrade a document from second-hand to first-hand the moment direct access/verification becomes possible — don't leave a stale caveat in place once it no longer applies.

## 6. Don't duplicate; link instead

Full technical detail that already lives in one document (e.g. the full backend endpoint inventory in `docs/frontend/FRONTEND_ARCHITECTURE.md` §B.4) should be *linked to and summarised*, not copy-pasted into a second document — duplication is exactly how two copies of the truth quietly diverge. If a summary is genuinely needed elsewhere, keep it short and point back to the source of record.

## 7. Reviewing this knowledge base itself

Any worker who finds this knowledge base wrong, stale, or contradicting the actual code/repository state should fix it in the same change where they discovered the discrepancy — per the standing instruction that memory/state artifacts must never be trusted blindly against live verification (see [[project-state]] §6). This knowledge base is the authoritative source of truth for the project **because** it's kept current, not by default — treat every stale entry found as a bug to fix, not a quirk to route around.
