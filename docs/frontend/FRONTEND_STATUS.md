# Frontend Status

**Last verified:** 2026-08-15, directly against the filesystem (`find`, `package.json`, `git log`) in `teracom-ai-frontend`. Package 3 row re-verified later the same day after new files were found on disk, then again after Package 3 shipped (routes/nav/proxy wired, full gate re-run, end-to-end smoke test against a live backend). Package 4 (Knowledge) verified the same way after shipping. Package 5 (Chat) verified the same way, including a real (non-mocked) Ollama completion during smoke testing. Package 6 (Memory) verified the same way, including a real auto-memory capture triggered by an actual chat message. Package 7 (Administration) verified the same way, including a live-reproduced backend bug confirmed directly against Postgres. Package 8 (Connectors) verified the same way, confirming the backend's connector responses are hardcoded and identical across every organisation and role. Package 9 (Billing & Licensing) verified the same way — confirmed the backend has zero billing/licensing support at all — and its smoke test found and fixed a real information-exposure bug (see `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §9).

This is a living snapshot — update the table below in the same change that ships or removes a package. For the full technical design these packages implement, see [[frontend-architecture]]. For sequencing of what's next, see [[roadmap]].

**Correction (2026-08-21, Website/Application Separation Phase 4 + repository-audit cleanup):** the "Stack," "off-limits to redesign," and "known unused asset" sections below described the pre-split combined app (this repo serving both the marketing/commerce website and the product portal). Phase 4 moved every website/commerce file — `Header.js`, `Footer.js`, `ExpertisePartners.js`, `CheckoutButton.js`, `app/(marketing)/**` (`/`, `/securityos-ai`, `/store`, `/checkout/*`), `stripe`/`zoho` — to a new repository, `teracom-solutions-website`. Those three sections are corrected below to reflect that; **the package-by-package table, test/build health numbers, and "Last verified" date above are NOT corrected here** — they were already stale before Phase 4 (last updated at Package 9, 2026-08-15; this repo has since had many more packages, waves, and 314 tests, not 90) and bringing that table current is a larger, separate documentation task, not something this cleanup pass attempted.

**Further correction (2026-08-22, `UI_DECOUPLING_PLAN_V1.md`):** the "Stack" section's styling description below is now also stale. The shared `@teracoms/ui` package described there has been dissolved; this repo owns its own `app/globals.css` outright, with no cross-repository dependency.

---

## Stack, as it exists today

- **Next.js 14.2.35** (App Router), **React 18.3.1**, plain JavaScript (`tsconfig.json`/`typescript` dependency present but unused — every file is `.js`, `allowJs: true`, `strict: false`).
- No UI framework or component library. No CSS-in-JS. Styling comes from the shared `@teracoms/ui` package (`app/(product)/layout.js` imports `@teracoms/ui/globals.css`; a local `app/globals.css` existed pre-Phase-4 and no longer does) using CSS custom properties.
- No client-state library (no Redux/Zustand), no data-fetching library (no SWR/React Query) — data fetching is plain `fetch` in Server Components/Route Handlers.
- Test runner: Node's native `node --test` (added in Package 1; required `"type": "module"` in `package.json`).
- Lint: `eslint` + `eslint-config-next` (added in Package 1; no lint config existed before).
- Dependencies otherwise: none beyond Next/React/`@teracoms/ui` and editor-tooling-only `typescript`/`@types/*` — `stripe`/`zod` were dropped in Phase 4 along with the commerce code that used them.

## Package-by-package status

