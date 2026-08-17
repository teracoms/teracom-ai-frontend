'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Phase 0 Package L — admin-only, the concrete governance-control
 * deliverable (objective #6): turns Federation consultation off for
 * this organisation entirely, regardless of tier. Mirrors
 * DepartmentFunctionControl's shape.
 */
export default function FederationEnabledToggle({ organisation }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleChange(event) {
    const enabled = event.target.checked;

    setError(null);
    setSaving(true);

    try {
      const response = await fetch('/api/portal/organisations/federation-enabled', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ federation_enabled: enabled }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this organisation's federation setting.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this organisation's federation setting.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={organisation.federation_enabled}
          onChange={handleChange}
          disabled={saving}
          aria-label="Federation consultation enabled"
        />{' '}
        Federation consultation enabled
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
