'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import TaskPanel from '@/components/portal/TaskPanel';

/**
 * Project tracking (Phase 0 Package N, objective: retrofit Project
 * Manager Worker with real project/task delivery mechanics). Created
 * directly, no submit/decide step — operational execution tracking,
 * not a financial or contractual commitment, unlike Proposal/Quote/
 * Contract/DepartmentBudget's submit -> admin-decide shape.
 *
 * Parametrised by an optional `departmentId` (mirrors
 * DepartmentBudgetPanel): when given, the create form is pre-scoped to
 * that department and hidden from the picker; when omitted (the
 * org-wide Operations workspace), a department picker is shown
 * instead. Each project row expands into its own TaskPanel, filtering
 * `tasks` by project_id client-side rather than a second network
 * round trip.
 */
export default function ProjectPanel({ departmentId, departments, projects, tasks }) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(departmentId ?? '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          department_id: departmentId ?? selectedDepartmentId ?? undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create this project.');
      }

      setName('');
      setDescription('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create this project.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(projectId, status) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this project's status.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this project's status.");
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Projects</span>
        <h2>Project & task delivery.</h2>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        {!departmentId && departments?.length > 0 && (
          <select
            value={selectedDepartmentId}
            onChange={(event) => setSelectedDepartmentId(event.target.value)}
            disabled={submitting}
            aria-label="Department"
          >
            <option value="">No department (organisation-wide)</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Project name"
          disabled={submitting}
          aria-label="Project name"
        />
        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (optional)"
          disabled={submitting}
          aria-label="Description"
        />
        <button className="btn btn-primary" type="submit" disabled={submitting || !name.trim()}>
          {submitting ? 'Creating...' : 'Create Project'}
        </button>
      </form>

      {(!projects || projects.length === 0) ? (
        <p className="activity-meta">No projects yet.</p>
      ) : (
        <ul className="activity-list">
          {projects.map((project) => (
            <li key={project.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {project.name} <span className="badge">{project.status}</span>
                  </p>
                  {project.description && <p className="activity-meta">{project.description}</p>}
                </div>
                <div>
                  <select
                    value={project.status}
                    onChange={(event) => handleStatusChange(project.id, event.target.value)}
                    aria-label={`Status for ${project.name}`}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>{' '}
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setExpandedProjectId(expandedProjectId === project.id ? null : project.id)}
                  >
                    {expandedProjectId === project.id ? 'Hide Tasks' : 'View Tasks'}
                  </button>
                </div>
              </div>
              {expandedProjectId === project.id && (
                <TaskPanel
                  projectId={project.id}
                  tasks={(tasks ?? []).filter((task) => task.project_id === project.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
