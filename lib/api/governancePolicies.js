// Server-only governance policy registry access, per Phase 0 Package
// PQR — organisation policy visibility (objective #7).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/governancePolicies.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchGovernancePolicies(token) {
  return backendFetch('/governance-policies/', { token });
}
