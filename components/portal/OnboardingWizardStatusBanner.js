import Link from 'next/link';

import { LAST_AVAILABLE_STEP } from '@/lib/onboardingWizardSteps';

// CUSTOMER_ONBOARDING_WIZARD_V1.md -- Onboarding Status Visibility (Wizard
// Framework V1 scope). A presentational Server Component -- the caller
// fetches progress (Dashboard already fetches several things the same way)
// and passes it in, rather than this component fetching its own data, to
// avoid a second, redundant request every time it's rendered.
export default function OnboardingWizardStatusBanner({ progress }) {
  if (!progress) return null;

  const completedCount = (progress.completed_steps ?? []).length;
  const done = completedCount >= LAST_AVAILABLE_STEP;

  if (done) {
    return null; // nothing to nudge once the available step(s) are complete
  }

  return (
    <p className="form-note-banner" role="status">
      <strong>Organisation setup:</strong> {completedCount} of {LAST_AVAILABLE_STEP} available step
      {LAST_AVAILABLE_STEP === 1 ? '' : 's'} complete —{' '}
      <Link href="/portal/onboarding-wizard">continue setup</Link>.
    </p>
  );
}
