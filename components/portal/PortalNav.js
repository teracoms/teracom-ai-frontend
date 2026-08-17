'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';

// Minimal in-app navigation for the authenticated portal area. Every section
// that exists today (Overview, Dashboard, Workers, Knowledge, Chat, Memory,
// Marketplace) is listed unconditionally; Admin is the one exception — see ADMIN_LINK
// below — since the entire /portal/admin/** tree is role-gated
// (FRONTEND_ARCHITECTURE_V1.md §C.11) and showing it to everyone would just
// point most users at a "requires admin access" wall. New entries get added
// here as each later package ships.
const LINKS = [
  { href: '/portal', label: 'Overview' },
  { href: '/portal/dashboard', label: 'Dashboard' },
  { href: '/portal/workers', label: 'Workers' },
  { href: '/portal/knowledge', label: 'Knowledge' },
  { href: '/portal/chat', label: 'Chat' },
  { href: '/portal/memory', label: 'Memory' },
  { href: '/portal/marketplace', label: 'Marketplace' },
  { href: '/portal/cto', label: 'CTO' },
  { href: '/portal/departments', label: 'Departments' },
];

const ADMIN_LINK = { href: '/portal/admin', label: 'Admin' };

// Workers was the first section with nested routes (/portal/workers/new,
// /portal/workers/:workerId; now Knowledge, Chat, Memory and Admin too) — an
// exact-match check alone would never highlight these on their sub-pages, so
// a link is also active when the current path is nested under it (but
// /portal itself only matches exactly, or every page would show Overview as
// active).
function isActive(pathname, href) {
  if (pathname === href) return true;
  return href !== '/portal' && pathname.startsWith(`${href}/`);
}

export default function PortalNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const links = user?.role === 'admin' ? [...LINKS, ADMIN_LINK] : LINKS;

  return (
    <nav className="portal-nav">
      <div className="container portal-nav-inner">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={isActive(pathname, link.href) ? 'portal-nav-link active' : 'portal-nav-link'}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
