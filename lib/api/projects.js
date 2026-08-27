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

// PROJECT_EXECUTION_AND_VOICE_V1 -- ENGINEERING_DEPARTMENT_V1's own
// sibling of planProject() above for a project that already exists
// (the real customer path: created via an Orchestrator conversation,
// with real captured Requirements already on it) rather than always
// creating a new one. Was fully built and tested on the backend
// (api/projects.py#plan_engineering_for_project_route()) but had zero
// caller anywhere in this frontend -- confirmed by a full search --
// meaning a real, already-working capability sat completely
// unreachable through the actual product. Same
// capability_allowed_for_tier(tier, "cto_orchestration")/Platinum gate,
// same honest { available: false } (no tasks created) response when
// the organisation's tier doesn't allow it, not an error.
export async function planProjectEngineering(token, projectId, payload) {
  return backendFetch(`/projects/${projectId}/engineering-plan`, { method: 'POST', token, body: payload });
}
