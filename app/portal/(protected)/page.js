import { redirect } from 'next/navigation';

// "Platform Review Wave 1" replaced this page's own job (a menu of links
// to every section) with `PortalNav.js`'s grouped dropdown navigation,
// which is why it was dropped from the nav — but the bare `/portal` URL
// (still linked from the public marketing site's Header/Footer) kept
// landing signed-in users on this now-redundant page, which then drifted
// out of date every time a new section shipped (see
// TERACOM_REVIEW_BACKLOG.md WBL-002 — this page's own copy still claimed
// "Billing is being rolled out" long after Billing shipped, and its
// feature grid never grew past the original six Package-2-era sections).
// "Platform Review Wave 3" removes the duplicate landing surface
// entirely rather than trying to keep two Overview pages in sync forever
// — Dashboard is now the one canonical landing page.
export default function PortalHome() {
  redirect('/portal/dashboard');
}
