// Server-only finance summary data access, per Phase 0 Package M (CFO &
// Finance Platform). Reuses services/federation_summary_service.py's own
// cost aggregate backend-side unmodified (objective #8) — no separate
// federation fetch is needed from this side.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/finance.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchFinanceSummary(token) {
  return backendFetch('/finance/summary', { token });
}
