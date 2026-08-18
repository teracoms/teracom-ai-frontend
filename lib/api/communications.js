// Server-only communications-timeline data access ("Package EMAIL1",
// objective #12). Two distinct scopes, mirroring the backend's own
// split: an organisation-wide admin view (welcome/trial/onboarding
// notices) and a per-contact view (Customer Success onboarding emails
// sent directly to a CrmContact's own address).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/communications.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchOrganisationCommunications(token) {
  return backendFetch('/organisation-notifications/', { token });
}

export async function fetchContactCommunications(token, contactId) {
  return backendFetch(`/crm/contacts/${contactId}/communications`, { token });
}
