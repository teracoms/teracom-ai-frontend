'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * Campaign management (Phase 0 Package K, objective #5). A Marketing
 * Manager creates the campaign that starts the Content Producer -> Video
 * Producer pipeline (objective #12). POST /api/portal/campaigns → POST
 * /campaigns/, backend-gated at employee tier and above (Read Only Tier
 * Enforcement) — the form itself is hidden below that tier, a
 * presentation-layer convenience mirroring the rest of this file's own
 * admin-only Decide-button pattern elsewhere in this codebase.
 */
export default function CampaignForm() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/portal/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          objective: objective.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create this campaign.');
      }

      setName('');
      setObjective('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create this campaign.');
    } finally {
      setLoading(false);
    }
  }

  if (!isAtLeastRole(user?.role, 'employee')) {
    return <p className="form-note">You have read-only access and can&apos;t create a campaign.</p>;
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Campaign name"
        disabled={loading}
        aria-label="Campaign name"
      />
      <input
        type="text"
        value={objective}
        onChange={(event) => setObjective(event.target.value)}
        placeholder="Objective (optional)"
        disabled={loading}
        aria-label="Campaign objective"
      />

      <button className="btn btn-primary" type="submit" disabled={loading || !name.trim()}>
        {loading ? 'Creating...' : 'Create Campaign'}
      </button>
    </form>
  );
}
