'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';
import { CUSTOMER_NAV_ITEMS, ADMINISTRATION_NAV_ITEMS } from '@/lib/portalNavGroups';

// "Platform Review Wave 1" navigation redesign — the flat, ever-growing
// pill list (19 links by Package Q) is replaced with a grouped structure:
// top-level links plus dropdown groups that match every section shipped
// so far to a semantic home. /portal (the original Package 2 "Overview"
// launcher page) is intentionally no longer linked from here — its own
// job (a menu of links to everything else) is now redundant with this
// nav itself — but the route/page is untouched and still reachable
// directly, so nothing is actually removed.
//
// CUSTOMER_PLATFORM_UX_REVIEW_V1 -- previously rendered as three separate
// blocks in a fixed order (every plain top-level link, then every
// admin-only top-level link, then every dropdown group) via
// TOP_LEVEL_LINKS/ADMIN_TOP_LEVEL_LINKS/GROUPS; that meant a dropdown
// group could never appear before a later plain link. Moving Workforce to
// sit directly after Dashboard needed one ordered sequence instead — see
// lib/portalNavGroups.js#NAV_ITEMS, which now owns this ordering.
//
// Marketing's third requested sub-item, "Production", has no distinct
// page of its own — content/video drafting happens inside a campaign's
// own detail view (/portal/marketing/[campaignId]), not a separate route
// — so it isn't listed here as a dead link. See this package's
// implementation report for the full reasoning.

function isActive(pathname, href) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

function groupIsActive(pathname, links) {
  return links.some((link) => isActive(pathname, link.href));
}

