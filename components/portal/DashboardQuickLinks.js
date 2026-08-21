import Link from 'next/link';

// "Platform Review Wave 3" objective #14 (platform discoverability): the
// dashboard's own stat tiles only ever covered Package 2's original four
// sections (Workers/Knowledge/Chat/Memory) — every section shipped since
// (Departments, Orchestration, Marketplace, Sales, Customer Success,
// Finance, Operations, Marketing, Media Centre, Federation, Support) was
// only discoverable via PortalNav.js's own dropdown groups, never from the
// one page every user lands on first. Deliberately excludes admin-only
// links (Billing, Administration, Governance) — those stay nav-only,
// gated the same way they already are there, so this static list doesn't
// need its own role check for a purely decorative orientation aid.
const GROUPS = [
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
      { href: '/portal/cto', label: 'Orchestration' },
      { href: '/portal/marketplace', label: 'Marketplace' },
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
      { href: '/portal/reporting', label: 'Reporting' },
      { href: '/portal/federation', label: 'Federation' },
      { href: '/portal/platform-health', label: 'Health' },
      { href: '/portal/support', label: 'Support' },
      { href: '/portal/documentation', label: 'Documentation' },
      { href: '/portal/training', label: 'Training' },
    ],
  },
];

export default function DashboardQuickLinks() {
  return (
    <div className="dashboard-quick-links">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <span className="eyebrow">{group.label}</span>
          <div className="mini-services">
            {group.links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
