import { redirect } from 'next/navigation';

// HTTPS_VALIDATION_FAILURE_V1 -- real, found-and-fixed bug in this
// same page's own first version: with no explicit rendering mode,
// Next.js statically prerendered this page at build time (no cookies/
// headers/dynamic data to force otherwise) -- and a redirect() call
// baked into a *static* prerender does not produce a live, per-request
// HTTP redirect (confirmed directly: curl showed a 307 status with no
// Location header at all, just a static Next.js error-boundary HTML
// shell -- compare to /portal, whose own redirect is issued live by
// middleware.js and does carry a real `location:` header). Forcing
// dynamic rendering makes redirect() run per-request, the same real
// mechanism every other redirect in this app relies on.
export const dynamic = 'force-dynamic';

// HTTPS_VALIDATION_FAILURE_V1 -- the true root URL ("/") has never had
// a page component anywhere in this app (confirmed directly: no
// app/page.js, no app/(product)/page.js -- only app/(product)/layout.js,
// which serves as the effective root layout since this route group is
// what covers "/"). This is not a regression from today's TLS proxy
// work, and not a reverse-proxy misconfiguration -- the plain-HTTP
// frontend has 404'd on a bare "/" request since this app was built;
// the TLS proxy just faithfully forwards whatever the frontend does.
// Every real customer entry point has always been under /portal/... or
// /customer-portal/..., but a customer opening the bare domain/IP first
// (a completely natural thing to try) has always hit a dead end there.
//
// Mirrors app/(product)/portal/(protected)/page.js's own real
// precedent exactly (a plain redirect(), not a menu page to keep in
// sync) -- middleware.js's own matcher already covers /portal/:path*,
// so this one hop correctly reaches the real login page for a
// signed-out visitor or the dashboard for a signed-in one, via
// middleware's own already-proven logic, not duplicated here.
export default function RootPage() {
  redirect('/portal');
}
