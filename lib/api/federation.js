// Server-only Federation Registry data access, per Phase 0 Package L
// (Federation Registry & External AI Consulting). The registry
// (GET /federation/providers) is read-open — no tier gate, browsing the
// catalogue needs no more than Workers/Knowledge/Departments do.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/federation.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchFederationProviders(token) {
  return backendFetch('/federation/providers', { token });
}

// Executive visibility of federation activity (objectives #10/#11).
export async function fetchFederationSummary(token) {
  return backendFetch('/federation/summary', { token });
}
