# Teracom Review Backlog

**As of:** 2026-08-19
**Purpose:** a living backlog of UX/branding/navigation findings for future review waves, seeded after Platform Review Wave 1 shipped (see `PLATFORM_REVIEW_WAVE_1_UX_BRANDING_AND_NAVIGATION_REFRESH_IMPLEMENTATION_REPORT.md`). Findings below come from a post-Wave-1 portal walkthrough plus a targeted codebase sweep — not from guessing what *might* be wrong. Each item cites the exact file(s) it was found in.
**Convention:** append new findings with a new `WBL-NNN` id, in the relevant section, rather than editing existing ids — the same append-only discipline `[[project-state]]`'s risk list uses. Strike through (`~~...~~`) and annotate an item once a future wave actually resolves it; don't delete it.
**Not yet implemented:** every item below is a finding, not a plan. No code changes were made while compiling this document.

---

## 1. Branding & copy consistency

- **WBL-001 — "CTO" branding survives inside the renamed Orchestration page's own child components.** The page itself (`app/portal/(protected)/cto/page.js`) was fully renamed to "Orchestration" in Wave 1, but two components it renders were not: `components/portal/CtoOrchestrationPanel.js:115` still shows `<p className="eyebrow">Autonomous CTO</p>`, and line 117 reads *"Submit a high-level objective. The CTO worker below may decompose it and delegate across..."*; `components/portal/CtoExecutionHistory.js:16` has an `EmptyState` titled `"No CTO task executions yet"`. A visitor sees "Orchestration" in the nav and hero, then "CTO" twice more scrolling down the same page. **Quick win.**

- **WBL-002 — The root `/portal` "Overview" page has stale copy and an incomplete feature list.** `app/portal/(protected)/page.js:19` still says *"...are ready below — Billing is being rolled out in an upcoming release."* Billing (`/portal/admin/billing/**`) has had five real subpages since Package 9. The same page's feature-grid also has no card at all for Billing or Platform Health, only Dashboard/Workers/Knowledge/Chat/Memory/Administration. This page is no longer linked from the main nav (Wave 1 dropped it as redundant), but it's still the default post-login landing target and reachable by URL — worth fixing regardless. **Quick win.**

- **WBL-003 — One `EmptyState` title breaks the app's own punctuation convention.** `app/portal/(protected)/marketplace/page.js:110` — `title="No packs published yet."` is the only `EmptyState` title anywhere in the app with a trailing period; every other one of ~35 call sites omits it. **Quick win.**

- **WBL-004 — An internal service name leaks into user-facing copy.** `app/portal/(protected)/knowledge/connectors/page.js:83` — `description="teracom-ai-backend has no connector status to report right now."` No other empty-state or error message anywhere else in the app names the backend by its repo name; every other one speaks in plain product language. **Quick win.**

- **WBL-005 — Two unrelated flows share the same eyebrow text.** The Orchestration page (`app/portal/(protected)/cto/page.js`) and the new Start Trial page (`app/portal/(public)/start-trial/page.js`) both use the eyebrow "Teracom AI Workforce". Not a bug, but worth a naming pass so the two don't read as the same feature to someone skimming.

## 2. Navigation & information architecture

- **WBL-006 — Marketing "Production" has no entry point at all.** Confirmed by reading `app/portal/(protected)/marketing/[campaignId]/page.js` and its `ContentPiecePanel.js`/`VideoAssetPanel.js`: the sections are literally headed "Content production." and "Video production.", with per-item admin approve/reject buttons — but there is no cross-campaign queue. An admin has to open every campaign individually to find anything awaiting approval. `PortalNav.js`'s own comment already documents this as a deliberate Wave 1 omission (no dead link), which was the right call for that wave — but a future wave should decide between promoting this to its own page/nav entry, or at minimum adding a pending-approval count/badge somewhere visible.

- **WBL-007 — The new nav dropdown doesn't always close itself.** In `components/portal/PortalNav.js`, dropdowns close via a `useEffect` keyed on `pathname` — but `TOP_LEVEL_LINKS` (Dashboard, Onboarding) have no direct `onClick` handler of their own. If you're already on `/portal/dashboard`, open a dropdown, then click "Dashboard" again, the pathname doesn't change and the dropdown stays open (the link itself is inside `navRef`, so the click-outside handler doesn't fire either). Minor, but a real interaction bug.

