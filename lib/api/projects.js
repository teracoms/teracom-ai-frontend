// Server-only project data access, per Phase 0 Package N (Operations &
// Project Delivery Platform). Created directly, no submit/decide step —
// operational execution tracking, not a financial or contractual
// commitment, so it does not use Proposal/Quote/Contract/DepartmentBudget's
// submit -> admin-decide shape.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/projects.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function createProject(token, payload) {
  return backendFetch('/projects/', { method: 'POST', token, body: payload });
}

export async function updateProjectStatus(token, projectId, status) {
  return backendFetch(`/projects/${projectId}/status`, { method: 'PATCH', token, body: { status } });
}

// Omitting departmentId lists every project in the caller's own
// organisation (the org-wide Operations workspace); providing it scopes
// the list to one department's dashboard.
export async function fetchProjects(token, departmentId) {
  return backendFetch('/projects/', {
    token,
    searchParams: departmentId ? { department_id: departmentId } : undefined,
  });
}

// AUTONOMOUS_ORGANISATION_V1 — Human -> Objective -> Project. Reuses
// the same capability_allowed_for_tier(tier, "cto_orchestration")/
// Platinum gate POST /cto/plan already enforces; admin-tier
// backend-side, not employee-tier like ordinary project creation.
// Returns { available, project, tasks } — available is false (no
// project or task created) when the organisation's tier doesn't
// allow it.
export async function planProject(token, payload) {
  return backendFetch('/projects/plan', { method: 'POST', token, body: payload });
}
