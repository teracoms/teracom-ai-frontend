// Plain data, deliberately its own module rather than living inside
// PortalNav.js (a 'use client' component) — UI_IMPLEMENTATION_SPRINT_1.md
// item 5's per-section sub-nav components (WorkforceNav.js, MarketingNav.js,
// PlatformSectionNav.js) are rendered from Server Components, and importing
// any export from a 'use client' file turns every one of its exports into a
// client-boundary reference, even a plain array — calling .find() on it from
// server code throws ("Attempted to call find() from the server but find is
// on the client"). Keeping this data in its own client-free module is the
// fix, and it also means PortalNav.js and the sub-nav components share this
// exact link list rather than maintaining a second, driftable copy of it.
//
// CUSTOMER_PLATFORM_UX_REVIEW_V1 -- a single ordered list of top-level nav
// entries (plain links interleaved with dropdown groups, `kind` tells
// PortalNav.js which to render), replacing the previous "every plain link
// first, then every dropdown group" two-pass layout. That structure could
// only ever put dropdown groups after every plain link; Workforce moving to
// sit directly after Dashboard (this workstream's own explicit requirement)
// needs a single ordered sequence instead.
export const NAV_ITEMS = [
  { kind: 'link', href: '/portal/dashboard', label: 'Dashboard' },
  {
    kind: 'group',
    label: 'Workforce',
    links: [
      { href: '/portal/digital-workforce', label: 'Digital Workforce' },
      { href: '/portal/workers', label: 'Workers' },
      { href: '/portal/workers/pools', label: 'Worker Pools' },
      { href: '/portal/knowledge', label: 'Knowledge' },
      { href: '/portal/chat', label: 'Chat' },
      { href: '/portal/memory', label: 'Memory' },
      { href: '/portal/departments', label: 'Departments' },
      { href: '/portal/tasks', label: 'Tasks' },
      // Phase 0 Package PQR shipped this as "/portal/cto", labelled
      // "CTO Orchestration" — renamed here per direct instruction; the
      // route itself is unchanged (preserves every existing link/
      // bookmark to it).
      { href: '/portal/cto', label: 'Orchestration' },
      { href: '/portal/marketplace', label: 'Marketplace' },
      // NAVIGATION_REVIEW_V1.md §3 -- moved from Platform. Federation is a
      // real Worker capability (Package L: worker-to-federation
      // consultation, extending CTO Orchestration's own delegation
      // mechanism), not a platform-support function like Health/
      // Documentation -- it belongs next to Orchestration, not three
      // menu-levels away from it.
      { href: '/portal/federation', label: 'Federation' },
    ],
  },
  { kind: 'link', href: '/portal/onboarding', label: 'Onboarding' },
  // Product Experience Review V1 / WORKFLOW_WIZARD_V2.md §4 -- the
  // Organisation Workflow Wizard (/portal/onboarding-wizard) previously had
  // no nav entry point of its own at all (distinct from "Onboarding" above,
  // which has always pointed at the separate OrganisationOnboardingTasks
  // checklist, not the wizard) -- reachable only via the dashboard banner
  // or a direct URL. A real, permanent top-level link is required to keep
  // it "permanently accessible" in more than name.
  { kind: 'link', href: '/portal/onboarding-wizard', label: 'Workflow Wizard' },
  // Admin-and-above-only -- a real GOV1 cascade surface with its own real
  // audit trail, kept at top-level visual weight rather than nested.
  { kind: 'link', href: '/portal/admin/governance', label: 'Governance', adminOnly: true },
  {
    kind: 'group',
    label: 'Platform',
    links: [
      // CUSTOMER_PLATFORM_UX_REVIEW_V1 -- Settings moved here from the
      // primary top-level nav (was TOP_LEVEL_LINKS in PortalNav.js);
      // every signed-in user's own account settings, not admin-gated.
      { href: '/portal/settings', label: 'Settings' },
      { href: '/portal/reporting', label: 'Reporting' },
      { href: '/portal/platform-health', label: 'Health' },
      { href: '/portal/support', label: 'Support' },
      { href: '/portal/documentation', label: 'Documentation' },
      { href: '/portal/training', label: 'Training' },
    ],
    // The entire /portal/admin/** tree is role-gated
    // (FRONTEND_ARCHITECTURE_V1.md §C.11) — these are only added to
    // the Platform group's own link list for an admin, mirroring the
    // pre-existing ADMIN_LINK's conditional-visibility precedent rather
    // than showing every member a "requires admin access" wall.
    // CUSTOMER_PLATFORM_UX_REVIEW_V1 -- Security moved here from its own
    // top-level pill; it's an admin-gated Platform concern the same way
    // Communications/Administration already are, not a section large or
    // frequent enough on its own to justify equal top-level weight with
    // Dashboard/Onboarding/Governance.
    adminLinks: [
      { href: '/portal/admin/security', label: 'Security' },
      { href: '/portal/admin/communications', label: 'Communications' },
      { href: '/portal/admin', label: 'Administration' },
    ],
  },
  {
    kind: 'group',
    // CUSTOMER_PLATFORM_UX_REVIEW_V1 -- Business and Marketing consolidated
    // into one organisational-management home. Two separate top-level
    // dropdowns for what is, from an organisation's own point of view, a
    // single "how we run the business" concern (sales pipeline, customer
    // success, finance, operations, campaigns, media) was exactly the kind
    // of top-level clutter this review was asked to remove — and gives
    // "future business units" (the workstream's own phrase) one obvious
    // home to grow into instead of a third new top-level dropdown apiece.
    label: 'My Organisation',
    links: [
      { href: '/portal/sales', label: 'Sales' },
      { href: '/portal/customer-success', label: 'Customer Success' },
      { href: '/portal/finance', label: 'Finance' },
      { href: '/portal/operations', label: 'Operations' },
      { href: '/portal/marketing', label: 'Campaigns' },
      { href: '/portal/media-centre', label: 'Media Centre' },
    ],
  },
];

// Kept for existing single-group consumers (PlatformSectionNav.js) that
// only ever need to find one group by label, not walk the full mixed
// link/group sequence above.
export const GROUPS = NAV_ITEMS.filter((item) => item.kind === 'group');
