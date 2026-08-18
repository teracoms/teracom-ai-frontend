# Teracom Review Backlog

**As of:** 2026-08-18 (Platform Review Wave 3 resolution pass)
**Purpose:** a living backlog of UX/branding/navigation findings for future review waves, seeded after Platform Review Wave 1 shipped (see `PLATFORM_REVIEW_WAVE_1_UX_BRANDING_AND_NAVIGATION_REFRESH_IMPLEMENTATION_REPORT.md`). Findings below come from a post-Wave-1 portal walkthrough plus a targeted codebase sweep — not from guessing what *might* be wrong. Each item cites the exact file(s) it was found in.
**Convention:** append new findings with a new `WBL-NNN` id, in the relevant section, rather than editing existing ids — the same append-only discipline `[[project-state]]`'s risk list uses. Strike through (`~~...~~`) and annotate an item once a future wave actually resolves it; don't delete it.
**Not yet implemented:** every item below is a finding, not a plan. No code changes were made while compiling this document.

---

## 1. Branding & copy consistency

- ~~WBL-001 — "CTO" branding survives inside the renamed Orchestration page's own child components.~~ **Fixed — Platform Review Wave 3.** `CtoOrchestrationPanel.js`'s eyebrow and copy now read "Orchestration"/"lead worker"; `CtoExecutionHistory.js`'s empty state now reads "No Orchestration executions yet".

- ~~WBL-002 — The root `/portal` "Overview" page has stale copy and an incomplete feature list.~~ **Resolved differently than proposed — Platform Review Wave 3.** Rather than keep updating this page's copy/feature-grid forever (it would only go stale again at the next new section), `/portal` now redirects straight to `/portal/dashboard` — the one canonical landing page. `AccountSummary.js` (this page's only remaining consumer) was deleted as orphaned dead code. See ADR-025.

- ~~WBL-003 — One `EmptyState` title breaks the app's own punctuation convention.~~ **Fixed — Platform Review Wave 3.** Trailing period removed; a full sweep of every `EmptyState` call site in the app (~40 by this wave) confirmed this was the only offender.

- ~~WBL-004 — An internal service name leaks into user-facing copy.~~ **Fixed — Platform Review Wave 3.** Now reads "Teracom AI has no connector status to report right now."

- ~~WBL-005 — Two unrelated flows share the same eyebrow text.~~ **Fixed — Platform Review Wave 3.** The Orchestration page's hero eyebrow now reads "Orchestration" (matching the rest of that same page), leaving "Teracom AI Workforce" unique to the Start Trial page.

## 2. Navigation & information architecture

- **WBL-006 — Marketing "Production" has no entry point at all.** Confirmed by reading `app/portal/(protected)/marketing/[campaignId]/page.js` and its `ContentPiecePanel.js`/`VideoAssetPanel.js`: the sections are literally headed "Content production." and "Video production.", with per-item admin approve/reject buttons — but there is no cross-campaign queue. An admin has to open every campaign individually to find anything awaiting approval. `PortalNav.js`'s own comment already documents this as a deliberate Wave 1 omission (no dead link), which was the right call for that wave — but a future wave should decide between promoting this to its own page/nav entry, or at minimum adding a pending-approval count/badge somewhere visible.

- ~~WBL-007 — The new nav dropdown doesn't always close itself.~~ **Fixed — Platform Review Wave 3.** `TOP_LEVEL_LINKS` and every dropdown link now carry an `onClick` that closes all menus directly, independent of whether `pathname` actually changes.

- ~~WBL-008 — The new dropdown menus fall short of the standard WAI-ARIA menu-button pattern.~~ **Fixed — Platform Review Wave 3.** Each dropdown now has a real `id` wired to its trigger's `aria-controls`; opening one moves focus to its first `menuitem`; Escape (and selecting a link) closes the dropdown and returns focus to the trigger button; ArrowUp/ArrowDown/Home/End navigate between menu items.

## 3. Visual consistency (cards, icons, stat tiles)

