'use client';

import WizardShell from '@/components/portal/WizardShell';

// Wave 2 Workstream 3 (Onboarding & Trust Surface Clarity) -- this
// wizard has no real onSubmit (see WizardShell.js's own docstring);
// "submitting" only records locally on this screen. Previously had no
// disclaimer of any kind anywhere in this flow -- added here, not
// merely made more prominent.
function IllustrativeDataBanner() {
  return (
    <p className="illustrative-data-banner" role="note">
      <strong>Partially illustrative</strong>
      The current organisation name shown below is real. The rest of this wizard (transfer terms,
      submission) runs on illustrative example data — submitting records a request on this screen
      only, it does not reach our systems or require staff approval.
    </p>
  );
}

// teracom-ai-docs/Reference/BILLING_AND_LICENSING_UX.md's exact 5 named steps.
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
          human approval — how a transfer affects the renewal clock or hardware-bound licence
          fingerprint is not yet decided, so this request would need manual review either way.
        </p>
      ),
    },
  ];

  return (
    <>
      <IllustrativeDataBanner />
      <WizardShell steps={steps} submitLabel="Submit" />
    </>
  );
}
