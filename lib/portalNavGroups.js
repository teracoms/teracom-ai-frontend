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
export const GROUPS = [
  {
    label: 'Workforce',
    links: [
      { href: '/portal/digital-workforce', label: 'Digital Workforce' },
      { href: '/portal/workers', label: 'Workers' },
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
  {
    label: 'Business',
    links: [
      { href: '/portal/sales', label: 'Sales' },
      { href: '/portal/customer-success', label: 'Customer Success' },
      { href: '/portal/finance', label: 'Finance' },
      { href: '/portal/operations', label: 'Operations' },
    ],
  },
  {
    label: 'Marketing',
    links: [
      { href: '/portal/marketing', label: 'Campaigns' },
      { href: '/portal/media-centre', label: 'Media Centre' },
    ],
  },
  {
    label: 'Platform',
    links: [
      // UI Review Sprint V1 -- Settings moved here from the primary
      // top-level nav (was TOP_LEVEL_LINKS in PortalNav.js); every
      // signed-in user's own account settings, not admin-gated.
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
    // Governance itself was promoted out of this list to
    // ADMIN_TOP_LEVEL_LINKS (PortalNav.js) — a real GOV1 cascade surface
    // with its own real audit trail is not a good fit for the least
    // discoverable spot in the whole nav.
    adminLinks: [
      { href: '/portal/admin/communications', label: 'Communications' },
      { href: '/portal/admin', label: 'Administration' },
    ],
  },
];
