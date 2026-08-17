// Server-only, staff-facing (Phase 0 Package O). Admin-only backend-side —
// the one action that creates a contact's Customer Portal login.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/portalContactAccounts.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function createPortalAccountForContact(token, contactId, payload) {
  return backendFetch(`/crm/contacts/${contactId}/portal-account`, { method: 'POST', token, body: payload });
}

// Returns null, not a 404 error, when this contact has no portal account yet.
export async function fetchPortalAccountForContact(token, contactId) {
  return backendFetch(`/crm/contacts/${contactId}/portal-account`, { token });
}
