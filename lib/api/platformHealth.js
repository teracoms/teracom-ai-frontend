// Server-only platform health summary access, per Phase 0 Package PQR
// (objectives #12/#13/#15) — a computed snapshot from real rows,
// never a stored time series.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/platformHealth.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchPlatformHealthSummary(token) {
  return backendFetch('/platform-health/summary', { token });
}
