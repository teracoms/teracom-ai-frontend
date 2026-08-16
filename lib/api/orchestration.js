// Server-only Orchestration Intelligence data access, per
// FRONTEND_ARCHITECTURE_V1.md §C.4 — the browser never calls
// BACKEND_API_URL directly. Backed by real endpoints (Phase 0 Package F,
// PHASE_0_PACKAGE_F_ORCHESTRATION_IMPLEMENTATION_REPORT.md).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/orchestration.js must only be used on the server.');
}

import { backendFetch } from './client.js';

// Free — no Ollama call, no execution. See ORCHESTRATION_INTELLIGENCE_MVP_V1.md
// §3/§7: this only runs the local suggestion heuristic and the tier gate.
export async function suggestConsultation(token, primaryWorkerId, message) {
  return backendFetch('/orchestration/suggest', {
    method: 'POST',
    token,
    body: { primary_worker_id: primaryWorkerId, message },
  });
}

// The approval action itself — calling this IS the customer's explicit
// confirmation (§7). Runs the real two-call consult-then-synthesise
// sequence; expect this to take noticeably longer than a single chat turn.
export async function consultWorker(token, primaryWorkerId, consultedWorkerId, message) {
  return backendFetch('/orchestration/consult', {
    method: 'POST',
    token,
    body: {
      primary_worker_id: primaryWorkerId,
      consulted_worker_id: consultedWorkerId,
      message,
    },
  });
}

// Audit visibility for the customer themselves — every completed
// consultation belonging to their own organisation.
export async function fetchConsultations(token) {
  return backendFetch('/orchestration/consultations', { token });
}
