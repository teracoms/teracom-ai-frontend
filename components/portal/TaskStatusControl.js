'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * The status-change control extracted from components/portal/TaskPanel.js
 * so the standalone Tasks page (app/portal/(protected)/tasks/page.js) can
 * reuse the exact same PATCH /api/portal/tasks/{id}/status call without
 * duplicating it — same endpoint, same behaviour, just usable outside a
 * single project's own panel. Gated at employee tier and above (Read
 * Only Tier Enforcement).
 *
 * AUTONOMOUS_EXECUTION_V1/AUTONOMOUS_ORGANISATION_V1 — also the real
 * Execute action, admin-tier only (stricter than the employee-tier
 * status control above it), mirroring TaskPanel.js's own addition so
 * this capability is reachable from the primary, cross-project Tasks
 * page a user actually lands on, not only a single project's expanded
 * task list.
 */
export default function TaskStatusControl({ taskId, status, assigneeWorkerId }) {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [execution, setExecution] = useState(null);
  const router = useRouter();

  async function handleChange(event) {
    const newStatus = event.target.value;
    setError(null);
    setUpdating(true);

    try {
      const response = await fetch(`/api/portal/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this task's status.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this task's status.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleExecute() {
    setError(null);
    setExecuting(true);

    try {
      const response = await fetch(`/api/portal/tasks/${taskId}/execute`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to execute this task.');
      }

      setExecution(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to execute this task.');
    } finally {
      setExecuting(false);
    }
  }

  if (!isAtLeastRole(user?.role, 'employee')) {
    return <span className="badge">{status}</span>;
  }

  const canExecute = isAtLeastRole(user?.role, 'admin');

  return (
    <div>
      <select value={status} onChange={handleChange} disabled={updating} aria-label="Task status">
        <option value="pending">Pending</option>
        <option value="in_progress">In progress</option>
        <option value="done">Done</option>
        <option value="failed">Failed</option>
      </select>
      {canExecute && assigneeWorkerId && (
        <button
          type="button"
          className="btn btn-secondary btn-small"
          disabled={executing}
          onClick={handleExecute}
        >
          {executing ? 'Executing...' : 'Execute'}
        </button>
      )}
      {execution && (
        <p className="activity-meta">
          Last execution:{' '}
          <span className="badge">{execution.verification_result?.passed ? 'Verified' : 'Failed'}</span>{' '}
          ({execution.steps?.length ?? 0} step(s) taken)
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
