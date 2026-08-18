'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';

// "Platform Review Wave 1" navigation redesign — the flat, ever-growing
// pill list (19 links by Package Q) is replaced with a grouped structure:
// two top-level links (Dashboard, Onboarding) plus four dropdown groups
// (Workforce, Business, Marketing, Platform) that match every section
// shipped so far to a semantic home. /portal (the original Package 2
// "Overview" launcher page) is intentionally no longer linked from here —
// its own job (a menu of links to everything else) is now redundant with
// this nav itself — but the route/page is untouched and still reachable
// directly, so nothing is actually removed.
//
// Marketing's third requested sub-item, "Production", has no distinct
// page of its own — content/video drafting happens inside a campaign's
// own detail view (/portal/marketing/[campaignId]), not a separate route
// — so it isn't listed here as a dead link. See this package's
// implementation report for the full reasoning.
const TOP_LEVEL_LINKS = [
  { href: '/portal/dashboard', label: 'Dashboard' },
  { href: '/portal/onboarding', label: 'Onboarding' },
];

const GROUPS = [
  {
    label: 'Workforce',
    links: [
      { href: '/portal/workers', label: 'Workers' },
      { href: '/portal/knowledge', label: 'Knowledge' },
      { href: '/portal/chat', label: 'Chat' },
      { href: '/portal/memory', label: 'Memory' },
      { href: '/portal/departments', label: 'Departments' },
      // Phase 0 Package PQR shipped this as "/portal/cto", labelled
      // "CTO Orchestration" — renamed here per direct instruction; the
      // route itself is unchanged (preserves every existing link/
      // bookmark to it).
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
      { href: '/portal/federation', label: 'Federation' },
      { href: '/portal/platform-health', label: 'Health' },
      { href: '/portal/support', label: 'Support' },
    ],
    // The entire /portal/admin/** tree is role-gated
    // (FRONTEND_ARCHITECTURE_V1.md §C.11) — these two are only added to
    // the Platform group's own link list for an admin, mirroring the
    // pre-existing ADMIN_LINK's conditional-visibility precedent rather
    // than showing every member a "requires admin access" wall.
    adminLinks: [
      { href: '/portal/admin/governance', label: 'Governance' },
      { href: '/portal/admin', label: 'Administration' },
    ],
  },
];

function isActive(pathname, href) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

function groupIsActive(pathname, links) {
  return links.some((link) => isActive(pathname, link.href));
}

export default function PortalNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [openGroup, setOpenGroup] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenGroup(null);
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Closing on every route change stops a dropdown/mobile panel staying
  // open after the user has already navigated away from it.
  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [pathname]);

  function groupLinks(group) {
    return isAdmin && group.adminLinks ? [...group.links, ...group.adminLinks] : group.links;
  }

  return (
    <nav className="portal-nav" ref={navRef}>
      <div className="container portal-nav-inner">
        <Link href="/portal/dashboard" className="portal-nav-brand">
          Teracom AI
        </Link>

        <button
          type="button"
          className="portal-nav-mobile-toggle"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen((current) => !current)}
        >
          Menu
        </button>

        <div className={mobileOpen ? 'portal-nav-links open' : 'portal-nav-links'}>
          {TOP_LEVEL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(pathname, link.href) ? 'portal-nav-link active' : 'portal-nav-link'}
            >
              {link.label}
            </Link>
          ))}

          {GROUPS.map((group) => {
            const links = groupLinks(group);
            const active = groupIsActive(pathname, links);
            const open = openGroup === group.label;

            return (
              <div className="portal-nav-group" key={group.label}>
                <button
                  type="button"
                  className={active ? 'portal-nav-link portal-nav-group-toggle active' : 'portal-nav-link portal-nav-group-toggle'}
                  aria-expanded={open}
                  aria-haspopup="true"
                  onClick={() => setOpenGroup((current) => (current === group.label ? null : group.label))}
                >
                  {group.label}
                  <span className="portal-nav-caret" aria-hidden="true">
                    ▾
                  </span>
                </button>

                <div className={open ? 'portal-nav-dropdown open' : 'portal-nav-dropdown'} role="menu">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className={isActive(pathname, link.href) ? 'portal-nav-dropdown-link active' : 'portal-nav-dropdown-link'}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