Wave 1's new icon set (`components/portal/icons.js`) and card/badge treatment were applied to exactly three surfaces: the dashboard's four stat tiles, `OrganisationSummaryCard.js`, and the new `SystemMetricsPanel.js`. Everything else still looks exactly as it did before Wave 1.

- ~~WBL-009 — Every other `StatTile` user has no icon.~~ **Fixed — Platform Review Wave 3.** Every `<StatTile>` call site in the app now passes an `icon`, including two new icons (`PermissionIcon`, `BillingIcon`) added to `icons.js` for Permission Grants and Billing.

- ~~WBL-010 — Billing's own stat tiles need new icons that don't exist yet.~~ **Fixed — Platform Review Wave 3.** `BillingIcon` (new) covers Tier/Licence Status, `CpuIcon` covers Hosting Model, `ClockIcon` covers Expiry Date.

- ~~WBL-011 — `admin/billing/usage/page.js` doesn't use `StatTile` at all.~~ **Fixed — Platform Review Wave 3.** `CapacityMeter.js` gained its own optional `icon` prop (additive, same pattern as `StatTile`'s); all three of its call sites on the Usage & Capacity page now pass one.

- ~~WBL-012 — A whole family of summary widgets never got any Wave 1 treatment.~~ **Decided and fixed — Platform Review Wave 3 (see ADR-025).** Decision: keep the list pattern for this content (it suits variable-length rows better than a fixed grid) rather than force a card-grid retrofit, but tie it into the same visual language via a small icon next to each widget's own eyebrow (`.eyebrow-icon-row`, a new shared class). All nine widgets, plus `finance/page.js`'s own separate "Licensing" section heading, now carry one.

## 4. Admin role-gating (security-adjacent UX debt)

- ~~WBL-013 — The original Package 7 admin pages are now the last unfixed instance of a known gap.~~ **Fixed — Platform Review Wave 3.** All three pages now carry the same inline `decodeJwtPayload(token)?.role === 'admin'` check `admin/billing/usage/page.js` already had. This closes the last remaining instance of this gap anywhere in the app.

## 5. Customer Portal (`PortalContact`) — untouched by Wave 1

Wave 1 was scoped to `/portal/**` only. `/customer-portal/**` (Package O's separate identity plane, for an organisation's *own* external customers) is now visibly a generation behind.

- ~~WBL-014 — The customer-portal login page reads noticeably barer next to the refreshed one.~~ **Partially resolved.** The Forgot Password link was added by the Customer Experience & Commercial Readiness Wave (CX1). Platform Review Wave 3 aligned the eyebrow/title/lead copy tone with `/portal/login`'s own voice and gave `CustomerPortalNav.js` a real "Teracom AI" brand link (it had none at all). A Start Trial/Demo/Sales section and AI Concierge widget remain internal-`/portal`-only by design — a `PortalContact` is already a customer of an org with a live licence, not a prospect, so those CTAs don't apply to this identity plane the way WBL-017 might have implied.

- ~~WBL-015 — There is no password-recovery path for a `PortalContact` at all.~~ **Fixed — Customer Experience & Commercial Readiness Wave (CX1).** A dedicated `PortalContactPasswordResetToken` model, service, and `/customer-portal/{forgot-password,reset-password}` pages now exist, live-verified end to end. Email delivery of the raw token is still not real (see §6 below).

- **WBL-016 — `CustomerPortalNav.js` is flat, but that's probably fine.** **Confirmed, no change made — Platform Review Wave 3.** Still 7 links; grouping remains unwarranted by volume. Only change made to this component was adding the missing brand link (see WBL-014).

- **WBL-017 — The whole customer-portal surface predates the new stat-tile/icon visual language.** **Still open, scope decision made — Platform Review Wave 3 (ADR-025).** Copy tone was aligned (page titles, login copy — see WBL-014) but `PortalDashboardWidget.js`/`PortalDealsView`/`PortalSupportRequestList` were deliberately left on their existing list/table styling rather than retrofitted to the icon/stat-tile language — that's a bigger visual project than "no major architectural changes" was meant to cover in one wave, and is the natural scope for a dedicated future customer-portal visual pass.

## 6. Backend-side gaps that block future UX work