- **WBL-008 — The new dropdown menus fall short of the standard WAI-ARIA menu-button pattern.** Group toggle buttons have `aria-expanded`/`aria-haspopup="true"`, but the dropdown `<div>` has no `id` for an `aria-controls` reference; opening a dropdown doesn't move focus into it; Escape closes it but doesn't return focus to the trigger button; and there's no arrow-key navigation between `role="menuitem"` links despite the `role="menu"` markup implying it. The mobile hamburger toggle itself is fine (`aria-label`, `aria-expanded`). Worth a real accessibility pass before this nav is considered done, not just functional.

## 3. Visual consistency (cards, icons, stat tiles)

Wave 1's new icon set (`components/portal/icons.js`) and card/badge treatment were applied to exactly three surfaces: the dashboard's four stat tiles, `OrganisationSummaryCard.js`, and the new `SystemMetricsPanel.js`. Everything else still looks exactly as it did before Wave 1.

- **WBL-009 — Every other `StatTile` user has no icon.** `StatTile` now accepts an optional `icon` prop, but it's unused outside the dashboard. Confirmed direct `<StatTile>` callers still icon-less: `app/portal/(protected)/knowledge/page.js` (Total Documents, Knowledge Growth, Worker Assignments — `KnowledgeIcon` fits directly), `knowledge/upload/page.js` (Documents uploaded), `memory/page.js` (Total Memories — `MemoryIcon`), `chat/[workerId]/[sessionId]/page.js` (Messages — `ChatIcon`), `workers/[workerId]/page.js` (Knowledge/Memories/Chat sessions/assignments — existing icons cover all of these), and `admin/page.js` (Total Users, Permission Grants — `OrganisationIcon` fits Users; Permission Grants has no existing icon and would need a new one).

- **WBL-010 — Billing's own stat tiles need new icons that don't exist yet.** `admin/billing/page.js` shows Tier/Hosting Model/Licence Status/Expiry Date — none of the current nine icons fit well; this needs at least a `BillingIcon`, paired with the existing `ClockIcon` for expiry.

- **WBL-011 — `admin/billing/usage/page.js` doesn't use `StatTile` at all.** It renders a `CapacityMeter` component instead — an icon prop won't reach it; this page needs its own visual-consistency pass, not just the same icon rollout as everything else.

- **WBL-012 — A whole family of summary widgets never got any Wave 1 treatment.** `FinanceSummaryWidget.js`, `OperationsSummaryWidget.js`, `MarketingSummaryWidget.js`, `FederationSummaryWidget.js`, `CtoExecutionHistory.js`, `PipelineSummaryWidget.js`, `PlatformHealthSummaryWidget.js`, `CustomerHealthWidget.js`, and `LicensingSummaryCard.js` all use a plain `section-heading` + `activity-list`/`activity-title`/`activity-meta` pattern, appearing on the Finance, Operations, Orchestration, and Federation pages, plus inside `DepartmentDashboard.js`. This needs a decision before any icon work starts: retrofit this whole family into the stat-tile/card grid Wave 1 established, or treat "list" as an intentionally distinct, permanent pattern for this kind of content. Doing icon work on the smaller items (WBL-009/010) without deciding this first risks two competing visual languages coexisting indefinitely.

## 4. Admin role-gating (security-adjacent UX debt)

- **WBL-013 — The original Package 7 admin pages are now the last unfixed instance of a known gap.** Confirmed directly: `app/portal/(protected)/admin/users/page.js`, `admin/organisation/page.js`, and `admin/permissions/page.js` still only check for token *presence* before fetching — no inline `decodeJwtPayload(token)?.role === 'admin'` check the way `platform-health/page.js` now has (added this wave for its own new System Resources section) and Package 9/H's own pages already had. The parent `admin/layout.js`'s role gate stops the *rendered output*, but Next.js still executes the child Server Component's own data fetch regardless — a real (if low-severity, own-org-scoped) wasted call for every non-admin who lands here. This is the same item already tracked in `[[current-sprint]]`'s Active Work list; flagged here again because Wave 1's own platform-health fix makes these three pages the last remaining instance in the entire app.

