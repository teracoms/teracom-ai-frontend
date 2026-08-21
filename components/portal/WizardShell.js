'use client';

import { useState } from 'react';

/**
 * Generic guided-wizard shell shared by the Renewal, Worker Pack, and
 * Ownership Transfer wizards — per docs/governance/UX_VISION.md §3/§6, all
 * three are Wizard-tier by direct instruction (§5 item 4: "a guided flow is
 * a natural fit here regardless of NL feasibility, since a human-approval
 * step is mandatory either way"), not single dense forms.
 *
 * `onSubmit` is optional and, when provided, is awaited — Phase 0 Package Q
 * gave WorkerPackWizard a real `POST /licensing/requests` to submit to (via
 * `app/api/portal/licensing/requests`), so its `onSubmit` actually persists
 * a real, staff-visible LicenceRequest and this shell shows the real
 * success/error outcome. RenewalWizard and OwnershipTransferWizard still
 * omit `onSubmit` — they depend on lib/licensing/referenceLicence.js's
 * illustrative data for fields a real submission would need (tier,
 * hosting_model, an actual existing_licence_id), which this package did not
 * replace (see this package's implementation report). For those two, the
 * original "recorded on this screen only" messaging is preserved below as
 * the no-`onSubmit` fallback, rather than showing a fake "success" state
 * for a request that wouldn't actually match the customer's real licence.
 */
export default function WizardShell({ steps, onSubmit, submitLabel = 'Submit Request' }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  function updateData(patch) {
    setData((current) => ({ ...current, ...patch }));
  }

  async function handleNext() {
    if (isLast) {
      if (!onSubmit) {
        setSubmitted(true);
        return;
      }

      setSubmitError(null);
      setSubmitting(true);
      try {
        await onSubmit(data);
        setSubmitted(true);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Unable to submit this request.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStepIndex((current) => current + 1);
  }

  function handleBack() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  if (submitted) {
    return (
      <div className="wizard-shell">
        <p className="form-note-banner" role="status">
          {onSubmit
            ? 'Your request has been submitted and now requires Teracom staff approval before it takes effect. You can track its status from Requests & History.'
            : 'Your request has been recorded on this screen only — submission isn’t wired up yet. In production this would go to Teracom for the same human-approval review described above. Reload this page to start again.'}
        </p>
      </div>
    );
  }

  return (
    <div className="wizard-shell">
      <ol className="wizard-steps">
        {steps.map((item, index) => (
          <li
            key={item.label}
            className={index === stepIndex ? 'active' : index < stepIndex ? 'done' : ''}
          >
            {item.label}
          </li>
        ))}
      </ol>

      <div className="wizard-step-body">{step.render({ data, updateData })}</div>

      {submitError && (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="wizard-actions">
        {stepIndex > 0 && (
          <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={submitting}>
            Back
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={handleNext} disabled={submitting}>
          {isLast ? (submitting ? 'Submitting...' : submitLabel) : 'Continue'}
        </button>
      </div>
    </div>
  );
}
