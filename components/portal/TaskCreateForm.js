'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * A project-picking sibling to components/portal/TaskPanel.js's own
 * create form — that one is embedded in a single project's own page, so
 * project_id is implicit. The standalone Tasks page spans every project,
 * so this needs its own selector. Same POST /api/portal/tasks route
 * (already generic on project_id and assignee_worker_id — neither
 * needed a backend or proxy-route change, only this picker), gated at
 * employee tier and above (Read Only Tier Enforcement).
 */
export default function TaskCreateForm({ projects, workers, workerPools }) {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [title, setTitle] = useState('');
  // MULTI_ORGANISATION_PLATFORM_V1 -- a single picker covering both a
  // specific worker and a pool, mirroring TaskPanel.js's own convention.
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !projectId) return;

    setError(null);
    setSubmitting(true);

    const [assigneeKind, assigneeId] = assignee ? assignee.split(':') : [];

    try {
      const response = await fetch('/api/portal/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          title: title.trim(),
          assignee_worker_id: assigneeKind === 'worker' ? assigneeId : undefined,
          assignee_worker_pool_id: assigneeKind === 'pool' ? assigneeId : undefined,
          due_date: dueDate || undefined,
          priority: priority || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create this task.');
      }

      setTitle('');
      setAssignee('');
      setDueDate('');
      setPriority('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create this task.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAtLeastRole(user?.role, 'employee')) {
    return <p className="form-note">You have read-only access and can&apos;t create a task.</p>;
  }

  if (projects.length === 0) {
    return (
      <p className="activity-meta">Create a project first, then you can add tasks to it here.</p>
    );
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <select
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
          disabled={submitting}
          aria-label="Project"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Task title"
          disabled={submitting}
          aria-label="Task title"
        />
        <select
          value={assignee}
          onChange={(event) => setAssignee(event.target.value)}
          disabled={submitting}
          aria-label="Assignee"
        >
          <option value="">Unassigned</option>
          {(workers ?? []).length > 0 && (
            <optgroup label="Workers">
              {workers.map((worker) => (
                <option key={worker.id} value={`worker:${worker.id}`}>
                  {worker.name}
                </option>
              ))}
            </optgroup>
          )}
          {(workerPools ?? []).length > 0 && (
            <optgroup label="Pools">
              {workerPools.map((pool) => (
                <option key={pool.id} value={`pool:${pool.id}`}>
                  {pool.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          disabled={submitting}
          aria-label="Due date"
        />
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          disabled={submitting}
          aria-label="Priority"
        >
          <option value="">No priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button className="btn btn-primary btn-small" type="submit" disabled={submitting || !title.trim()}>
          {submitting ? 'Adding...' : 'Add Task'}
        </button>
      </form>
    </div>
  );
}
