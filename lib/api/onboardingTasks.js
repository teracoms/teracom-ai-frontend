// Server-only onboarding task data access, per Phase 0 Package J (Sales &
// Customer Success Platform). Tasks are usually seeded in a batch
// (seedOnboardingTasks — a fixed, deterministic checklist template
// backend-side, no LLM involved) but can be listed/completed individually.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/onboardingTasks.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function seedOnboardingTasks(token, crmContactId) {
  return backendFetch('/onboarding-tasks/seed', {
    method: 'POST',
    token,
    body: { crm_contact_id: crmContactId },
  });
}

export async function fetchOnboardingTasks(token, crmContactId) {
  return backendFetch('/onboarding-tasks/', { token, searchParams: { crm_contact_id: crmContactId } });
}

export async function completeOnboardingTask(token, taskId) {
  return backendFetch(`/onboarding-tasks/${taskId}/complete`, { method: 'PATCH', token });
}
