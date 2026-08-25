import Link from 'next/link';

/**
 * CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- fixes UX_REVIEW_CUSTOMER_PLATFORM_V1.md
 * §M1: this component used to render a second, hand-maintained copy of the
 * entire Workforce/My Organisation/Platform link lists (already drifting
 * from lib/portalNavGroups.js's own copy -- it was missing Worker Pools and
 * Federation). That made the same ~20 links appear up to four times within
 * one or two clicks of each other: the top-nav dropdown, the WorkforceNav/
 * MyOrganisationNav/PlatformSectionNav tab-strip now present on every page
 * in every group (see those components), and this "Explore your workspace"
 * block itself. With every group now covered by both the dropdown and a
 * persistent in-page tab strip, a third full copy here added no reachable
 * path that didn't already exist twice over.
 *
 * This block now does a genuinely different job instead of a smaller
 * version of the same job: a short, curated set of concrete next actions
 * for a user who just landed on the dashboard, not an exhaustive site map.
 * Admin-only actions are still deliberately excluded, same as before --
 * this stays a plain, unauthenticated-safe list with no role check.
 */
const QUICK_ACTIONS = [
  { href: '/portal/workers/new', label: 'Create a Worker' },
  { href: '/portal/knowledge/upload', label: 'Upload Knowledge' },
  { href: '/portal/projects', label: 'View Projects' },
  { href: '/portal/reporting', label: 'View Reporting' },
  { href: '/portal/marketplace', label: 'Browse Marketplace' },
  { href: '/portal/chat', label: 'Open Chat' },
  { href: '/portal/support', label: 'Get Support' },
];

export default function DashboardQuickLinks() {
  return (
    <div className="mini-services">
      {QUICK_ACTIONS.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}
