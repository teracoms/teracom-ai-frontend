'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STAGE_ORDER = ['prospect', 'lead', 'customer'];
const HEALTH_STATUSES = ['healthy', 'at_risk', 'churned'];

/**
 * Lead management + customer lifecycle tracking (Phase 0 Package J,
 * objectives #3/#7). Stage only ever moves forward — the dropdown only
 * offers the current stage and later ones, so a backward move isn't even
 * offered client-side (the backend would 400 it anyway).
 */
export default function ContactDetail({ contact }) {
  const [stageSaving, setStageSaving] = useState(false);
  const [healthSaving, setHealthSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const currentIndex = STAGE_ORDER.indexOf(contact.stage);
  const availableStages = currentIndex >= 0 ? STAGE_ORDER.slice(currentIndex) : STAGE_ORDER;

  async function handleStageChange(event) {
    const stage = event.target.value;
    setError(null);
    setStageSaving(true);

    try {
      const response = await fetch(`/api/portal/crm/contacts/${contact.id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this contact's stage.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this contact's stage.");
    } finally {
      setStageSaving(false);
    }
  }

  async function handleHealthChange(event) {
    const healthStatus = event.target.value;
    setError(null);
    setHealthSaving(true);

    try {
      const response = await fetch(`/api/portal/crm/contacts/${contact.id}/health`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ health_status: healthStatus }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this contact's health.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this contact's health.");
    } finally {
      setHealthSaving(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <p className="activity-meta">
        {contact.company || 'No company on file'}
        {contact.email ? ` · ${contact.email}` : ''}
        {contact.phone ? ` · ${contact.phone}` : ''}
        {contact.source ? ` · Source: ${contact.source}` : ''}
      </p>

      <label>
        Stage:{' '}
        <select value={contact.stage} onChange={handleStageChange} disabled={stageSaving} aria-label="Contact stage">
          {availableStages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </label>

      {contact.stage === 'customer' && (
        <label>
          {' '}
          Health:{' '}
          <select
            value={contact.health_status ?? ''}
            onChange={handleHealthChange}
            disabled={healthSaving}
            aria-label="Customer health"
          >
            <option value="" disabled>
              Select...
            </option>
            {HEALTH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
