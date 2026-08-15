'use client';

import WizardShell from '@/components/portal/WizardShell';

// docs/governance/BILLING_AND_LICENSING_UX.md's exact 5 named steps.
// `organisation` (name/slug) is real, live data — see the page that renders
// this — so "Current Ownership" reflects the real organisation, not
// invented data.
export default function OwnershipTransferWizard({ organisation }) {
  const steps = [
    {
      label: 'Current Ownership',
      render: () => (
        <dl>
          <dt>Organisation</dt>
          <dd>{organisation?.name ?? 'Unavailable'}</dd>
          <dt>Slug</dt>
          <dd>{organisation?.slug ?? 'Unavailable'}</dd>
        </dl>
      ),
    },
    {
      label: 'New Ownership',
      render: ({ data, updateData }) => (
        <>
          <input
            placeholder="New owner organisation or contact name"
            value={data.newOwnerName ?? ''}
            onChange={(event) => updateData({ newOwnerName: event.target.value })}
          />
          <input
            type="email"
            placeholder="New owner contact email"
            value={data.newOwnerEmail ?? ''}
            onChange={(event) => updateData({ newOwnerEmail: event.target.value })}
          />
        </>
      ),
    },
    {
      label: 'Transfer Reason',
      render: ({ data, updateData }) => (
        <textarea
          placeholder="e.g. acquisition, hardware migration, MSP handoff"
          value={data.reason ?? ''}
          onChange={(event) => updateData({ reason: event.target.value })}
        />
      ),
    },
    {
      label: 'Review',
      render: ({ data }) => (
        <dl>
          <dt>Current organisation</dt>
          <dd>{organisation?.name ?? 'Unavailable'}</dd>
          <dt>New owner</dt>
          <dd>{data.newOwnerName || '—'}</dd>
          <dt>New owner email</dt>
          <dd>{data.newOwnerEmail || '—'}</dd>
          <dt>Reason</dt>
          <dd>{data.reason || '—'}</dd>
        </dl>
      ),
    },
    {
      label: 'Submit',
      render: () => (
        <p>
          Ready to submit this ownership transfer request. Ownership transfer always requires
          human approval (LICENSING_MODEL_V1.md §11) — how a transfer affects the renewal clock or
          hardware-bound licence fingerprint is not yet decided (§11), so this request would need
          manual review either way.
        </p>
      ),
    },
  ];

  return <WizardShell steps={steps} submitLabel="Submit" />;
}
