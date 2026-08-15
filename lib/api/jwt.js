// Pure, dependency-free JWT payload decoding. This intentionally does NOT verify
// the token signature — the backend (teracom-ai-backend, auth/security.py) is the
// sole authority on whether a token is valid. This helper only reads the payload
// of a token we already trust (either one the backend just issued to us, or one
// we're about to hand back to the backend for verification), purely to render
// UI state (e.g. session expiry) without an extra network round trip.
export function decodeJwtPayload(token) {
  if (typeof token !== 'string') return null;

  const segments = token.split('.');
  if (segments.length < 2) return null;

  try {
    const json = Buffer.from(segments[1], 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getTokenExpirySeconds(token) {
  const payload = decodeJwtPayload(token);
  return typeof payload?.exp === 'number' ? payload.exp : null;
}