## 5. Customer Portal (`PortalContact`) — untouched by Wave 1

Wave 1 was scoped to `/portal/**` only. `/customer-portal/**` (Package O's separate identity plane, for an organisation's *own* external customers) is now visibly a generation behind.

- **WBL-014 — The customer-portal login page reads noticeably barer next to the refreshed one.** `app/customer-portal/(public)/login/page.js`: eyebrow "Customer Portal", `<h1>Sign in to your account.</h1>`, lead "View your proposals, projects, and support requests." — no Forgot Password link, no Start Trial/Demo/Sales section, no concierge placeholder, plain `<title>Sign In | Customer Portal</title>`. None of this is wrong, but side-by-side with `/portal/login`'s new copy and sections it reads unfinished.

- **WBL-015 — There is no password-recovery path for a `PortalContact` at all.** No forgot-password/reset-password page exists under `app/customer-portal/`, and no matching API route exists either — the new `PasswordResetToken` mechanism this wave built is wired to internal users (`User`) only. Combined with the standing "no email-sending capability" gap, a `PortalContact` who forgets their password today has zero self-service recourse; an admin must intervene, same as before this wave. A future pass should decide whether to extend `PasswordResetToken` to cover `PortalContact` too (same mechanism, different identity table) once email delivery exists.

- **WBL-016 — `CustomerPortalNav.js` is flat, but that's probably fine.** Only 7 links (Dashboard, Proposals & Contracts, Onboarding, Projects, Support, Communications, Knowledge) — well under the ~19 that made `/portal`'s old nav feel crowded. Grouping isn't obviously warranted by volume; flagged here so a future wave doesn't restructure it reflexively just because the sibling nav got grouped.

- **WBL-017 — The whole customer-portal surface predates the new stat-tile/icon visual language.** Sampled `PortalDashboardWidget.js` (renders counts as a plain `<ul className="activity-list">`, no cards, no icons), plus the Deals and Support pages (`PortalDealsView`, `PortalSupportRequestList` — generic list/table styling, no new visual language). No leftover "SecurityOS" branding was found here (copy is neutral, not wrong) — but the voice doesn't match the newly-refreshed "Teracom AI Portal"/"Teracom AI Workforce" tone used elsewhere, and the visual structure is a full generation behind `/portal`'s own dashboard now.

## 6. Backend-side gaps that block future UX work

Carried forward from `[[current-sprint]]` / `[[project-state]]`, restated here specifically because they gate UX decisions above:

- **No email-sending capability exists anywhere in this backend** — blocks both WBL-015 (PortalContact recovery) and fully closing the password-reset loop this wave started for internal users.
- **Nothing enforces `Organisation.trial_ends_at`** — there is no designed "trial expired" UX state yet (locked, grace period, forced downgrade are all undecided); the dashboard only shows a countdown today.
- **`RenewalWizard.js`/`OwnershipTransferWizard.js` remain mock-only** (Package Q's own scope note) — now a more conspicuous inconsistency than before, since `WorkerPackWizard.js` sitting right next to them in the same Billing & Licensing section genuinely submits.
- **The whole Billing & Licensing section (Overview/Licence Details/Usage) still runs on `lib/licensing/referenceLicence.js`'s illustrative data** — the single largest remaining "looks real but isn't" surface in the product, increasingly conspicuous now that Worker Pack purchasing (Package Q) and trial signup (Wave 1) are both genuinely real elsewhere in the same app.

## 7. Suggested prioritisation for the next wave

**Quick wins (small, isolated, no design decision needed):** WBL-001, WBL-002, WBL-003, WBL-004, WBL-007, WBL-008.

**Medium (real work, no open design question):** WBL-009, WBL-010, WBL-013, WBL-014, WBL-016 (confirm-only, likely no change needed).

**Needs a design/product decision before implementation:** WBL-006 (promote Production to its own view?), WBL-011 (CapacityMeter's own visual pass), WBL-012 (retrofit the whole widget-list family or leave it?), WBL-015 (extend password reset to PortalContact — depends on the email-capability gap first), WBL-017 (how far to bring customer-portal in line with `/portal`, and on what timeline).