Carried forward from `[[current-sprint]]` / `[[project-state]]`, restated here specifically because they gate UX decisions above:

- ~~No email-sending capability exists anywhere in this backend.~~ **Partially resolved — CX1.** A real `EmailMessage`/`NotificationLog` foundation exists and is wired into welcome/password-reset/trial-lifecycle events on both identity planes, but no real provider is connected — every email is logged, not delivered. See [[current-sprint]] item 1a/13.
- ~~Nothing enforces `Organisation.trial_ends_at`.~~ **Fixed — CX1.** A real grace-period-then-Locked-Mode state machine now exists, plus a trial worker-count limit. See [[current-sprint]] item 1b.
- **`RenewalWizard.js`/`OwnershipTransferWizard.js` remain mock-only** (Package Q's own scope note) — now a more conspicuous inconsistency than before, since `WorkerPackWizard.js` sitting right next to them in the same Billing & Licensing section genuinely submits.
- **The whole Billing & Licensing section (Overview/Licence Details/Usage) still runs on `lib/licensing/referenceLicence.js`'s illustrative data** — the single largest remaining "looks real but isn't" surface in the product, increasingly conspicuous now that Worker Pack purchasing (Package Q) and trial signup (Wave 1) are both genuinely real elsewhere in the same app.

## 7. New findings — Platform Review Wave 3

- **WBL-018 — `icons.js`'s own `StatusDot` component was built in Wave 1 but never actually used anywhere.** Confirmed via `grep`: zero call sites before this wave. **Fixed** — now wired into `WorkerCard.js` and `ChatWorkerCard.js` (generalised to also treat `"active"` as the "ok" state, not just `"operational"`).
- **WBL-019 — The dashboard had no path to roughly two-thirds of the product.** `/portal/dashboard` only ever surfaced Workers/Knowledge/Chat/Memory stats (Package 2's original four) plus Organisation Summary and three activity feeds — Departments, Orchestration, Marketplace, Sales, Customer Success, Finance, Operations, Marketing, Media Centre, Federation, Support, and Platform Health were only reachable via `PortalNav.js`'s own dropdowns, never from the page every user lands on first. **Fixed** — a new `DashboardQuickLinks.js` section ("Explore your workspace") lists every non-admin-gated section, grouped the same way the nav itself is grouped.
- **WBL-020 — Two separate, unrelated features are both named "Orchestration" in source.** `components/portal/OrchestrationHistory.js` (Phase 0 Package F — a worker's own consultation history, shown inside Chat) predates and is unrelated to the CTO-delegation page renamed "Orchestration" in Wave 1. No user-facing string collision exists (its own copy says "consultations", not "Orchestration"), so this is a source-naming note for future engineering hygiene, not a UX fix — left as-is this wave.
- **WBL-021 — `login/page.js`'s post-login redirect defaulted to the now-retired bare `/portal` page.** Fixed alongside WBL-002 — now defaults straight to `/portal/dashboard`, avoiding an unnecessary extra redirect hop through the page that no longer renders its own content.

## 8. Suggested prioritisation for the next wave

**Resolved this wave:** WBL-001 through WBL-005, WBL-007 through WBL-011, WBL-013 through WBL-016 (confirm-only), WBL-018, WBL-019, WBL-021. See `PACKAGE_WAVE3_DIGITAL_WORKSPACE_COMPLETION_IMPLEMENTATION_REPORT.md` and ADR-025 for full detail.

**Needs a design/product decision before implementation:** WBL-006 (promote Marketing Production to its own view?), WBL-017 (a dedicated customer-portal visual pass — bring `PortalDashboardWidget`/`PortalDealsView`/`PortalSupportRequestList` in line with the icon/stat-tile language), WBL-020 (rename `OrchestrationHistory.js` for source-level clarity — no user-facing urgency).

**Backend-gated, unrelated to frontend work:** the Billing & Licensing section's illustrative data (§6) and `RenewalWizard.js`/`OwnershipTransferWizard.js` remaining mock-only both depend on the still-unbuilt commercial billing backend, not on any frontend decision.
