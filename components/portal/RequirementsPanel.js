'use client';

import { useState } from 'react';

const STATUS_LABELS = { draft: 'Draft', in_review: 'In Review', confirmed: 'Confirmed' };
const STATUS_BADGE = { draft: 'badge-muted', in_review: 'badge-warn', confirmed: 'badge-ok' };
const LIST_FIELDS = [
  ['objectives', 'Objectives'],
  ['constraints', 'Constraints'],
  ['inputs', 'Inputs'],
  ['files', 'Files'],
  ['questions_outstanding', 'Questions Outstanding'],
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-AU', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function emptyContent() {
  return { project_name: '', objectives: [], constraints: [], inputs: [], files: [], questions_outstanding: [], department_ownership: '' };
}

function contentToFormState(content) {
  const base = emptyContent();
  if (!content) return base;
  return {
    project_name: content.project_name ?? '',
    objectives: content.objectives ?? [],
    constraints: content.constraints ?? [],
    inputs: content.inputs ?? [],
    files: content.files ?? [],
    questions_outstanding: content.questions_outstanding ?? [],
    department_ownership: content.department_ownership ?? '',
  };
}

/**
 * AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- Requirements Engine
 * (focus area 1). A living document: auto-generate from this project's
 * real conversation, edit manually (creates a new version, never
 * overwrites), move through draft/in_review/confirmed, and see the full
 * version history -- the same version/is_latest shape
 * ProjectOutputsPanel.js already established for outputs.
 */
