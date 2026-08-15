import BillingNav from '@/components/portal/BillingNav';

/**
 * Nests under app/portal/(protected)/admin/layout.js, so the admin-role gate
 * already applies to every route below — no second gate is added here.
 * This layout only adds the section-local sub-navigation (BillingNav), the
 * same "one nav component per meaningfully-sized section" precedent
 * PortalNav.js established at the top level, given how many sub-pages this
 * section has (Overview, Licence Details, Usage & Capacity, Renewal,
 * Worker Pack, Ownership Transfer, Requests & History).
 */
export default function BillingLayout({ children }) {
  return (
    <>
      <BillingNav />
      {children}
    </>
  );
}
