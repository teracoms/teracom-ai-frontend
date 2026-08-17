'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STAGE_ORDER = ['planning', 'active', 'completed'];

/**
 * Campaign management (Phase 0 Package K, objective #5). Stage only ever
 * moves forward — the dropdown only offers the current stage and later
 * ones, so a backward move isn't even offered client-side (the backend
 * would 400 it anyway).
 */
export default function CampaignDetail({ campaign }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const currentIndex = STAGE_ORDER.indexOf(campaign.stage);
  const availableStages = currentIndex >= 0 ? STAGE_ORDER.slice(currentIndex) : STAGE_ORDER;

  async function handleStageChange(event) {
    const stage = event.target.value;
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/portal/campaigns/${campaign.id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this campaign's stage.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this campaign's stage.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <p className="activity-meta">{campaign.objective || 'No objective on file'}</p>

      <label>
        Stage:{' '}
        <select value={campaign.stage} onChange={handleStageChange} disabled={saving} aria-label="Campaign stage">
          {availableStages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
