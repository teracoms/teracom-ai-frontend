// Determines whether the current request actually arrived over HTTPS, so
// cookie `secure` flags can reflect the real connection instead of
// `NODE_ENV`. `NODE_ENV=production` says nothing about whether TLS exists in
// front of this process — this host runs `next start` directly on plain
// HTTP today (no reverse proxy yet, see Website_Application_Separation_
// Phase5_Runbook_V1.md), so a `secure`-flagged cookie set under
// `NODE_ENV=production` was being silently discarded by every browser,
// breaking login with no visible error anywhere in the chain (see
// SERVICE_INVENTORY_V1.md's login-outage root-cause writeup).
//
// Deliberately framework-agnostic (only touches `.headers.get()` and
// `.url`, both present on the standard Fetch `Request` App Router route
// handlers receive and on `NextRequest`, which middleware.js receives) so
// one implementation works unmodified in both the Node route-handler
// runtime and the Edge middleware runtime.
//
// `X-Forwarded-Proto` is checked first specifically so Phase 5's eventual
// nginx reverse proxy (which terminates TLS and forwards to this app over
// plain HTTP internally) is still recognised as a secure connection from
// the browser's point of view — falling back to the request's own literal
// URL scheme covers today's un-proxied deployment, where that header is
// never set.
export function isSecureRequest(request) {
  const forwardedProto = request.headers.get('x-forwarded-proto');

  if (typeof forwardedProto === 'string' && forwardedProto.length > 0) {
    return forwardedProto.split(',')[0].trim().toLowerCase() === 'https';
  }

  return typeof request.url === 'string' && request.url.toLowerCase().startsWith('https://');
}
