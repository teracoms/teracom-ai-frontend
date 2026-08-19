'use client';

import WizardShell from '@/components/portal/WizardShell';

// Wave 2 Workstream 3 (Onboarding & Trust Surface Clarity) -- this
// wizard has no real onSubmit (see WizardShell.js's own docstring);
// every field is drawn from lib/licensing/referenceLicence.js's
// illustrative data, and "submitting" only records locally on this
// screen. Previously had no disclaimer of any kind anywhere in this
// flow -- added here, not merely made more prominent.
function IllustrativeDataBanner() {
  return (
    <p className="illustrative-data-banner" role="note">
      <strong>Illustrative data</strong>
      This wizard runs on illustrative example data, not your organisation&apos;s real licence.
      Submitting records a request on this screen only — it does not reach teracom-ai-backend or
      require staff approval, unlike the real Worker Pack request flow.
    </p>
  );
}

// docs/governance/BILLING_AND_LICENSING_UX.md's exact 4 named steps.
export default function RenewalWizard({ licence }) {
  const steps = [
    {
      label: 'Review Current Licence',
      render: () => (
        <div>
          <dl>
            <dt>Tier</dt>
            <dd>{licence.tier}</dd>
            <dt>Hosting model</dt>
            <dd>{licence.hostingModel}</dd>
            <dt>Status</dt>
            <dd>{licence.status}</dd>
            <dt>Expiry date</dt>
            <dd>{licence.expiryDate}</dd>
          </dl>
          <p className="form-note">
            Renewal may be requested up to 90 days before expiry (LICENSING_MODEL_V1.md §12).
          </p>
        </div>
      ),
    },
    {
      label: 'Select Renewal Type',
      render: ({ data, updateData }) => {
        const cadence = data.cadence ?? 'annual';
        return (
          <div>
            <label className="radio-option">
              <input
                type="radio"
                name="cadence"
                checked={cadence === 'monthly'}
                onChange={() => updateData({ cadence: 'monthly' })}
              />
              Monthly
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="cadence"
                checked={cadence === 'annual'}
                onChange={() => updateData({ cadence: 'annual' })}
              />
              Annual
            </label>
          </div>
        );
      },
    },
    {
      label: 'Review Summary',
      render: ({ data }) => (
        <dl>
          <dt>Tier</dt>
          <dd>{licence.tier}</dd>
          <dt>Hosting model</dt>
          <dd>{licence.hostingModel}</dd>
          <dt>Renewal cadence</dt>
          <dd>{data.cadence ?? 'annual'}</dd>
        </dl>
      ),
    },
    {
      label: 'Submit Request',
      render: ({ data }) => (
        <p>
          Ready to submit a renewal request for the {licence.tier} tier, {data.cadence ?? 'annual'}{' '}
          cadence. This request requires human approval before a renewed licence is issued
          (LICENSING_MODEL_V1.md §9).
        </p>
      ),
    },
  ];

  return (
    <>
      <IllustrativeDataBanner />
      <WizardShell steps={steps} submitLabel="Submit Request" />
    </>
  );
}