| # | Package | Status | Key modules |
|---|---|---|---|
| 1 | Authentication | ✅ Shipped, validated | `lib/api/{auth,client,jwt,validation,constants}.js`, `middleware.js`, `app/api/auth/*`, `app/portal/(public)/login/`, `app/portal/(protected)/layout.js`, `components/portal/{AuthProvider,LoginForm,AccountSummary}.js` |
| 2 | Dashboard | ✅ Shipped, validated | `lib/api/{dashboard,results}.js`, `app/portal/(protected)/dashboard/*`, `components/portal/{StatTile,EmptyState,ActivitySection,OrganisationSummaryCard,PortalNav}.js` |
| 3 | Workers | ✅ Shipped, validated | `lib/api/workers.js` (9 functions, 9 passing unit tests), `app/portal/(protected)/workers/*` (list, create, detail), `app/api/portal/workers/*` (BFF proxy), `components/portal/{WorkerCard,WorkerListView,CreateWorkerForm,WorkerKnowledgeAssignment,EditWorkerForm}.js` |
| 4 | Knowledge | ✅ Shipped, validated | `lib/api/knowledge.js` (10 functions), `app/portal/(protected)/knowledge/*` (list, upload, detail), `app/api/portal/knowledge/*` (BFF proxy, incl. multipart upload), `components/portal/{KnowledgeCard,KnowledgeListView,KnowledgeSearch,UploadKnowledgeForm,DocumentActions,KnowledgeAssignedWorkers}.js` |
| 5 | Chat | ✅ Shipped, validated | `lib/api/chat.js` (4 functions), `app/portal/(protected)/chat/*` (worker picker, live chat, session detail), `app/api/portal/chat/*` (BFF proxy), `components/portal/{ChatWorkerCard,ChatThread,ChatComposer,ChatSessionStarter,ChatInterface}.js` |
| 6 | Memory | ✅ Shipped, validated | `lib/api/memory.js` (2 functions), `app/portal/(protected)/memory/*` (overview, per-worker view, detail), `app/api/portal/memory/route.js` (BFF proxy), `components/portal/{MemoryListItem,MemoryOverviewView,AddMemoryForm}.js` |
| 7 | Administration | ✅ Shipped, validated | `lib/api/admin.js` (4 functions), `app/portal/(protected)/admin/*` (layout gate, landing, users, organisation, permissions), `app/api/portal/admin/*` (BFF proxy), `components/portal/{CreateUserForm,UserListView,PermissionMatrix}.js` |
| 8 | Connectors "coming soon" | ✅ Shipped, validated | `lib/api/connectors.js` (1 function), `app/portal/(protected)/knowledge/connectors/*`, `components/portal/ConnectorCard.js` |
| 9 | Billing & Licensing | 🟡 Frontend UX scaffold shipped, validated — **not a real licensing system** (backend has zero support, see §3 of the report) | `lib/licensing/referenceLicence.js`, `app/portal/(protected)/admin/billing/*` (Overview/Grace/Locked, Licence Details, Usage & Capacity, 3 wizards, Requests & History), `components/portal/{WizardShell,BillingNav,CapacityMeter,RenewalWizard,WorkerPackWizard,OwnershipTransferWizard}.js` |

Detailed evidence and reasoning behind this table: [[project-state]] §2. Full package reports: `docs/frontend/IMPLEMENTATION_REPORTS/AUTHENTICATION_IMPLEMENTATION_REPORT.md`, `.../DASHBOARD_IMPLEMENTATION_REPORT.md`, `.../WORKERS_IMPLEMENTATION_REPORT.md`, `.../KNOWLEDGE_IMPLEMENTATION_REPORT.md`, `.../CHAT_IMPLEMENTATION_REPORT.md`, `.../MEMORY_IMPLEMENTATION_REPORT.md`, `.../ADMIN_IMPLEMENTATION_REPORT.md`, `.../CONNECTORS_IMPLEMENTATION_REPORT.md`, and `.../BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md`.

## Test/build health (as of last validation, Package 9)

```
npm run build   → ✓ Compiled successfully, 45 routes, no errors
npm run lint    → ✔ No ESLint warnings or errors
npm test        → ℹ tests 90, pass 90, fail 0
```

Re-run all three from a clean state (`rm -rf .next`) before trusting this. This table reflects Package 9's own validation, which also re-ran the full gate — see `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §11 for the end-to-end smoke test performed against a live backend (admin + non-admin accounts), and §9 for a real information-exposure bug found live during that testing (a non-admin's raw HTTP response contained an unreferenced, real-data copy of an admin-gated page's content, despite the visible page being correct) and fixed before this package was reported complete.

## What's explicitly unchanged and off-limits to redesign

Per ADR-001 in [[architecture-decisions]], as it applied before Phase 4: `/`, `/securityos-ai`, `/store`, `/checkout/success`, `/checkout/cancel`, `app/layout.js`, `components/Header.js`, `components/Footer.js`, and every existing rule in `app/globals.css`. **None of those routes/files exist in this repo anymore** — they moved to `teracom-solutions-website` in Phase 4, along with ADR-001's original scope. This section is kept for historical context (why the old marketing UI was hands-off) rather than deleted; it no longer describes anything reachable from this repo. New work is additive under `/portal/**` with its own nested layout and, so far, purely additive CSS.

## Known unused asset

**No longer applicable to this repo — `components/ExpertisePartners.js` moved to `teracom-solutions-website` in Phase 4** along with the rest of the marketing UI. Confirmed still unimported there too (`grep` against that repo's `app/`, 2026-08-21) — the original finding below still holds, just in the other repo now. Original note, kept for historical context: it existed, was fully built (real logos, links, error fallback), and was not imported anywhere in the app. See [[changelog]] 2026-08-14 entry — it survived a revert of related styling work.