export default function RequirementsPanel({ projectId, requirement: initialRequirement }) {
  const [requirement, setRequirement] = useState(initialRequirement);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(contentToFormState(initialRequirement?.content));
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState(null);

  const [versions, setVersions] = useState(null);
  const [loadingVersions, setLoadingVersions] = useState(false);

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const response = await fetch(`/api/portal/projects/${projectId}/requirements/generate`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to generate requirements right now.');
      setRequirement(data);
      setForm(contentToFormState(data.content));
      setVersions(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate requirements right now.');
    } finally {
      setGenerating(false);
    }
  }

  function handleListFieldChange(field, index, value) {
    setForm((current) => {
      const next = [...current[field]];
      next[index] = value;
      return { ...current, [field]: next };
    });
  }

  function handleAddListItem(field) {
    setForm((current) => ({ ...current, [field]: [...current[field], ''] }));
  }

  function handleRemoveListItem(field, index) {
    setForm((current) => ({ ...current, [field]: current[field].filter((_, i) => i !== index) }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const content = {
        ...form,
        objectives: form.objectives.filter((v) => v.trim()),
        constraints: form.constraints.filter((v) => v.trim()),
        inputs: form.inputs.filter((v) => v.trim()),
        files: form.files.filter((v) => v.trim()),
        questions_outstanding: form.questions_outstanding.filter((v) => v.trim()),
        department_ownership: form.department_ownership.trim() || null,
      };
      const response = await fetch(`/api/portal/projects/${projectId}/requirements`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to save requirements.');
      setRequirement(data);
      setEditing(false);
      setVersions(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save requirements.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus) {
    setError(null);
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/portal/projects/${projectId}/requirements/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to update status.');
      setRequirement(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleToggleVersions() {
    if (versions !== null) {
      setVersions(null);
      return;
    }
    setLoadingVersions(true);
    try {
      const response = await fetch(`/api/portal/projects/${projectId}/requirements/versions`);
      const data = await response.json().catch(() => []);
      if (response.ok) setVersions(data);
    } finally {
      setLoadingVersions(false);
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Requirements</span>
        <h3>A living requirements document, built from this project&apos;s conversation.</h3>
      </div>
      <p className="form-note">
        Generate it from the conversation in the Conversation tab, edit it by hand any time, and move
        it through Draft, In Review, and Confirmed as the project firms up. Every change keeps the
        previous version — nothing is overwritten.
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '1rem 0' }}>
        <button type="button" className="btn btn-primary btn-small" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating...' : requirement ? 'Regenerate from Conversation' : 'Generate from Conversation'}
        </button>
        {requirement && !editing && (
          <button type="button" className="btn btn-secondary btn-small" onClick={() => setEditing(true)}>
            Edit Manually
          </button>
        )}
        {requirement && (
          <button type="button" className="btn btn-secondary btn-small" onClick={handleToggleVersions}>
            {versions !== null ? 'Hide Version History' : 'View Version History'}
          </button>
        )}
      </div>

      {!requirement && !editing ? (
        <p className="activity-meta">No requirements document yet — generate one from the conversation above.</p>
      ) : editing ? (
        <form className="contact-form" onSubmit={handleSave} noValidate>
          <input
            type="text"
            value={form.project_name}
            onChange={(event) => setForm((current) => ({ ...current, project_name: event.target.value }))}
            placeholder="Project name"
            aria-label="Project name"
          />
          <input
            type="text"
            value={form.department_ownership}
            onChange={(event) => setForm((current) => ({ ...current, department_ownership: event.target.value }))}
            placeholder="Department ownership (e.g. Sales)"
            aria-label="Department ownership"
          />

          {LIST_FIELDS.map(([field, label]) => (
            <div key={field} style={{ marginTop: '1rem' }}>
              <p className="eyebrow">{label}</p>
              {form[field].map((value, index) => (
                <div key={`${field}-${index}`} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <input
                    type="text"
                    value={value}
                    onChange={(event) => handleListFieldChange(field, index, event.target.value)}
                    aria-label={`${label} item ${index + 1}`}
                  />
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => handleRemoveListItem(field, index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-small" onClick={() => handleAddListItem(field)}>
                Add {label.slice(0, -1) || label}
              </button>
            </div>
          ))}

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save as New Version'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => { setEditing(false); setForm(contentToFormState(requirement?.content)); }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="card">
          <div className="assignment-row">
            <div>
              <p className="activity-title">
                {requirement.content.project_name || 'Untitled'}{' '}
                <span className={`badge ${STATUS_BADGE[requirement.status] || 'badge-muted'}`}>
                  {STATUS_LABELS[requirement.status] || requirement.status}
                </span>{' '}
                <span className="badge badge-muted">v{requirement.version}</span>
              </p>
              <p className="activity-meta">
                {requirement.generated_by === 'auto' ? 'Auto-generated' : 'Manually edited'} · {formatDate(requirement.created_at)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {Object.keys(STATUS_LABELS)
                .filter((status) => status !== requirement.status)
                .map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => handleStatusChange(status)}
                    disabled={updatingStatus}
                  >
                    Mark {STATUS_LABELS[status]}
                  </button>
                ))}
            </div>
          </div>

          {requirement.content.department_ownership && (
            <p className="activity-meta" style={{ marginTop: '0.75rem' }}>
              Owned by: {requirement.content.department_ownership}
            </p>
          )}

          {LIST_FIELDS.map(([field, label]) => (
            requirement.content[field]?.length > 0 && (
              <div key={field} style={{ marginTop: '0.75rem' }}>
                <p className="eyebrow">{label}</p>
                <ul>
                  {requirement.content[field].map((item, index) => (
                    <li key={`${field}-${index}`} className="activity-meta">{item}</li>
                  ))}
                </ul>
              </div>
            )
          ))}
        </div>
      )}

      {versions !== null && (
        <div style={{ marginTop: '1.5rem' }}>
          <p className="eyebrow">Version History</p>
          {loadingVersions ? (
            <p className="activity-meta">Loading versions...</p>
          ) : (
            <ul className="activity-list">
              {versions.map((version) => (
                <li key={version.id}>
                  <p className="activity-meta">
                    v{version.version} — {STATUS_LABELS[version.status] || version.status} —{' '}
                    {version.generated_by === 'auto' ? 'Auto-generated' : 'Manual'} — {formatDate(version.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
