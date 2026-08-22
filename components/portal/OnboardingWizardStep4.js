'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import ConceptHelp from '@/components/portal/ConceptHelp';
import OrganisationStructureVisual from '@/components/portal/OrganisationStructureVisual';
import { useAuth } from '@/components/portal/AuthProvider';
import { WORKER_TEMPLATES } from '@/lib/workerTemplates';
import { executiveRoleLabel } from '@/lib/executiveRoles';

const EMPTY_FORM = { name: '', role: '', purpose: '', instructions: '' };

// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 4 -- Digital Workforce. Worker
// creation itself reuses the pre-existing POST /api/portal/workers
// proxy (built for CreateWorkerForm.js, unchanged here) -- this
// component adds the template picker, the Workforce Guidance
// disclosures, and inline Department/Executive Owner assignment on top
// of that same real endpoint, plus PATCH /api/portal/workers/{id}/executive-owner
// (new this step) alongside the pre-existing department-assignment
// route.
export default function OnboardingWizardStep4({
  organisationName,
  initialWorkers,
  departments,
  executiveRoles,
  stepAlreadyCompleted,
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [workers, setWorkers] = useState(initialWorkers);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [completed, setCompleted] = useState(stepAlreadyCompleted);
  const [assigningId, setAssigningId] = useState(null);
  const [assignError, setAssignError] = useState(null);

  function applyTemplate(template) {
    setSelectedTemplateKey(template.key);
    setForm({
      name: template.name,
      role: template.role,
      purpose: template.purpose,
      instructions: template.instructions,
    });
  }

  async function markStepComplete() {
    try {
      await fetch('/api/portal/onboarding-wizard/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_step: 4 }),
      });
      setCompleted(true);
    } catch {
      // Non-fatal -- see OnboardingWizardStep2/Step3's own identical note.
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    const trimmedName = form.name.trim();
    const trimmedRole = form.role.trim();
    const trimmedPurpose = form.purpose.trim();
    const trimmedInstructions = form.instructions.trim();
    if (!trimmedName || !trimmedRole || !trimmedPurpose || !trimmedInstructions) return;

    setCreating(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/portal/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          role: trimmedRole,
          purpose: trimmedPurpose,
          instructions: trimmedInstructions,
          status: 'active',
          organisation_id: user?.organisation_id,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to create this worker.');

      setWorkers((prev) => [...prev, data.worker]);
      setForm(EMPTY_FORM);
      setSelectedTemplateKey(null);
      await markStepComplete();
      router.refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unable to create this worker.');
    } finally {
      setCreating(false);
    }
  }

  async function assignDepartment(workerId, departmentId) {
    setAssigningId(workerId);
    setAssignError(null);
    try {
      const response = await fetch(`/api/portal/workers/${workerId}/department`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_id: departmentId || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to assign this department.');
      setWorkers((prev) => prev.map((w) => (w.id === workerId ? { ...w, department_id: departmentId || null } : w)));
      router.refresh();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Unable to assign this department.');
    } finally {
      setAssigningId(null);
    }
  }

  async function assignExecutiveOwner(workerId, executiveOwnerId) {
    setAssigningId(workerId);
    setAssignError(null);
    try {
      const response = await fetch(`/api/portal/workers/${workerId}/executive-owner`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executive_owner_id: executiveOwnerId || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to assign this executive owner.');
      setWorkers((prev) =>
        prev.map((w) => (w.id === workerId ? { ...w, executive_owner_id: executiveOwnerId || null } : w))
      );
      router.refresh();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Unable to assign this executive owner.');
    } finally {
      setAssigningId(null);
    }
  }

  const departmentById = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const executiveRoleById = Object.fromEntries(
    executiveRoles.map((r) => [r.id, executiveRoleLabel(r.role_key)])
  );
  const decoratedWorkers = workers.map((w) => ({
    ...w,
    departmentLabel: w.department_id ? departmentById[w.department_id] : null,
    executiveOwnerLabel: w.executive_owner_id ? executiveRoleById[w.executive_owner_id] : null,
  }));

  return (
    <div className="wizard-step4">
      <div className="section-heading left">
        <span className="eyebrow">Digital Workforce</span>
        <h2>
          Workers <ConceptHelp concept="workers" />
        </h2>
        <p className="activity-meta">
          Workers are AI workers that do real work inside a Department. Your organisation is built
          in layers — Organisation <ConceptHelp concept="digitalWorkforce" /> → Executive Team →
          Departments → Workers — and this is the last layer: the people who actually do the work,
          each sitting inside a Department, optionally owned by one of your Executive Team roles.
        </p>
      </div>

      {completed && (
        <p className="form-note-banner" role="status">
          Digital workforce saved. Add, assign, or remove workers any time — this step stays
          available after setup.
        </p>
      )}

      <OrganisationStructureVisual
        organisationName={organisationName}
        executiveRoles={executiveRoles.map((r) => ({ key: r.role_key, label: executiveRoleLabel(r.role_key) }))}
        departments={departments}
        workers={decoratedWorkers}
      />

      <div className="wizard-step4-templates">
        <p className="activity-meta">Start from a template, or fill in your own worker below.</p>
        <div className="wizard-step4-template-grid">
          {WORKER_TEMPLATES.map((template) => (
            <div
              key={template.key}
              className={'wizard-step4-template-card' + (selectedTemplateKey === template.key ? ' selected' : '')}
            >
              <button type="button" className="wizard-step4-template-pick" onClick={() => applyTemplate(template)}>
                <span className="wizard-step4-template-name">{template.name}</span>
                <span className="wizard-step4-template-desc">{template.whatItDoes}</span>
              </button>
              <details className="wizard-step4-template-more">
                <summary>Why it exists &amp; example</summary>
                <dl>
                  <dt>Why it exists</dt>
                  <dd>{template.whyItExists}</dd>
                  <dt>Example use case</dt>
                  <dd>{template.exampleUseCase}</dd>
                </dl>
              </details>
            </div>
          ))}
        </div>
      </div>

      <form className="contact-form" onSubmit={handleCreate} noValidate>
        {createError && (
          <p className="form-error" role="alert">
            {createError}
          </p>
        )}

        <div>
          <label htmlFor="wizard-worker-name">Worker name</label>
          <input
            id="wizard-worker-name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="e.g. Financial Analyst"
            disabled={creating}
          />
        </div>

        <div>
          <label htmlFor="wizard-worker-role">Role</label>
          <input
            id="wizard-worker-role"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            placeholder="e.g. financial_analyst"
            disabled={creating}
          />
        </div>

        <div>
          <label htmlFor="wizard-worker-purpose">Purpose</label>
          <textarea
            id="wizard-worker-purpose"
            value={form.purpose}
            onChange={(event) => setForm({ ...form, purpose: event.target.value })}
            placeholder="What this worker is for, in a sentence."
            disabled={creating}
            rows={2}
          />
        </div>

        <div>
          <label htmlFor="wizard-worker-instructions">Instructions</label>
          <textarea
            id="wizard-worker-instructions"
            value={form.instructions}
            onChange={(event) => setForm({ ...form, instructions: event.target.value })}
            placeholder="How this worker should behave — its own instructions."
            disabled={creating}
            rows={3}
          />
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={creating || !form.name.trim() || !form.role.trim() || !form.purpose.trim() || !form.instructions.trim()}
        >
          {creating ? 'Creating...' : 'Create Worker'}
        </button>
      </form>

      {assignError && (
        <p className="form-error" role="alert">
          {assignError}
        </p>
      )}

      {workers.length > 0 && (
        <ul className="wizard-step4-worker-list">
          {workers.map((worker) => (
            <li key={worker.id} className="wizard-step4-worker-item">
              <div className="wizard-step4-worker-item-head">
                <p className="wizard-step4-worker-name">{worker.name}</p>
                <span className="wizard-step4-worker-role">{worker.role}</span>
              </div>

              <div className="wizard-step4-worker-assign">
                <div>
                  <label htmlFor={`wizard-worker-dept-${worker.id}`}>Department</label>
                  <select
                    id={`wizard-worker-dept-${worker.id}`}
                    value={worker.department_id ?? ''}
                    onChange={(event) => assignDepartment(worker.id, event.target.value)}
                    disabled={assigningId === worker.id}
                  >
                    <option value="">Unassigned</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`wizard-worker-exec-${worker.id}`}>Executive Owner</label>
                  <select
                    id={`wizard-worker-exec-${worker.id}`}
                    value={worker.executive_owner_id ?? ''}
                    onChange={(event) => assignExecutiveOwner(worker.id, event.target.value)}
                    disabled={assigningId === worker.id}
                  >
                    <option value="">Unassigned</option>
                    {executiveRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {executiveRoleLabel(role.role_key)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
