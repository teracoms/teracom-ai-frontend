'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import EmptyState from '@/components/portal/EmptyState';

/**
 * Assign/remove knowledge for one worker. `assigned` and `available` are the
 * server-fetched arrays for this render (GET /worker-knowledge/{workerId} and
 * GET /knowledge/, minus whatever's already assigned) — mutations go through
 * the same-origin BFF proxy at /api/portal/workers/[workerId]/knowledge
 * (never straight to the backend from the browser), then router.refresh()
 * re-runs the parent Server Component's fetches so this list reflects the
 * new server state.
 */
export default function WorkerKnowledgeAssignment({ workerId, assigned, available }) {
  const [selectedId, setSelectedId] = useState(available[0]?.id ?? '');
  const [pendingRemovalId, setPendingRemovalId] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  function knowledgeUrl(knowledgeId) {
    return `/api/portal/workers/${workerId}/knowledge?knowledgeId=${encodeURIComponent(knowledgeId)}`;
  }

  async function handleAssign(event) {
    event.preventDefault();
    if (!selectedId) return;

    setError(null);
    setAssigning(true);

    try {
      const response = await fetch(knowledgeUrl(selectedId), { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to assign knowledge.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign knowledge.');
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemove(knowledgeId) {
    setError(null);
    setPendingRemovalId(knowledgeId);

    try {
      const response = await fetch(knowledgeUrl(knowledgeId), { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to remove knowledge.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove knowledge.');
    } finally {
      setPendingRemovalId(null);
    }
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {assigned.length === 0 ? (
        <EmptyState
          title="No knowledge assigned"
          description="Assign a knowledge document below so this worker can use it in chat."
        />
      ) : (
        <ul className="activity-list">
          {assigned.map((item) => (
            <li key={item.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">{item.title}</p>
                  <p className="activity-meta">Source: {item.source}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => handleRemove(item.id)}
                  disabled={pendingRemovalId === item.id}
                >
                  {pendingRemovalId === item.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 ? (
        <form className="assign-form" onSubmit={handleAssign}>
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            aria-label="Knowledge to assign"
          >
            {available.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="btn btn-primary btn-small"
            disabled={assigning || !selectedId}
          >
            {assigning ? 'Assigning...' : 'Assign Knowledge'}
          </button>
        </form>
      ) : assigned.length > 0 ? (
        <p className="form-note">
          All of your organisation&apos;s knowledge is already assigned to this worker.
        </p>
      ) : (
        <p className="form-note">
          No knowledge documents exist yet in your organisation — upload one to assign it here.
        </p>
      )}
    </div>
  );
}
