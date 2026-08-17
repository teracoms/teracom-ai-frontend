// Server-only operations summary data access, per Phase 0 Package N
// (Operations & Project Delivery Platform).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/operations.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchOperationsSummary(token) {
  return backendFetch('/operations/summary', { token });
}
