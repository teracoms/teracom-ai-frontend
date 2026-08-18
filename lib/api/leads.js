// Server-only Lead capture data access ("Customer Experience &
// Commercial Readiness Wave", objectives #10-#11), per
// FRONTEND_ARCHITECTURE_V1.md §C.4. The real backend behind the
// marketing site's own contact form — previously
// app/api/leads/route.js only ever console.log'd a submission.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/leads.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function submitLead(payload) {
  return backendFetch('/leads/', { method: 'POST', body: payload });
}
