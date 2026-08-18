'use client';

import WizardShell from '@/components/portal/WizardShell';
import { WORKER_PACK_SIZES } from '@/lib/licensing/referenceLicence';

// docs/governance/BILLING_AND_LICENSING_UX.md's exact 3 named steps.
// `currentWorkerCount`/`workerAllocation` are passed in from the page —
// currentWorkerCount is real, live data (GET /worker-list/); workerAllocation
// is the reference licence's illustrative tier ceiling. Submission itself is
// real, though (Phase 0 Package Q): unlike RenewalWizard/OwnershipTransferWizard,
// this wizard's payload (pack_size/quantity) needs no data from the
// illustrative reference licence, so it was safe to wire to the real
// POST /licensing/requests (request_type="worker_pack") — see
// app/api/portal/licensing/requests/route.js and
// services/entitlement_provisioning_service.py on the backend.
export default function WorkerPackWizard({ currentWorkerCount, workerAllocation }) {
  async function submitWorkerPackRequest(data) {
    const response = await fetch('/api/portal/licensing/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_type: 'worker_pack',
        pack_size: data.packSize ?? WORKER_PACK_SIZES[0],
        quantity: 1,
      }),
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(body.error || 'Unable to submit this request.');
    }

    return body;
  }

  const steps = [
    {
      label: 'Select Pack Size',
      render: ({ data, updateData }) => {
        const packSize = data.packSize ?? WORKER_PACK_SIZES[0];
        return (
          <div>
            {WORKER_PACK_SIZES.map((size) => (
              <label className="radio-option" key={size}>
                <input
                  type="radio"
                  name="packSize"
                  checked={packSize === size}
                  onChange={() => updateData({ packSize: size })}
                />
                +{size} workers
              </label>
            ))}
            <p className="form-note">
              Two pack sizes are approved as add-ons to your tier&apos;s base allocation
              (LICENSING_MODEL_V1.md §7).
            </p>
          </div>
        );
      },
    },
    {
      label: 'Review Capacity Change',
      render: ({ data }) => {
        const packSize = data.packSize ?? WORKER_PACK_SIZES[0];
        return (
          <dl>
            <dt>Current workers in use</dt>
            <dd>{currentWorkerCount}</dd>
            <dt>Current allocation</dt>
            <dd>{workerAllocation}</dd>
            <dt>Pack requested</dt>
            <dd>+{packSize}</dd>
            <dt>New allocation if approved</dt>
            <dd>{workerAllocation + packSize}</dd>
          </dl>
        );
      },
    },
    {
      label: 'Submit Approval Request',
      render: ({ data }) => (
        <p>
          Ready to submit a request for a +{data.packSize ?? WORKER_PACK_SIZES[0]}-worker pack.
          Like any entitlement change, this requires human approval and a re-issued licence file
          before it takes effect (LICENSING_MODEL_V1.md §9/§15).
        </p>
      ),
    },
  ];

  return (
    <WizardShell
      steps={steps}
      onSubmit={submitWorkerPackRequest}
      submitLabel="Submit Approval Request"
    />
  );
}
