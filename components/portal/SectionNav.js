'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// UI_IMPLEMENTATION_SPRINT_1.md item 5 — generalises the tab-strip
// sub-navigation pattern BillingNav.js already established ("the same
// 'one nav component per meaningfully-sized section' precedent
// PortalNav.js already set at the top level") into one reusable
// primitive, rather than five near-identical copies for Workforce,
// Governance, Marketing, Platform, and Administration. BillingNav.js
// itself now wraps this component instead of duplicating its markup.
export default function SectionNav({ links }) {
  const pathname = usePathname();

  return (
    <nav className="billing-nav">
      <div className="container billing-nav-inner">
        {links.map((link) => (
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
