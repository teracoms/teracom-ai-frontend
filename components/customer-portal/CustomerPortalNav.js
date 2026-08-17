'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { usePortalContactAuth } from '@/components/customer-portal/PortalContactAuthProvider';

const LINKS = [
  { href: '/customer-portal', label: 'Dashboard' },
  { href: '/customer-portal/deals', label: 'Proposals & Contracts' },
  { href: '/customer-portal/onboarding', label: 'Onboarding' },
  { href: '/customer-portal/projects', label: 'Projects' },
  { href: '/customer-portal/support', label: 'Support' },
  { href: '/customer-portal/communications', label: 'Communications' },
  { href: '/customer-portal/knowledge', label: 'Knowledge' },
];

function isActive(pathname, href) {
  if (pathname === href) return true;
  return href !== '/customer-portal' && pathname.startsWith(`${href}/`);
}

export default function CustomerPortalNav() {
  const pathname = usePathname();
  const { logout } = usePortalContactAuth();

  return (
    <nav className="portal-nav">
      <div className="container portal-nav-inner">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={isActive(pathname, link.href) ? 'portal-nav-link active' : 'portal-nav-link'}
          >
            {link.label}
          </Link>
        ))}
        <button type="button" className="portal-nav-link" onClick={() => logout()}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
