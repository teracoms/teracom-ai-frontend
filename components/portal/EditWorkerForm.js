'use client';

import { useState } from 'react';

const NOT_SUPPORTED_MESSAGE =
  "Saving isn't available yet — only creating and listing workers is supported today " +
  '(no update capability exists yet). This form is ready to wire up once one ships; ' +
  'nothing you change here is sent anywhere.';

/**
 * teracom-ai-backend has no PATCH/PUT (or DELETE) route for a single worker —
 * only POST /workers/ (create) and GET /workers/ (list) exist (verified
 * against api/workers.py; see FRONTEND_ARCHITECTURE_V1.md §C.7 and
 * WORKERS_IMPLEMENTATION_REPORT.md). Per this task's "use existing backend
 * APIs only" constraint, this form never calls a non-existent endpoint —
 * fields are fully editable so the workflow is genuinely usable end-to-end
 * up to the point of persistence, but submitting surfaces an honest,
 * permanent notice instead of a fake success or a mysterious network error.
 */
export default function EditWorkerForm({ worker }) {
  const [form, setForm] = useState({
    name: worker.name,
    role: worker.role,
    purpose: worker.purpose,
    instructions: worker.instructions,
    status: worker.status,
  });
  const [submitted, setSubmitted] = useState(false);

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <p className="form-note-banner" role="note">
        {NOT_SUPPORTED_MESSAGE}
      </p>

      {submitted && (
        <p className="form-error" role="alert">
          {NOT_SUPPORTED_MESSAGE}
        </p>
      )}

      <input
        name="name"
        placeholder="Worker name"
        required
        value={form.name}
        onChange={updateField('name')}
      />

      <input
        name="role"
        placeholder="Role"
        required
        value={form.role}
        onChange={updateField('role')}
      />

      <textarea
        name="purpose"
        placeholder="Purpose"
        required
        value={form.purpose}
        onChange={updateField('purpose')}
      />

      <textarea
        name="instructions"
        placeholder="Instructions"
        required
        value={form.instructions}
        onChange={updateField('instructions')}
      />

      <select
        name="status"
        value={form.status}
        onChange={updateField('status')}
        aria-label="Status"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <button className="btn btn-primary" type="submit">
        Save Changes
      </button>
    </form>
  );
}
