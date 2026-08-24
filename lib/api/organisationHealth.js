// Server-only Organisation Health data access.
// DIGITAL_ORGANISATION_OPERATIONS_V1 -- worker counts, worker pool
// utilisation, project/task counts, scheduler status, and memory
// statistics, all for exactly one organisation.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/organisationHealth.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchOrganisationHealthSummary(token) {
  return backendFetch('/organisation-health/summary', { token });
}
