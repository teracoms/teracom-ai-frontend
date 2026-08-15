'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Section-local sub-navigation for /portal/admin/billing/** — the section
// has enough sub-pages (Overview, Licence Details, Usage & Capacity,
// Renewal, Worker Pack, Ownership Transfer, Requests) to warrant its own
// tab strip, the same "one nav component per meaningfully-sized section"
// precedent PortalNav.js already set at the top level.
const LINKS = [
  { href: '/portal/admin/billing', label: 'Overview' },
  { href: '/portal/admin/billing/licence', label: 'Licence Details' },
  { href: '/portal/admin/billing/usage', label: 'Usage & Capacity' },
  { href: '/portal/admin/billing/renewal', label: 'Renewal' },
  { href: '/portal/admin/billing/worker-pack', label: 'Worker Pack' },
  { href: '/portal/admin/billing/ownership-transfer', label: 'Ownership Transfer' },
  { href: '/portal/admin/billing/requests', label: 'Requests & History' },
];

export default function BillingNav() {
  const pathname = usePathname();

  return (
    <nav className="billing-nav">
      <div className="container billing-nav-inner">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? 'billing-nav-link active' : 'billing-nav-link'}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
