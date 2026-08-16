// Server-only Autonomous CTO / Organisational Intelligence data access,
// per FRONTEND_ARCHITECTURE_V1.md §C.4 — the browser never calls
// BACKEND_API_URL directly. Backed by real endpoints (Phase 0 Package G,
// PHASE_0_PACKAGE_G_AUTONOMOUS_CTO_IMPLEMENTATION_REPORT.md).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/ctoOrchestration.js must only be used on the server.');
}

import { backendFetch } from './client.js';

// Free — no Ollama call. Runs the deterministic decomposition
// heuristic and the tier gate only; review point (a) of the Package G
// design decision (review the plan before execution).
export async function planCtoTask(token, primaryWorkerId, objective, maxHops) {
  return backendFetch('/cto/plan', {
    method: 'POST',
    token,
    body: {
      primary_worker_id: primaryWorkerId,
      objective,
      ...(maxHops ? { max_hops: maxHops } : {}),
    },
  });
}

// The approval action — calling this IS the human's trigger for the
// whole bounded chain, which then runs autonomously with no per-hop
// confirmation (§ design decision). Pass `steps` (from a prior
// planCtoTask() call) to run exactly that reviewed plan; omit it to
// decompose internally and execute immediately — review point (b),
// reviewing the executive synthesis after execution instead.
export async function executeCtoTask(token, primaryWorkerId, objective, steps) {
  return backendFetch('/cto/execute', {
    method: 'POST',
    token,
    body: {
      primary_worker_id: primaryWorkerId,
      objective,
      ...(steps && steps.length > 0 ? { steps } : {}),
    },
  });
}

// Audit visibility / CTO dashboard data — every completed chain
// execution belonging to the customer's own organisation.
export async function fetchCtoExecutions(token) {
  return backendFetch('/cto/executions', { token });
}
