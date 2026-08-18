// "Package SEC1" — an Edge-runtime-safe sibling of jwt.js's
// decodeJwtPayload/getTokenExpirySeconds. middleware.js runs on
// Next.js's Edge runtime, which does not provide Node's `Buffer`
// global that jwt.js relies on — this file uses only the
// Web-standard `atob`, safe in any Edge runtime (and in plain Node,
// where `atob` has also been a global since Node 16).
//
// Deliberately its own module, not a rewritten jwt.js: jwt.js is used
// from genuine Node-only Server Components/Route Handlers where
// Buffer is guaranteed to exist, and there is no reason to change a
// working implementation there just to share code with a context that
// has a different runtime constraint. Kept dependency-free (no
// next/*, no @/* alias imports) so the plain Node test runner
// (`npm test`) can load it directly, matching lib/api/client.js's own
// documented reason for the same restriction.
export function decodeExpiry(token) {
  if (typeof token !== 'string') return null;
  const segments = token.split('.');
  if (segments.length < 2) return null;

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const payload = JSON.parse(json);
    return typeof payload?.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}
