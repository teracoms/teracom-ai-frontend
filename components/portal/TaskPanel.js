'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * Phase 0 Package N (Operations & Project Delivery Platform) — a
 * single project's task list, create form, and status-change controls
 * (operational execution tracking, not a financial or contractual
 * commitment), gated at employee tier and above (Read Only Tier
 * Enforcement).
 */
export default function TaskPanel({ projectId, tasks, workers }) {
  const { user } = useAuth();
  const canWrite = isAtLeastRole(user?.role, 'employee');
  const workersById = new Map((workers ?? []).map((worker) => [worker.id, worker]));
  const [title, setTitle] = useState('');
  const [assigneeWorkerId, setAssigneeWorkerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          title: title.trim(),
          assignee_worker_id: assigneeWorkerId || undefined,
          due_date: dueDate || undefined,
          priority: priority || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create this task.');
      }

      setTitle('');
      setAssigneeWorkerId('');
      setDueDate('');
      setPriority('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create this task.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(taskId, status) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this task's status.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this task's status.");
    }
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {canWrite ? (
      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Task title"
          disabled={submitting}
          aria-label="Task title"
        />
        <select
          value={assigneeWorkerId}
          onChange={(event) => setAssigneeWorkerId(event.target.value)}
          disabled={submitting}
          aria-label="Assignee"
        >
          <option value="">Unassigned</option>
          {(workers ?? []).map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.name}
            </option>
          ))}
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
      ) : (
        <p className="form-note">You have read-only access and can&apos;t create a task.</p>
      )}

      {(!tasks || tasks.length === 0) ? (
        <p className="activity-meta">No tasks yet.</p>
      ) : (
        <ul className="activity-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {task.title} <span className="badge">{task.status}</span>
                  </p>
                  <p className="activity-meta">
                    {task.assignee_worker_id
                      ? `Assigned to ${workersById.get(task.assignee_worker_id)?.name ?? 'a worker'}`
                      : 'Unassigned'}
                    {' · '}
                    {task.priority ? `${task.priority} priority` : 'No priority'}
                    {task.due_date ? ` · due ${task.due_date}` : ''}
                  </p>
                </div>
                {canWrite && (
                  <select
                    value={task.status}
                    onChange={(event) => handleStatusChange(task.id, event.target.value)}
                    aria-label={`Status for ${task.title}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
