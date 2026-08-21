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
 */
export default function TaskStatusControl({ taskId, status }) {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
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

  if (!isAtLeastRole(user?.role, 'employee')) {
    return <span className="badge">{status}</span>;
  }

  return (
    <div>
      <select value={status} onChange={handleChange} disabled={updating} aria-label="Task status">
        <option value="pending">Pending</option>
        <option value="in_progress">In progress</option>
        <option value="done">Done</option>
      </select>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
