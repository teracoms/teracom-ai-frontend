'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// PATCH /api/portal/workers/{workerId}/department → PATCH
// /workers/{worker_id}/department. Admin-only backend-side; selecting
// "None" clears the assignment.
export default function AssignWorkerDepartmentControl({ worker, departments }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleChange(event) {
    const value = event.target.value;
    const departmentId = value === '' ? null : value;

    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/portal/workers/${worker.id}/department`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_id: departmentId }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update this assignment.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this assignment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <select
        value={worker.department_id ?? ''}
        onChange={handleChange}
        disabled={saving}
        aria-label={`Assign ${worker.name} to a department`}
      >
        <option value="">No department</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
