'use client';

import { useState } from 'react';

/**
 * Generic guided-wizard shell shared by the Renewal, Worker Pack, and
 * Ownership Transfer wizards — per docs/governance/UX_VISION.md §3/§6, all
 * three are Wizard-tier by direct instruction (§5 item 4: "a guided flow is
 * a natural fit here regardless of NL feasibility, since a human-approval
 * step is mandatory either way"), not single dense forms.
 *
 * There is nowhere real to submit to: teracom-ai-backend has no
 * /licensing/* endpoint of any kind (see lib/licensing/referenceLicence.js).
 * `onSubmit` therefore only receives the collected step data for the
 * caller's own use (e.g. rendering a summary) — it does not, and cannot,
 * persist anything server-side or make the submission visible anywhere
 * else in the app. The final screen says this plainly rather than showing
 * a fake "success" state that implies a real workflow was triggered.
 */
export default function WizardShell({ steps, onSubmit, submitLabel = 'Submit Request' }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  function updateData(patch) {
    setData((current) => ({ ...current, ...patch }));
  }

  function handleNext() {
    if (isLast) {
      onSubmit?.(data);
      setSubmitted(true);
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
          Your request has been recorded on this screen only. teracom-ai-backend has no endpoint
          yet to submit, route, or store a licensing request — in production this would go to
          Teracom for the human-approval review LICENSING_MODEL_V1.md §9 requires. Reload this
          page to start again.
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

      <div className="wizard-actions">
        {stepIndex > 0 && (
          <button type="button" className="btn btn-secondary" onClick={handleBack}>
            Back
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={handleNext}>
          {isLast ? submitLabel : 'Continue'}
        </button>
      </div>
    </div>
  );
}
