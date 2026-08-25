import SectionNav from '@/components/portal/SectionNav';
import { NAV_ITEMS } from '@/lib/portalNavGroups';

/**
 * CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- fixes UX_REVIEW_CUSTOMER_PLATFORM_V1.md
 * §M7: the "My Organisation" dropdown group (Sales, Customer Success,
 * Finance, Operations, Campaigns, Media Centre) previously only had a
 * persistent tab-strip sub-nav on 2 of its 6 pages (MarketingNav.js,
 * Campaigns/Media Centre only) -- the other four required going back up to
 * the top-nav dropdown to move between them, unlike every other nav group
 * (Workforce, Platform), which already gets this treatment consistently
 * via WorkforceNav.js/PlatformSectionNav.js. This applies the same
 * SectionNav primitive to all six pages in the group, reusing
 * lib/portalNavGroups.js's own "My Organisation" link list rather than a
 * second, driftable copy -- same precedent as WorkforceNav.js/
 * PlatformSectionNav.js. Replaces MarketingNav.js on the two pages that
 * used it (Marketing, Media Centre) -- MarketingNav.js is deleted as part
 * of this change, since nothing else imported it.
 */
const LINKS = NAV_ITEMS.find((item) => item.kind === 'group' && item.label === 'My Organisation').links;

export default function MyOrganisationNav() {
  return <SectionNav links={LINKS} />;
}
