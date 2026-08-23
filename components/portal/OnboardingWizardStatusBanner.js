import Link from 'next/link';

import { LAST_AVAILABLE_STEP } from '@/lib/onboardingWizardSteps';

// CUSTOMER_ONBOARDING_WIZARD_V1.md -- Onboarding Status Visibility (Wizard
// Framework V1 scope). A presentational Server Component -- the caller
// fetches progress (Dashboard already fetches several things the same way)
// and passes it in, rather than this component fetching its own data, to
// avoid a second, redundant request every time it's rendered.
//
// UI Review Sprint V1 -- renamed from "Organisation setup" and no longer
// disappears once every step is complete. The wizard supports creating
// Departments, Executive Roles, Workers, Knowledge, Governance rules, and
// Integrations, all revisitable at any time -- it is an Organisation
// Workflow Wizard, not a one-time onboarding flow, so its dashboard entry
// point stays visible (in a lower-emphasis form) after completion too.
export default function OnboardingWizardStatusBanner({ progress }) {
  if (!progress) return null;

  const completedCount = (progress.completed_steps ?? []).length;
  const done = completedCount >= LAST_AVAILABLE_STEP;

  if (done) {
    return (
      <p className="activity-meta" role="status">
        <strong>Organisation Workflow Wizard:</strong> all {LAST_AVAILABLE_STEP} steps set up —{' '}
        <Link href="/portal/onboarding-wizard">revisit anytime</Link> to add departments, executive
        roles, workers, knowledge, governance rules, or integrations.
      </p>
    );
  }

  return (
    <p className="form-note-banner" role="status">
      <strong>Organisation Workflow Wizard:</strong> {completedCount} of {LAST_AVAILABLE_STEP} step
      {LAST_AVAILABLE_STEP === 1 ? '' : 's'} complete —{' '}
      <Link href="/portal/onboarding-wizard">continue</Link>.
    </p>
  );
}
