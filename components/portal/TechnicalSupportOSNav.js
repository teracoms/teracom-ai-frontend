import SectionNav from '@/components/portal/SectionNav';

// TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- one level deeper than
// portalNavGroups.js's own top-level GROUPS (which WorkforceNav.js/
// PlatformSectionNav.js read from): this is Technical Support OS's own
// internal sub-navigation, the eleven named areas of a self-contained
// Operating System module. Reuses the same SectionNav primitive every
// other section's own tab strip already uses.
const LINKS = [
  { href: '/portal/operating-systems/technical-support', label: 'Dashboard' },
  { href: '/portal/operating-systems/technical-support/voice-assistant', label: 'Voice Assistant' },
  { href: '/portal/operating-systems/technical-support/avatar', label: 'Worker Avatar' },
  { href: '/portal/operating-systems/technical-support/conversations', label: 'Support Conversations' },
  { href: '/portal/operating-systems/technical-support/workers', label: 'Technical Support Workers' },
  { href: '/portal/operating-systems/technical-support/support-cases', label: 'Support Cases' },
  { href: '/portal/operating-systems/technical-support/vendor-sources', label: 'Vendor Sources' },
  { href: '/portal/operating-systems/technical-support/documentation', label: 'Product Documentation' },
  { href: '/portal/operating-systems/technical-support/technical-knowledge', label: 'Technical Knowledge' },
  { href: '/portal/operating-systems/technical-support/firmware', label: 'Software and Firmware' },
  { href: '/portal/operating-systems/technical-support/advisories', label: 'Vendor Advisories' },
  { href: '/portal/operating-systems/technical-support/reports', label: 'Reports' },
];

export default function TechnicalSupportOSNav() {
  return <SectionNav links={LINKS} />;
}
