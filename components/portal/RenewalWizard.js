'use client';

import WizardShell from '@/components/portal/WizardShell';

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

  return <WizardShell steps={steps} submitLabel="Submit Request" />;
}
