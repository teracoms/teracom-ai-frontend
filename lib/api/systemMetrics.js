// Server-only System Metrics data access ("Platform Review Wave 1"
// objective #7), per FRONTEND_ARCHITECTURE_V1.md §C.4. Admin-only
// backend-side (auth.roles.require_role("admin")) — callers should
// check the caller's role before fetching, the same convention
// app/portal/(protected)/admin/billing/worker-pack/page.js already
// uses, rather than relying on the 403 alone.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/systemMetrics.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchSystemMetricsSummary(token) {
  return backendFetch('/system-metrics/summary', { token });
}
