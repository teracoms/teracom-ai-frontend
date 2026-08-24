// Server-only Executive Dashboard data access.
// DIGITAL_ORGANISATION_OPERATIONS_V1 -- organisation summary,
// department summary, project summary, and worker activity summary,
// all for exactly one organisation.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/executiveDashboard.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchExecutiveDashboardSummary(token) {
  return backendFetch('/executive-dashboard/summary', { token });
}
