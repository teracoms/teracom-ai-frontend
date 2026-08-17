// Server-only, Customer Portal (Phase 0 Package O) — read-only. Objective
// #11: only Knowledge rows an admin has marked customer_visible=true.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/portalContactKnowledge.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchPortalContactKnowledge(token) {
  return backendFetch('/portal-contact/knowledge', { token });
}
