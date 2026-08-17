'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Phase 0 Package I — admin-only, matches AssignWorkerDepartmentControl's
 * shape. Only workers already assigned to this department appear as
 * options (teracom-ai-backend rejects any other worker with a 400 —
 * see PATCH /departments/{id}/head), so an admin must assign a worker to
 * the department first (the existing control on this same page) before
 * they can be designated its head.
 */
export default function AssignDepartmentHeadControl({ department, workers }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const eligibleWorkers = workers.filter((worker) => worker.department_id === department.id);

  async function handleChange(event) {
    const value = event.target.value;
    const workerId = value === '' ? null : value;

    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/portal/departments/${department.id}/head`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: workerId }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this department's head.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this department's head.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label>
        Head:{' '}
        <select
          value={department.head_worker_id ?? ''}
          onChange={handleChange}
          disabled={saving}
          aria-label={`Assign a head for ${department.name}`}
        >
          <option value="">No head</option>
          {eligibleWorkers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.name}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
