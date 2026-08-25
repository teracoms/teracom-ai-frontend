// Plain data, deliberately its own module rather than living inside
// PortalNav.js (a 'use client' component) — UI_IMPLEMENTATION_SPRINT_1.md
// item 5's per-section sub-nav components (WorkforceNav.js,
// MyOrganisationNav.js, PlatformSectionNav.js) are rendered from Server
// Components, and importing
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
//
// CUSTOMER_PLATFORM_UX_REFACTOR_V1 (implementing UX_REVIEW_CUSTOMER_PLATFORM_V1.md)
// made five further changes to this list, each cited at its own line below:
// "Digital Workforce" renamed (§M9), "Projects" added (§H2/§M5), "Reporting"
// promoted to top-level (§H3), "Billing & Licensing" given a nav entry at
// all for the first time (§H1 -- it previously had none, reachable only via
// a card on the Administration index page), and the admin-only "Security"
// link relabelled "Security Policy" (§M4).
export const NAV_ITEMS = [
  { kind: 'link', href: '/portal/dashboard', label: 'Dashboard' },
  {
    kind: 'group',
    label: 'Workforce',
    links: [
      // UX_REVIEW_CUSTOMER_PLATFORM_V1.md §M9 -- renamed from "Digital
      // Workforce". Sitting directly above "Workers" with no differentiating
      // description, the two labels were indistinguishable from the nav
      // alone (both plausibly "the place to see your workers"); this page is
      // specifically the aggregated headcount/structure/pending-requests
      // overview (app/portal/(protected)/digital-workforce/page.js's own
      // docstring), which "Overview" now signals directly.
      { href: '/portal/digital-workforce', label: 'Workforce Overview' },
      { href: '/portal/workers', label: 'Workers' },
      { href: '/portal/workers/pools', label: 'Worker Pools' },
      { href: '/portal/knowledge', label: 'Knowledge' },
      { href: '/portal/chat', label: 'Chat' },
      { href: '/portal/memory', label: 'Memory' },
      { href: '/portal/departments', label: 'Departments' },
      // UX_REVIEW_CUSTOMER_PLATFORM_V1.md §H2/§M5 -- Projects previously had
      // no nav entry anywhere (it only ever existed as a component embedded
      // inside /portal/operations, under the unrelated "My Organisation"
      // group). Placed directly next to Tasks -- the same conceptual domain
      // (every Task belongs to a Project), now in the same nav group instead
      // of two groups apart.
      { href: '/portal/projects', label: 'Projects' },
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
  // UX_REVIEW_CUSTOMER_PLATFORM_V1.md §H3 -- promoted from the Platform
  // group. This page aggregates real Operations/Finance/Marketing/Health/
  // Sales Pipeline/Organisation Health/Executive Dashboard/Organisational
  // Intelligence/Executive Briefing summaries (nine, as of this refactor) --
  // the most information-dense page in the product, previously three nav
  // levels deep under a meta/support group alongside Settings and
  // Documentation. NAVIGATION_REVIEW_V1.md §5 flagged this placement as an
  // open question when the page had five widgets; it never got smaller.
  { kind: 'link', href: '/portal/reporting', label: 'Reporting' },
  {
    kind: 'group',
    label: 'Platform',
    links: [
      // CUSTOMER_PLATFORM_UX_REVIEW_V1 -- Settings moved here from the
      // primary top-level nav (was TOP_LEVEL_LINKS in PortalNav.js);
      // every signed-in user's own account settings, not admin-gated.
      { href: '/portal/settings', label: 'Settings' },
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
      // UX_REVIEW_CUSTOMER_PLATFORM_V1.md §H1/§M4 -- given a nav entry for
      // the first time: previously reachable only via a card on the
      // Administration index page (/portal/admin), not from the nav itself
      // at any depth. Labelled "Billing & Licensing", not "Security", to
      // stay unambiguous next to Security in the same admin-only list.
      { href: '/portal/admin/billing', label: 'Billing & Licensing' },
      // UX_REVIEW_CUSTOMER_PLATFORM_V1.md §M4 -- relabelled from "Security".
      // /portal/settings/security (personal MFA/password/sessions) is also
      // titled "Security" and reached via a completely different nav path
      // (Settings, not Administration) -- two unrelated pages sharing one
      // exact title. This is the organisation-wide policy page (session
      // timeout, MFA enforcement), so "Security Policy" now says which one
      // it is without opening it.
      { href: '/portal/admin/security', label: 'Security Policy' },
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
