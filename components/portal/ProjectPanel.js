'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';
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
export default function ProjectPanel({ departmentId, departments, projects, tasks, workers, workerPools }) {
  const { user } = useAuth();
  const canWrite = isAtLeastRole(user?.role, 'employee');
  // AUTONOMOUS_ORGANISATION_V1 — Human -> Objective -> Project. Same
  // stricter admin-tier gate as TaskPanel's Execute action, matching
  // the backend's own require_role("admin") on POST /projects/plan.
  const canPlan = isAtLeastRole(user?.role, 'admin');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(departmentId ?? '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const router = useRouter();

  const [planWorkerId, setPlanWorkerId] = useState('');
  const [planObjective, setPlanObjective] = useState('');
  const [planName, setPlanName] = useState('');
  const [planning, setPlanning] = useState(false);
  const [planResult, setPlanResult] = useState(null);
  const [planError, setPlanError] = useState(null);

  async function handlePlan(event) {
    event.preventDefault();
    if (!planWorkerId || !planObjective.trim() || !planName.trim()) return;

    setPlanError(null);
    setPlanResult(null);
    setPlanning(true);

    try {
      const response = await fetch('/api/portal/projects/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_worker_id: planWorkerId,
          objective: planObjective.trim(),
          name: planName.trim(),
          department_id: departmentId ?? selectedDepartmentId ?? undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to plan this project.');
      }

      setPlanResult(data);

      if (data.available) {
        setPlanObjective('');
        setPlanName('');
        router.refresh();
      }
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Unable to plan this project.');
    } finally {
      setPlanning(false);
    }
  }

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

      {!canWrite ? (
        <p className="form-note">You have read-only access and can&apos;t create a project.</p>
      ) : (
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
      )}

      {canPlan && (workers ?? []).length > 0 && (
        <div>
          <div className="section-heading left">
            <span className="eyebrow">Autonomous Delivery</span>
            <h3>Plan a project from an objective.</h3>
          </div>
          <p className="form-note">
            Decomposes your objective into real, worker-assigned tasks automatically (requires a Platinum-tier
            licence — a project is only created when available).
          </p>
          {planError && (
            <p className="form-error" role="alert">
              {planError}
            </p>
          )}
          {planResult && !planResult.available && (
            <p className="form-note">Not available on this organisation&apos;s current licence tier.</p>
          )}
          {planResult?.available && (
            <p className="activity-meta">
              Created &quot;{planResult.project.name}&quot; with {planResult.tasks.length} task(s).
            </p>
          )}
          <form className="contact-form" onSubmit={handlePlan} noValidate>
            <select
              value={planWorkerId}
              onChange={(event) => setPlanWorkerId(event.target.value)}
              disabled={planning}
              aria-label="Lead worker"
            >
              <option value="">Select a lead worker...</option>
              {(workers ?? []).map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
              placeholder="Project name"
              disabled={planning}
              aria-label="Project name"
            />
            <textarea
              value={planObjective}
              onChange={(event) => setPlanObjective(event.target.value)}
              placeholder="Objective, e.g. &quot;1. Build the backend API. 2. Build the frontend UI.&quot;"
              disabled={planning}
              aria-label="Objective"
              rows={3}
            />
            <button
              className="btn btn-primary btn-small"
              type="submit"
              disabled={planning || !planWorkerId || !planObjective.trim() || !planName.trim()}
            >
              {planning ? 'Planning...' : 'Plan Project'}
            </button>
          </form>
        </div>
      )}

      {(!projects || projects.length === 0) ? (
        <p className="activity-meta">No projects yet.</p>
      ) : (
        <ul className="activity-list">
          {projects.map((project) => {
            // MULTI_ORGANISATION_PLATFORM_V1 -- Multi-Project
            // Visibility: a real task-count breakdown per project,
            // computed client-side from the same `tasks` this
            // workspace already fetches once for every project
            // (rather than a second network round trip per project
            // to GET /projects/{id}/status) -- display only; the
            // project's own `status` badge above remains the
            // backend's own authoritative bidirectional-lifecycle
            // value.
            const projectTasks = (tasks ?? []).filter((task) => task.project_id === project.id);
            const counts = projectTasks.reduce(
              (acc, task) => ({ ...acc, [task.status]: (acc[task.status] ?? 0) + 1 }),
              {}
            );

            return (
            <li key={project.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {project.name} <span className="badge">{project.status}</span>
                  </p>
                  {project.description && <p className="activity-meta">{project.description}</p>}
                  {projectTasks.length > 0 && (
                    <p className="activity-meta">
                      {projectTasks.length} task(s) — {counts.done ?? 0} done · {counts.in_progress ?? 0} in
                      progress · {counts.pending ?? 0} pending
                      {counts.failed ? ` · ${counts.failed} failed` : ''}
                    </p>
                  )}
                </div>
                <div>
                  {canWrite && (
                    <>
                      <select
                        value={project.status}
                        onChange={(event) => handleStatusChange(project.id, event.target.value)}
                        aria-label={`Status for ${project.name}`}
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>{' '}
                    </>
                  )}
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
                  tasks={projectTasks}
                  workers={workers}
                  workerPools={workerPools}
                />
              )}
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
