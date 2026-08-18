// Server-only Organisation Onboarding data access (Phase 0 Package Q), per
// FRONTEND_ARCHITECTURE_V1.md §C.4 — the browser never calls
// BACKEND_API_URL directly. Distinct from lib/api's existing onboarding
// task access (if any) for a CrmContact — this is the organisation-level
// welcome checklist auto-seeded on first licence activation, see
// models/organisation_onboarding_task.py's own docstring for why the two
// are deliberately separate concepts.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/organisationOnboarding.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchOrganisationOnboardingTasks(token) {
  return backendFetch('/organisation-onboarding-tasks/', { token });
}

export async function completeOrganisationOnboardingTask(token, taskId) {
  return backendFetch(`/organisation-onboarding-tasks/${encodeURIComponent(taskId)}/complete`, {
    method: 'PATCH',
    token,
  });
}
