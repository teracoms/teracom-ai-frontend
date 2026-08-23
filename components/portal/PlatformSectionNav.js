import SectionNav from '@/components/portal/SectionNav';
import { GROUPS } from '@/lib/portalNavGroups';

// UI_IMPLEMENTATION_SPRINT_1.md item 5 — same pattern as WorkforceNav.js,
// applied to the Platform section's pages (Settings, Reporting, Health,
// Support, Documentation, Training -- Federation moved to Workforce per
// NAVIGATION_REVIEW_V1.md §3). Named PlatformSectionNav rather than
// PlatformNav to avoid reading as "the primary nav for the whole
// platform" — this is the Platform *group's own* sub-nav only.
const LINKS = GROUPS.find((group) => group.label === 'Platform').links;

export default function PlatformSectionNav() {
  return <SectionNav links={LINKS} />;
}
