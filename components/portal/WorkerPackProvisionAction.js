'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';

/**
 * Phase 0 Package Q — the "turn a completed sale into a provisioned
 * customer environment" action for a Marketplace content pack: creates a
 * real Worker row per persona template in this pack, atomically, subject
 * to the organisation's entitlement worker_limit
 * (services/worker_pack_provisioning_service.py). Admin-only, mirroring
 * every other worker-creating action's role gate.
 */
export default function WorkerPackProvisionAction({ workerPackSlug }) {
  const { user } = useAuth();
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const router = useRouter();

  if (user?.role !== 'admin') {
    return null;
  }

  async function handleProvision() {
    setError(null);
    setProvisioning(true);

    try {
      const response = await fetch('/api/portal/worker-pack-provisioning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_pack_slug: workerPackSlug }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to provision this pack.');
      }

      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to provision this pack.');
    } finally {
      setProvisioning(false);
    }
  }

  if (result) {
    return (
      <p className="form-note-banner" role="status">
        Provisioned {result.provisioning.workers_created} worker
        {result.provisioning.workers_created === 1 ? '' : 's'} from this pack. Find them under
        Workers.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="btn btn-primary" onClick={handleProvision} disabled={provisioning}>
        {provisioning ? 'Provisioning...' : 'Provision this pack'}
      </button>
    </div>
  );
}
