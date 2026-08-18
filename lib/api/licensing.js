// Server-only Licensing data access, per FRONTEND_ARCHITECTURE_V1.md §C.4 —
// the browser never calls BACKEND_API_URL directly. Backed by real
// endpoints (Phase 0 Package A, extended in Package Q to actually act on
// worker_pack/tier_change/hosting_change approvals) — unlike
// lib/licensing/referenceLicence.js's illustrative-only data, which this
// module does not replace (see that file's own header, and Package Q's
// implementation report, for why a full replacement was left out of scope).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/licensing.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function createLicenceRequest(token, payload) {
  return backendFetch('/licensing/requests', { method: 'POST', token, body: payload });
}

export async function fetchLicenceRequests(token) {
  return backendFetch('/licensing/requests', { token });
}

export async function fetchEntitlement(token, licenceId) {
  return backendFetch(`/licensing/entitlements/${encodeURIComponent(licenceId)}`, { token });
}
