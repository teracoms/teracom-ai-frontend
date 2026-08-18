# Platform Review Wave 3: Digital Workspace Completion — Implementation Report

**Date:** 2026-08-18 · **Type:** Frontend-only (`teracom-ai-frontend`) — no backend changes, no new dependencies · **Scope:** 15 review-and-improve objectives across the authenticated `/portal` and `/customer-portal` surfaces, plus a branding reposition, built directly on `TERACOM_REVIEW_BACKLOG.md`'s own findings from Wave 1 rather than a fresh walkthrough. See ADR-025 for the design decisions behind the choices below.

---

## 1. Screenshots

The brief asked for before/after screenshots where practical. No browser tool is connected in this environment (the Claude in Chrome extension isn't set up) and this project has no Playwright/Puppeteer dependency, so real screenshot images aren't possible here. This was surfaced to the user as an explicit question before any implementation began; the confirmed alternative — text/HTML diffs — is used throughout this report instead (see each section's "Before → After" copy blocks and the live-verification `curl` output in §8).

## 2. Branding

- **Teracom AI is already the primary workspace identity** (`PortalNav.js`'s brand link has read "Teracom AI" since Wave 1) — no change needed there. **New this wave:** `CustomerPortalNav.js` had no brand link at all; it now has the identical "Teracom AI" link, closing a real, concrete branding gap on the customer-facing nav.
- **SecurityOS as specialist product, not primary identity:** the only pre-existing in-workspace reference (`AiConciergePlaceholder.js`'s FAQ: *"SecurityOS is a Teracom AI product..."*) already matched this framing; left unchanged.
- **Product family hierarchy preserved and given a new home:** the Marketplace page — where an organisation actually browses Teracom-curated products — now ends with the same `.mini-services` treatment the marketing homepage uses (UX2): `SecurityOS — available now`, `FinanceOS — coming soon`, `OperationsOS — coming soon`, `ElectricalOS — coming soon`.

## 3. Objectives 1–6: per-section review findings and fixes

- **Workers (#1) / worker visualisation (#9):** `WorkerCard.js` and `ChatWorkerCard.js` (used by the Workers list and the Chat worker-picker respectively) previously showed only a plain text badge for status. Both now show a `WorkersIcon` plus a real `StatusDot` (green/red) next to the status text. `StatusDot` itself was built in Wave 1 but — confirmed via `grep` — never actually used anywhere until now; it was also generalised to treat `"active"` (the real worker-status value) as the "ok" state, not just the literal string `"operational"` it originally checked for.
- **Knowledge (#2):** all three of its `StatTile`s (Total Documents, Knowledge Growth, Worker Assignments) and the Upload page's own tile now carry icons; the Connectors page's empty-state description no longer names the backend by its internal repo name (`teracom-ai-backend` → "Teracom AI").
- **Chat (#3):** `ChatWorkerCard.js` — see worker visualisation above; its Messages stat tile now carries a `ChatIcon`.
- **Marketplace (#4):** fixed the one `EmptyState` title in the entire app with a stray trailing period; added the product-family section (§2).
- **Orchestration (#5):** two leftover "CTO" references from before Wave 1's rename were found and fixed — `CtoOrchestrationPanel.js`'s eyebrow ("Autonomous CTO" → "Orchestration") and body copy ("The CTO worker" → "The lead worker"), and `CtoExecutionHistory.js`'s empty-state title ("No CTO task executions yet" → "No Orchestration executions yet"). The page's own hero eyebrow also duplicated the Start Trial page's "Teracom AI Workforce" text; changed to "Orchestration" to match the rest of the same page.
- **Department dashboards (#6):** reviewed directly; `DepartmentDashboard.js`'s own worker/department-head lists already use the plain list pattern this wave's ADR-025 confirmed as intentional (see §5), and the summary widgets it renders (Finance/Operations/Marketing/Federation) all picked up the icon treatment below. No further changes judged necessary.

## 4. Objective 7: workspace navigation

`PortalNav.js` had two real, confirmed bugs (`TERACOM_REVIEW_BACKLOG.md` WBL-007/WBL-008), both fixed:

- **Dropdowns didn't always close.** `TOP_LEVEL_LINKS` (Dashboard, Onboarding) had no `onClick` of their own — clicking "Dashboard" while already on `/portal/dashboard` with a dropdown open did nothing, since the `pathname`-keyed `useEffect` that closes menus never fired. Every top-level link and every dropdown menu item now carries an explicit `onClick` that closes all menus directly.
- **The dropdowns fell short of the standard WAI-ARIA menu-button pattern.** Before: `aria-expanded`/`aria-haspopup` existed but there was no `aria-controls`, no focus movement into the dropdown on open, no focus return on close, and no arrow-key navigation despite `role="menu"`/`role="menuitem"` markup implying it. After: each dropdown has a real `id` wired to its trigger's `aria-controls`; opening a dropdown moves focus to its first `menuitem`; Escape (or selecting a link) closes the dropdown and returns focus to the button that opened it; ArrowUp/ArrowDown/Home/End navigate between items.

## 5. Objectives 8, 12, 15: dashboard hierarchy, executive dashboards, platform-wide consistency

- **One canonical landing page, not two.** The root `/portal` "Overview" page (Package 2 era) had drifted stale twice now — most recently still claiming *"Billing is being rolled out in an upcoming release"* long after Billing shipped, with a feature-grid that only ever listed six of the product's ~20 sections. Rather than update its copy a third time, `/portal` now `redirect()`s straight to `/portal/dashboard`. `login/page.js`'s own post-login default target was updated to match (`/portal` → `/portal/dashboard`), avoiding an extra redirect hop. `AccountSummary.js`, the retired page's only remaining consumer, was deleted as confirmed-orphaned dead code (verified zero other references first).
- **Executive/summary widget family (WBL-012):** `FinanceSummaryWidget`, `OperationsSummaryWidget`, `MarketingSummaryWidget`, `FederationSummaryWidget`, `PipelineSummaryWidget`, `PlatformHealthSummaryWidget`, `CustomerHealthWidget`, and `finance/page.js`'s own separate Licensing section heading all gained a small icon next to their eyebrow via one new shared class (`.eyebrow-icon-row`) — a scoped decision (keep the list layout, add the icon language) documented in ADR-025 rather than a full card-grid retrofit.
- **Every remaining bare `StatTile`/`CapacityMeter` call site now has an icon.** Two new icons were added to `icons.js` for cases nothing existing fit: `BillingIcon` (Billing tier/status/Finance's Licensing heading) and `PermissionIcon` (Admin's Permission Grants tile). `CapacityMeter.js` gained its own optional `icon` prop (same additive pattern `StatTile` already used), wired into all three of its call sites on the Usage & Capacity page. Three further icons (`MegaphoneIcon`, `FunnelIcon`, `PulseIcon`) were added for Marketing/Sales-Pipeline/Platform-Health's own widget headings — five new icons in total, all in the existing self-authored inline-SVG style (no new icon-library dependency).
- **Admin role-gating consistency (WBL-013):** `admin/users/page.js`, `admin/organisation/page.js`, and `admin/permissions/page.js` were the last three admin pages missing the inline `decodeJwtPayload(token)?.role === 'admin'` check every other admin page (`admin/billing/usage/page.js`, `platform-health/page.js`) already had — the parent layout's role gate stops the *rendered* output for a non-admin, but Next.js still executes a child page's own data fetch regardless. All three now carry the same check, closing the last remaining instance of this gap in the app.

## 6. Objective 10, 11: onboarding and empty states

- **Onboarding checklist:** `OrganisationOnboardingChecklist.js`'s zero-tasks state was a bare `<p>`, not the shared `EmptyState` component every other list in the app uses — fixed. Added a lightweight `"N of M steps complete"` progress line above the task list (a real, if small, orientation improvement for objective #10, computed client-side from the same `tasks` prop already passed in — no new data fetch).
- **Empty states, full sweep:** every `EmptyState` call site in the app (~40) was reviewed for tone and punctuation consistency. Two real inconsistencies were found and fixed (Marketplace's stray trailing period, the Knowledge Connectors page naming the backend by its internal repo name) — everything else was already consistent.

## 7. Objectives 13, 14: customer-facing dashboards and platform discoverability

- **Customer Portal tone alignment:** all 11 `app/customer-portal/**` page titles were standardised to `"X | Teracom AI Customer Portal"` (several still said just `"X | Customer Portal"`, and one — after this wave's own first edit — briefly said only the login page's title differently, which would have made the inconsistency worse rather than better; caught and fixed before finishing). The login page's eyebrow and lead copy were rewritten to match `/portal/login`'s own voice. A Start Trial/Demo/Sales section and the AI Concierge widget were deliberately not added here — a `PortalContact` is already a paying customer's own user, not a prospect (see ADR-025).
- **Platform discoverability — the dashboard's own biggest gap.** `/portal/dashboard` only ever surfaced Workers/Knowledge/Chat/Memory (Package 2's original four stats) plus Organisation Summary and three activity feeds. Departments, Orchestration, Marketplace, Sales, Customer Success, Finance, Operations, Marketing, Media Centre, Federation, Support, and Platform Health were reachable only via `PortalNav.js`'s own dropdowns — never from the one page every user lands on first. A new `DashboardQuickLinks.js` component ("Explore your workspace") now lists every one of those sections, grouped identically to the nav's own Workforce/Business/Marketing/Platform groups, using the existing `.mini-services` pill styling (no new visual language). Deliberately excludes admin-only links (Billing, Administration, Governance) — those stay nav-only, avoiding the need for a role check on what is otherwise a purely static, presentational list.

## 8. Live verification

A throwaway trial organisation, worker, and `PortalContact` account were created against the real running `teracom-backend.service`/`teracom-frontend.service` (not `TestClient`, not a mock) to verify the above, then fully deleted from the database afterward:

- Bare `/portal` (authenticated) → `307` to `/portal/dashboard`, confirmed via `Location` header.
- Dashboard renders "Explore your workspace" / "Everything available to your organisation" and at least one `.mini-services` group.
- Marketplace renders "Every pack here runs on Teracom AI" and all four product-family pills.
- Orchestration page (`/portal/cto`) confirmed clean of any "CTO"/"Autonomous CTO" string; confirmed "No Orchestration executions yet" and the "Orchestration" eyebrow both present.
- Nav markup confirmed `aria-controls="portal-nav-dropdown-{Workforce,Business,Marketing,Platform}"` and `role="menu"` present on the rendered dashboard page.
- A real worker created via the backend API renders on `/portal/workers` with `worker-card-header` and `status-dot ok` both present in the live HTML.
- A real `PortalContact` login confirmed `CustomerPortalNav.js` now renders `portal-nav-brand">Teracom AI</a>`.
- `admin/users` (as a real admin session) still returns `200` with the new inline role check in place — confirms the fix didn't break the legitimate admin path.

## 9. Final validation

- **Backend:** no changes made this wave; not re-run (frontend-only wave, per the brief).
- **Frontend:** `npm run lint` — zero warnings. `npm test` — 296/296 passing (unchanged; no `lib/api/*` logic was touched). `npm run build` — clean from a fresh `.next`, followed immediately by a `teracom-frontend.service` restart and the live checks in §8 (per ADR-024's own lesson from the Customer Experience Wave — restart immediately after every rebuild, verify live, don't trust a green build alone).

## 10. Explicitly not done

- **A dedicated customer-portal visual pass** (`PortalDashboardWidget.js`, `PortalDealsView`, `PortalSupportRequestList` remain on their pre-existing list/table styling, not the icon/stat-tile language) — scoped out as a bigger, dedicated project than "no major architectural changes" was meant to cover in one wave (ADR-025, `TERACOM_REVIEW_BACKLOG.md` WBL-017).
- **Promoting Marketing's "Production" queue to its own page/nav entry** (WBL-006) — still an open product decision, not touched this wave.
- **Renaming `OrchestrationHistory.js`** (a real, unrelated worker-consultation-history component whose name coincidentally collides with the renamed Orchestration nav page) — a source-naming note only; no user-facing string collision exists, so left as-is (WBL-020).
- **Any backend change** — this was a frontend-focused wave per the brief; no backend files were touched.
- **Real screenshots** — see §1.

## 11. Governance updates

`TERACOM_REVIEW_BACKLOG.md` updated in place: WBL-001 through WBL-005, WBL-007 through WBL-011, WBL-013, and WBL-015 struck through and annotated as fixed; WBL-014 annotated as partially resolved; WBL-016 confirmed with no change; WBL-017 given an explicit scope decision; four new findings appended (WBL-018 through WBL-021). See ADR-025 for the design reasoning and `CURRENT_SPRINT.md`/`CHANGELOG.md` for the standard package-level entries.
