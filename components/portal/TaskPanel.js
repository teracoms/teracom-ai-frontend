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
export default function TaskPanel({ projectId, tasks, workers, workerPools }) {
  const { user } = useAuth();
  const canWrite = isAtLeastRole(user?.role, 'employee');
  // AUTONOMOUS_EXECUTION_V1/AUTONOMOUS_ORGANISATION_V1 — deliberately
  // a stricter gate than canWrite: real, sandboxed code execution is
  // admin-tier backend-side (api/tasks.py#execute_task_route()), not
  // reachable by an ordinary employee-tier task creator.
  const canExecute = isAtLeastRole(user?.role, 'admin');
  const workersById = new Map((workers ?? []).map((worker) => [worker.id, worker]));
  const poolsById = new Map((workerPools ?? []).map((pool) => [pool.id, pool]));
  const [title, setTitle] = useState('');
  // MULTI_ORGANISATION_PLATFORM_V1 -- a single picker covering both a
  // specific worker and a pool, distinguished by a "worker:"/"pool:"
  // prefix on submit rather than two separate selects.
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [executingTaskId, setExecutingTaskId] = useState(null);
  const [executions, setExecutions] = useState({});
  const router = useRouter();

  async function handleExecute(taskId) {
    setError(null);
    setExecutingTaskId(taskId);

    try {
      const response = await fetch(`/api/portal/tasks/${taskId}/execute`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to execute this task.');
      }

      setExecutions((prev) => ({ ...prev, [taskId]: data }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to execute this task.');
    } finally {
      setExecutingTaskId(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return;

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
                      : task.assignee_worker_pool_id
                        ? `Routed to ${poolsById.get(task.assignee_worker_pool_id)?.name ?? 'a pool'} (not yet assigned)`
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
                    <option value="failed">Failed</option>
                  </select>
                )}
                {canExecute && (task.assignee_worker_id || task.assignee_worker_pool_id) && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    disabled={executingTaskId === task.id}
                    onClick={() => handleExecute(task.id)}
                  >
                    {executingTaskId === task.id && <span className="btn-spinner" aria-hidden="true" />}
                    {executingTaskId === task.id ? 'Executing...' : 'Execute'}
                  </button>
                )}
              </div>
              {executions[task.id] && (
                <p className="activity-meta">
                  Last execution:{' '}
                  <span className="badge">
                    {executions[task.id].verification_result?.passed ? 'Verified' : 'Failed'}
                  </span>{' '}
                  ({executions[task.id].steps?.length ?? 0} step(s) taken)
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
