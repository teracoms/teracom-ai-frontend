// Server-only Executive Briefing data access.
// COPILOT_CTO_INTEGRATION_FOUNDATION_V1 -- reshapes
// GET /organisational-intelligence/summary around the four questions
// an executive actually asks: what needs attention, what is blocked,
// what is overloaded, what should happen next. No new computation.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/executiveBriefing.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchExecutiveBriefingSummary(token) {
  return backendFetch('/executive-briefing/summary', { token });
}