export default function PortalNav({ organisationName = null, hasLogo = false, initialNavigationMode = 'customer' }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  // Human Authority Model: hierarchy-aware, not exact-match — an
  // "owner" (a tier introduced above "admin") must still see every
  // admin-visible nav item, the same "higher tier implies lower
  // tier's access" rule the backend's own require_role() now applies
  // (backend/auth/roles.py#role_at_least()).
  const isAdmin = isAtLeastRole(user?.role, 'admin');

  // CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec1 -- a non-admin can never be in
  // Administration Mode, full stop, regardless of what's stored in
  // their own preferences (e.g. a role downgrade after the fact) --
  // this check runs on every render, not just at the toggle.
  const [navigationMode, setNavigationMode] = useState(initialNavigationMode);
  const effectiveMode = isAdmin ? navigationMode : 'customer';
  const [modeSaving, setModeSaving] = useState(false);

  async function handleToggleMode() {
    const nextMode = effectiveMode === 'administration' ? 'customer' : 'administration';
    setNavigationMode(nextMode);
    setModeSaving(true);
    try {
      await fetch('/api/portal/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: { navigation: { mode: nextMode } } }),
      });
    } catch {
      // Best-effort persistence -- the toggle already reflects the
      // customer's own real intent for this session even if saving it
      // for next time silently failed; not worth a visible error for
      // a low-stakes UI preference.
    } finally {
      setModeSaving(false);
    }
  }

  const activeNavItems = effectiveMode === 'administration' ? ADMINISTRATION_NAV_ITEMS : CUSTOMER_NAV_ITEMS;

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

  // UX_DEFECT_REMEDIATION_V1 AUTH002 -- AuthProvider.js's own logout()
  // already existed (clears the session, redirects to /portal/login)
  // but was never wired to anything a user could actually click --
  // real gap, confirmed by a full-codebase search finding zero call
  // sites. This is the first one.
  function handleSignOut() {
    closeMenus();
    logout();
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
          {/* eslint-disable-next-line @next/next/no-img-element -- a
              static local brand asset, not a per-organisation upload;
              next/image's runtime optimisation exists for the latter. */}
          <img src="/brand/teracom-logo.png" alt="Teracom AI" className="portal-nav-logo" />
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
          {activeNavItems.map((item) => {
            if (item.kind === 'link') {
              if (item.adminOnly && !isAdmin) return null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(pathname, item.href) ? 'portal-nav-link active' : 'portal-nav-link'}
                  onClick={closeMenus}
                >
                  {item.label}
                </Link>
              );
            }

            const links = groupLinks(item);
            const active = groupIsActive(pathname, links);
            const open = openGroup === item.label;

            const dropdownId = `portal-nav-dropdown-${item.label}`;

            return (
              <div className="portal-nav-group" key={item.label}>
                <button
                  type="button"
                  ref={(node) => {
                    triggerRefs.current[item.label] = node;
                  }}
                  className={active ? 'portal-nav-link portal-nav-group-toggle active' : 'portal-nav-link portal-nav-group-toggle'}
                  aria-expanded={open}
                  aria-haspopup="true"
                  aria-controls={dropdownId}
                  onClick={() => setOpenGroup((current) => (current === item.label ? null : item.label))}
                  onKeyDown={(event) => handleTriggerKeyDown(event, item.label)}
                >
                  {item.label}
                  <span className="portal-nav-caret" aria-hidden="true">
                    ▾
                  </span>
                </button>

                <div
                  id={dropdownId}
                  ref={(node) => {
                    dropdownRefs.current[item.label] = node;
                  }}
                  className={open ? 'portal-nav-dropdown open' : 'portal-nav-dropdown'}
                  role="menu"
                  onKeyDown={(event) => handleDropdownKeyDown(event, item.label)}
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

        {/* CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec1.4 -- the one, real,
            persistent Administration Mode entry point, visible only to
            admin-tier and above. Deliberately a small text toggle, not
            its own dropdown or a second nav row -- this document's own
            §12 item 1 leaves the exact visual treatment open; this is a
            first, working implementation of it, not the final polish. */}
        {isAdmin && (
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleToggleMode}
            disabled={modeSaving}
            style={{ marginLeft: '0.75rem' }}
          >
            {effectiveMode === 'administration' ? 'Administration' : 'Customer View'}
          </button>
        )}

        {/* CUSTOMER_PLATFORM_UX_REVIEW_V1 -- moved to the far right of the
            bar (was rendered directly beside the brand) and given its own
            visually distinct treatment (a bordered, muted pill) so it
            reads as "which organisation you're in", not part of the
            Teracom AI platform brand itself. */}
        {organisationName && (
          <span className="portal-nav-org" title="Your organisation">
            {hasLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/api/portal/organisation/logo" alt="" className="portal-nav-org-logo" />
            )}
            {organisationName}
          </span>
        )}

        {/* UX_DEFECT_REMEDIATION_V1 AUTH002 -- real defect: no visible
            Sign Out anywhere in the platform, confirmed by a full
            search finding zero call sites for AuthProvider.js's own
            already-real logout(). Reuses the exact same dropdown
            mechanism (openGroup/triggerRefs/dropdownRefs, arrow-key
            navigation, Escape-to-trigger) every other nav group above
            already uses, keyed by a reserved label no real nav group
            can collide with. Profile deep-links to the real "Profile"
            heading UserSettingsForm.js already renders inside
            /portal/settings (id="profile"), not a page that doesn't
            exist. */}
        {user && (
          <div className="portal-nav-group" key="__account__">
            <button
              type="button"
              ref={(node) => {
                triggerRefs.current.__account__ = node;
              }}
              className={
                openGroup === '__account__'
                  ? 'portal-nav-link portal-nav-group-toggle active'
                  : 'portal-nav-link portal-nav-group-toggle'
              }
              aria-expanded={openGroup === '__account__'}
              aria-haspopup="true"
              aria-controls="portal-nav-dropdown-account"
              aria-label="Account menu"
              onClick={() => setOpenGroup((current) => (current === '__account__' ? null : '__account__'))}
              onKeyDown={(event) => handleTriggerKeyDown(event, '__account__')}
            >
              {user.email}
              <span className="portal-nav-caret" aria-hidden="true">
                ▾
              </span>
            </button>

            <div
              id="portal-nav-dropdown-account"
              ref={(node) => {
                dropdownRefs.current.__account__ = node;
              }}
              className={
                openGroup === '__account__'
                  ? 'portal-nav-dropdown portal-nav-dropdown-right open'
                  : 'portal-nav-dropdown portal-nav-dropdown-right'
              }
              role="menu"
              onKeyDown={(event) => handleDropdownKeyDown(event, '__account__')}
            >
              <Link
                href="/portal/settings#profile"
                role="menuitem"
                className="portal-nav-dropdown-link"
                onClick={closeMenus}
              >
                Profile
              </Link>
              <Link href="/portal/settings" role="menuitem" className="portal-nav-dropdown-link" onClick={closeMenus}>
                Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                className="portal-nav-dropdown-link portal-nav-dropdown-signout"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
