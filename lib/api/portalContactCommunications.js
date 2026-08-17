// Server-only, Customer Portal (Phase 0 Package O) — read-only. Objective
// #10: this timeline is the aggregated SupportRequestMessage thread across
// every one of the caller's own requests — no separate message store.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/portalContactCommunications.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchPortalContactCommunications(token) {
  return backendFetch('/portal-contact/communications', { token });
}
