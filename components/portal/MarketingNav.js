import SectionNav from '@/components/portal/SectionNav';
import { GROUPS } from '@/lib/portalNavGroups';

// UI_IMPLEMENTATION_SPRINT_1.md item 5 — same pattern as WorkforceNav.js,
// applied to the Marketing section's 2 pages.
const LINKS = GROUPS.find((group) => group.label === 'Marketing').links;

export default function MarketingNav() {
  return <SectionNav links={LINKS} />;
}
