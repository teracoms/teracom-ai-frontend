// Server-only Organisational Intelligence data access.
// AUTONOMOUS_OPERATIONS_V1 -- Executive Work Queue, Worker Capacity
// Management, Organisational Intelligence findings, and Executive
// Decision Support, all for exactly one organisation. Every field in
// the response is a real, deterministic computation over that
// organisation's own data -- never an LLM-generated summary.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/organisationalIntelligence.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchOrganisationalIntelligenceSummary(token) {
  return backendFetch('/organisational-intelligence/summary', { token });
}
