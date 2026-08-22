'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';
import { GROUPS } from '@/lib/portalNavGroups';

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

// Admin-and-above-only top-level links — rendered unconditionally in
// the JSX below, filtered by isAdmin the same way TOP_LEVEL_LINKS
// isn't, so Governance (previously nested three levels deep inside
// the Platform group's own adminLinks) gets equal visual weight to
// Dashboard/Onboarding instead of being the least discoverable admin
// surface in the product.
const ADMIN_TOP_LEVEL_LINKS = [
  { href: '/portal/admin/governance', label: 'Governance' },
];

function isActive(pathname, href) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

function groupIsActive(pathname, links) {
  return links.some((link) => isActive(pathname, link.href));
}

export default function PortalNav({ organisationName = null }) {
  const pathname = usePathname();
  const { user } = useAuth();
  // Human Authority Model: hierarchy-aware, not exact-match — an
  // "owner" (a tier introduced above "admin") must still see every
  // admin-visible nav item, the same "higher tier implies lower
  // tier's access" rule the backend's own require_role() now applies
  // (backend/auth/roles.py#role_at_least()).
  const isAdmin = isAtLeastRole(user?.role, 'admin');

  const [openGroup, setOpenGroup] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);
  // Keyed by group label — lets Escape/close return focus to the exact
  // trigger button that opened a dropdown (TERACOM_REVIEW_BACKLOG.md
  // WBL-008), and lets the dropdown's own keydown handler find that
  // group's menu items for arrow-key navigation.
  const triggerRefs = useRef({});
  const dropdownRefs = useRef({});

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

  // Moves focus into the newly-opened dropdown's first menu item —
  // WAI-ARIA menu-button pattern (WBL-008). Runs after openGroup changes,
  // not on click itself, since the dropdown's `open` class (and therefore
  // its focusability) only applies once React has re-rendered.
  useEffect(() => {
    if (!openGroup) return;
    const firstLink = dropdownRefs.current[openGroup]?.querySelector('[role="menuitem"]');
    firstLink?.focus();
  }, [openGroup]);

  function groupLinks(group) {
    return isAdmin && group.adminLinks ? [...group.links, ...group.adminLinks] : group.links;
  }

  function closeMenus() {
    setOpenGroup(null);
    setMobileOpen(false);
  }

  function closeAndRefocusTrigger(groupLabel) {
    setOpenGroup(null);
    triggerRefs.current[groupLabel]?.focus();
  }

  function handleTriggerKeyDown(event, groupLabel) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpenGroup(groupLabel);
    }
  }

  // Arrow-key/Home/End navigation between a dropdown's own menuitem
  // links, and Escape that returns focus to the button that opened it —
  // the two pieces of the standard menu-button pattern this dropdown was
  // missing entirely before (WBL-008).
  function handleDropdownKeyDown(event, groupLabel) {
    const items = Array.from(dropdownRefs.current[groupLabel]?.querySelectorAll('[role="menuitem"]') ?? []);
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(currentIndex + 1) % items.length].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length].focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0].focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1].focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeAndRefocusTrigger(groupLabel);
    }
  }

  return (
    <nav className="portal-nav" ref={navRef}>
      <div className="container portal-nav-inner">
        <Link href="/portal/dashboard" className="portal-nav-brand">
          Teracom AI
        </Link>

        {organisationName && (
          <span className="portal-nav-org" title="Your organisation">
            {organisationName}
          </span>
        )}

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
              onClick={closeMenus}
            >
              {link.label}
            </Link>
          ))}

          {isAdmin &&
            ADMIN_TOP_LEVEL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={isActive(pathname, link.href) ? 'portal-nav-link active' : 'portal-nav-link'}
                onClick={closeMenus}
              >
                {link.label}
              </Link>
            ))}

          {GROUPS.map((group) => {
            const links = groupLinks(group);
            const active = groupIsActive(pathname, links);
            const open = openGroup === group.label;

            const dropdownId = `portal-nav-dropdown-${group.label}`;

            return (
              <div className="portal-nav-group" key={group.label}>
                <button
                  type="button"
                  ref={(node) => {
                    triggerRefs.current[group.label] = node;
                  }}
                  className={active ? 'portal-nav-link portal-nav-group-toggle active' : 'portal-nav-link portal-nav-group-toggle'}
                  aria-expanded={open}
                  aria-haspopup="true"
                  aria-controls={dropdownId}
                  onClick={() => setOpenGroup((current) => (current === group.label ? null : group.label))}
                  onKeyDown={(event) => handleTriggerKeyDown(event, group.label)}
                >
                  {group.label}
                  <span className="portal-nav-caret" aria-hidden="true">
                    ▾
                  </span>
                </button>

                <div
                  id={dropdownId}
                  ref={(node) => {
                    dropdownRefs.current[group.label] = node;
                  }}
                  className={open ? 'portal-nav-dropdown open' : 'portal-nav-dropdown'}
                  role="menu"
                  onKeyDown={(event) => handleDropdownKeyDown(event, group.label)}
                >
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className={isActive(pathname, link.href) ? 'portal-nav-dropdown-link active' : 'portal-nav-dropdown-link'}
                      onClick={closeMenus}
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
