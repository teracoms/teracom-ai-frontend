// Server-only. CUSTOMER_ONBOARDING_WIZARD_V1.md / Wizard Framework V1 --
// progress tracking and save/resume for the onboarding wizard.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/onboardingWizard.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchOnboardingWizardProgress(token) {
  return backendFetch('/onboarding-wizard/progress', { token });
}

export async function updateOnboardingWizardProgress(token, payload) {
  return backendFetch('/onboarding-wizard/progress', { method: 'PATCH', token, body: payload });
}
