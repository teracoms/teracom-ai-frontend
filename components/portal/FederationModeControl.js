'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MODES = [
  {
    value: 'internal_only',
    label: 'Internal Only',
    description: 'Federation is off. Workers can only escalate within your own organisation.',
  },
  {
    value: 'internal_and_internet',
    label: 'Internal + Internet',
    description: 'Workers can also consult the full Federation registry of external AI providers.',
  },
  {
    value: 'external_providers',
    label: 'External Providers',
    description: "Restricts Federation to providers your organisation has approved as available — none until one is.",
  },
];

/**
 * CUSTOMER_UX_ACCEPTANCE_V1 -- "Support configuration for Internal Only /
 * Internal + Internet / External Providers." Successor to
 * FederationEnabledToggle's single checkbox: a real 3-way setting
 * (PATCH /organisations/federation-mode) where "External Providers" has
 * distinct enforcement (see services/federation_provider_service.py),
 * not just cosmetic wording. Mirrors FederationEnabledToggle's own
 * shape (organisation prop, router.refresh() on success).
 */
export default function FederationModeControl({ organisation }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleChange(mode) {
    setError(null);
    setSaving(true);

    try {
      const response = await fetch('/api/portal/organisations/federation-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ federation_mode: mode }),
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
    <fieldset className="federation-mode-control" disabled={saving}>
      <legend>Federation access</legend>
      {MODES.map((mode) => (
        <label key={mode.value} className="federation-mode-option">
          <input
            type="radio"
            name="federation_mode"
            value={mode.value}
            checked={organisation.federation_mode === mode.value}
            onChange={() => handleChange(mode.value)}
          />
          <span>
            <strong>{mode.label}</strong>
            <span className="federation-mode-description">{mode.description}</span>
          </span>
        </label>
      ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
