'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- extracted from
 * components/portal/ProjectPanel.js the same way TaskStatusControl.js was
 * extracted from TaskPanel.js, so the new standalone project detail page
 * (app/portal/(protected)/projects/[projectId]/page.js) can reuse the exact
 * same PATCH /api/portal/projects/{id}/status call ProjectPanel already
 * makes, without duplicating it. Gated at employee tier and above, matching
 * ProjectPanel's own `canWrite` gate.
 */
export default function ProjectStatusControl({ projectId, status }) {
  const { user } = useAuth();
  const canWrite = isAtLeastRole(user?.role, 'employee');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleChange(event) {
    const newStatus = event.target.value;
    setError(null);
    setUpdating(true);

    try {
      const response = await fetch(`/api/portal/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this project's status.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this project's status.");
    } finally {
      setUpdating(false);
    }
  }

  if (!canWrite) {
    return <span className="badge">{status}</span>;
  }

  return (
    <div>
      <select value={status} onChange={handleChange} disabled={updating} aria-label="Project status">
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="blocked">Blocked</option>
        <option value="archived">Archived</option>
      </select>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
