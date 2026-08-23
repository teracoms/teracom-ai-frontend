import SectionNav from '@/components/portal/SectionNav';
import { GROUPS } from '@/lib/portalNavGroups';

// UI_IMPLEMENTATION_SPRINT_1.md item 5 — standardises the tab-strip
// sub-navigation pattern (BillingNav.js's own precedent) across the
// Workforce section's pages (9, plus Federation as of
// NAVIGATION_REVIEW_V1.md §3). Reuses PortalNav.js's own GROUPS data
// rather than a second, driftable copy of the same link list.
const LINKS = GROUPS.find((group) => group.label === 'Workforce').links;

export default function WorkforceNav() {
  return <SectionNav links={LINKS} />;
}
