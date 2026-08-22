'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import ConceptHelp from '@/components/portal/ConceptHelp';
import OrganisationStructureVisual from '@/components/portal/OrganisationStructureVisual';
import { DEPARTMENT_TEMPLATES } from '@/lib/departmentTemplates';

const EMPTY_FORM = { name: '', description: '', purpose: '', function: '' };

// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 2 -- Organisation Structure. Unlike
// admin/departments' own CreateDepartmentForm (name + description only,
// no purpose/templates/edit — that page predates this wizard step), this
// component is wizard-specific: template-prefill, purpose, inline edit,
// and the structure visual, all in one place, gated on Step 1 already
// being complete (a department needs an organisation identity to belong
// to, which Step 1 is what actually establishes here).
export default function OnboardingWizardStep2({ initialDepartments, organisationName, stepAlreadyCompleted }) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initialDepartments);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [completed, setCompleted] = useState(stepAlreadyCompleted);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  function applyTemplate(template) {
    setSelectedTemplateKey(template.key);
    setForm({
      name: template.name,
      description: template.description,
      purpose: template.purpose,
      function: template.function,
    });
  }

  async function markStepComplete() {
    try {
      await fetch('/api/portal/onboarding-wizard/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_step: 2 }),
      });
      setCompleted(true);
    } catch {
      // Non-fatal — the department itself is already saved; the wizard
      // stepper simply won't show step 2 as done until a future save
      // retries this. Nothing here reverses the department create/edit
      // that already succeeded.
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) return;

    setCreating(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/portal/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: form.description.trim() || undefined,
          purpose: form.purpose.trim() || undefined,
          function: form.function || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to create this department.');

      setDepartments((prev) => [...prev, data]);
      setForm(EMPTY_FORM);
      setSelectedTemplateKey(null);
      await markStepComplete();
      router.refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unable to create this department.');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(department) {
    setEditingId(department.id);
    setEditForm({
      name: department.name,
      description: department.description ?? '',
      purpose: department.purpose ?? '',
      function: department.function ?? '',
    });
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
    setEditError(null);
  }

  async function handleEditSave(event) {
    event.preventDefault();
    const trimmedName = editForm.name.trim();
    if (!trimmedName) return;

    setSavingEdit(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/portal/departments/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: editForm.description.trim(),
          purpose: editForm.purpose.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to update this department.');

      setDepartments((prev) => prev.map((department) => (department.id === editingId ? data : department)));
      cancelEdit();
      router.refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Unable to update this department.');
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="wizard-step2">
      <div className="section-heading left">
        <span className="eyebrow">Organisation Structure</span>
        <h2>
          Departments <ConceptHelp concept="department" />
        </h2>
        <p className="activity-meta">
          Departments group your future Workers, carry their own Governance defaults, and each
          automatically participate in cross-department Orchestration.
        </p>
      </div>

      {completed && (
        <p className="form-note-banner" role="status">
          Organisation structure saved. Add, edit, or remove departments any time — this step
          stays available after setup.
        </p>
      )}

      <OrganisationStructureVisual organisationName={organisationName} departments={departments} />

      <div className="wizard-step2-templates">
        <p className="activity-meta">Start from a template, or fill in your own department below.</p>
        <div className="wizard-step2-template-grid">
          {DEPARTMENT_TEMPLATES.map((template) => (
            <button
              type="button"
              key={template.key}
              className={
                'wizard-step2-template-card' + (selectedTemplateKey === template.key ? ' selected' : '')
              }
              onClick={() => applyTemplate(template)}
            >
              <span className="wizard-step2-template-name">{template.name}</span>
              <span className="wizard-step2-template-desc">{template.description}</span>
            </button>
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
          <label htmlFor="wizard-dept-name">Department name</label>
          <input
            id="wizard-dept-name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="e.g. Engineering"
            disabled={creating}
          />
        </div>

        <div>
          <label htmlFor="wizard-dept-description">Description</label>
          <textarea
            id="wizard-dept-description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="What this department does, in a sentence."
            disabled={creating}
            rows={2}
          />
        </div>

        <div>
          <label htmlFor="wizard-dept-purpose">Purpose</label>
          <textarea
            id="wizard-dept-purpose"
            value={form.purpose}
            onChange={(event) => setForm({ ...form, purpose: event.target.value })}
            placeholder="Why this department exists for your organisation specifically."
            disabled={creating}
            rows={2}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={creating || !form.name.trim()}>
          {creating ? 'Creating...' : 'Create Department'}
        </button>
      </form>

      {departments.length > 0 && (
        <ul className="wizard-step2-dept-list">
          {departments.map((department) =>
            editingId === department.id ? (
              <li key={department.id} className="wizard-step2-dept-item editing">
                <form className="contact-form" onSubmit={handleEditSave} noValidate>
                  {editError && (
                    <p className="form-error" role="alert">
                      {editError}
                    </p>
                  )}
                  <input
                    value={editForm.name}
                    onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                    aria-label="Department name"
                    disabled={savingEdit}
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                    aria-label="Department description"
                    rows={2}
                    disabled={savingEdit}
                  />
                  <textarea
                    value={editForm.purpose}
                    onChange={(event) => setEditForm({ ...editForm, purpose: event.target.value })}
                    aria-label="Department purpose"
                    rows={2}
                    disabled={savingEdit}
                  />
                  <div className="wizard-step2-edit-actions">
                    <button className="btn btn-primary" type="submit" disabled={savingEdit || !editForm.name.trim()}>
                      {savingEdit ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={cancelEdit} disabled={savingEdit}>
                      Cancel
                    </button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={department.id} className="wizard-step2-dept-item">
                <div>
                  <p className="wizard-step2-dept-item-name">{department.name}</p>
                  {department.description && <p className="activity-meta">{department.description}</p>}
                  {department.purpose && <p className="activity-meta">{department.purpose}</p>}
                </div>
                <button className="btn btn-secondary" type="button" onClick={() => startEdit(department)}>
                  Edit
                </button>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
