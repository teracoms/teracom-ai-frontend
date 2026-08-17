'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Phase 0 Package J — admin-only, mirrors AssignDepartmentHeadControl's
 * shape. Lets the executive dashboard identify "the Sales department"/
 * "the Customer Success department" reliably (objective #10) rather than
 * guessing from free-text name/description.
 */
export default function DepartmentFunctionControl({ department }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleChange(event) {
    const value = event.target.value;
    const functionTag = value === '' ? null : value;

    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/portal/departments/${department.id}/function`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ function: functionTag }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this department's function.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this department's function.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label>
        Function:{' '}
        <select
          value={department.function ?? ''}
          onChange={handleChange}
          disabled={saving}
          aria-label={`Set a function for ${department.name}`}
        >
          <option value="">None</option>
          <option value="sales">Sales</option>
          <option value="customer_success">Customer Success</option>
          <option value="marketing">Marketing</option>
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
