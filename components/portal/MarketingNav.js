import SectionNav from '@/components/portal/SectionNav';

// UI_IMPLEMENTATION_SPRINT_1.md item 5 — same pattern as WorkforceNav.js,
// applied to the Marketing section's 2 pages. CUSTOMER_PLATFORM_UX_REVIEW_V1
// folded the Marketing dropdown itself into "My Organisation"
// (lib/portalNavGroups.js) alongside Business — this section's own sub-nav
// still only ever needs its own 2 pages, so it keeps its own literal list
// here rather than filtering the merged group by href.
const LINKS = [
  { href: '/portal/marketing', label: 'Campaigns' },
  { href: '/portal/media-centre', label: 'Media Centre' },
];

export default function MarketingNav() {
  return <SectionNav links={LINKS} />;
}
