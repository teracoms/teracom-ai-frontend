import SectionNav from '@/components/portal/SectionNav';

// Section-local sub-navigation for /portal/admin/billing/** — the section
// has enough sub-pages (Overview, Licence Details, Usage & Capacity,
// Renewal, Worker Pack, Ownership Transfer, Requests) to warrant its own
// tab strip. UI_IMPLEMENTATION_SPRINT_1.md item 5 generalised this
// component's own original implementation into the reusable SectionNav
// primitive below, now used the same way for Workforce/Platform/Marketing.
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
  return <SectionNav links={LINKS} />;
}
