'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { ONBOARDING_WIZARD_STEPS } from '@/lib/onboardingWizardSteps';

// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 9 -- Launch Organisation. No
// new backend surface: "launching" is marking completed_step: 9 on
// the existing OnboardingWizardProgress row (api/onboarding_wizard.py)
// -- there is no organisation status/licence transition tied to this
// action, deliberately (inventing one wasn't asked for and would be a
// real licensing-model decision, not a wizard checkbox).
export default function OnboardingWizardStep9({ organisationName, organisationId, trialEndsAt, completedSteps }) {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);

  async function handleEnterDashboard() {
    setLaunching(true);
    try {
      await fetch('/api/portal/onboarding-wizard/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_step: 9 }),
      });
    } catch {
      // Non-fatal -- proceed to the Dashboard regardless; the wizard
      // itself stays available to finish marking this later.
    }
    router.push('/portal/dashboard');
  }

  return (
    <div className="wizard-step9">
      <div className="section-heading left">
        <span className="eyebrow">Launch Organisation</span>
        <h2>Ready to go.</h2>
        <p className="activity-meta">
          You&apos;ve set up {organisationName} — here&apos;s what&apos;s done, and where to go
          next.
        </p>
      </div>

      <div className="wizard-step9-section">
        <h3>Onboarding completion</h3>
        <ul className="wizard-step9-checklist">
          {ONBOARDING_WIZARD_STEPS.map((item) => {
            const done = completedSteps.includes(item.step);
            return (
              <li key={item.step} className={done ? 'done' : ''}>
                {item.step}. {item.label}
                {!item.available && ' (coming soon)'}
                {done && ' — done'}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="wizard-step9-section">
        <h3>Environment summary</h3>
        <dl className="wizard-step9-summary-list">
          <dt>Organisation</dt>
          <dd>{organisationName}</dd>
          <dt>Organisation ID</dt>
          <dd>{organisationId}</dd>
          {trialEndsAt && (
            <>
              <dt>Trial ends</dt>
              <dd>{new Date(trialEndsAt).toLocaleDateString()}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="wizard-step9-section">
        <h3>Next actions</h3>
        <ul className="wizard-step9-next-actions">
          <li>
            <a href="/portal/departments">Review your Departments</a>
          </li>
          <li>
            <a href="/portal/workers">Review your Workers</a>
          </li>
          <li>
            <a href="/portal/knowledge">Review your Knowledge</a>
          </li>
          <li>
            <a href="/portal/admin/governance">Review Governance</a>
          </li>
        </ul>
      </div>

      <button className="btn btn-primary" type="button" onClick={handleEnterDashboard} disabled={launching}>
        {launching ? 'Entering...' : 'Enter Dashboard'}
      </button>
    </div>
  );
}
