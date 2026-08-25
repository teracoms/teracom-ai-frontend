'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- fixes UX_REVIEW_CUSTOMER_PLATFORM_V1.md
 * §H4: the first correction/removal workflow this product has ever had for
 * any memory. A soft-delete ("archive"), not a physical delete -- see
 * models/worker_memory.py (backend) for the full rationale. Reused across
 * all three memory tiers via `archiveUrl` (the same-origin proxy route,
 * already scoped to worker/department/organisation by its own path) and
 * `body` (the extra id that route needs, if any). Admin-gated client-side
 * the same way CreateWorkerForm/CreateDepartmentForm are -- the backend is
 * the real enforcement (require_role("admin") on every archive route).
 */
export default function MemoryArchiveControl({ archiveUrl, body, archived = false }) {
  const { user } = useAuth();
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  if (!isAtLeastRole(user?.role, 'admin')) {
    return archived ? <span className="badge">Archived</span> : null;
  }

  if (archived) {
    return <span className="badge">Archived</span>;
  }

  async function handleArchive() {
    setError(null);
    setArchiving(true);

    try {
      const response = await fetch(archiveUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to archive this memory.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to archive this memory.');
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn btn-secondary btn-small" disabled={archiving} onClick={handleArchive}>
        {archiving ? 'Archiving...' : 'Archive'}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
