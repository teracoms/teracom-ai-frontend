'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';
import EmptyState from '@/components/portal/EmptyState';

/**
 * Bulk/audit view of the same knowledge↔worker relationship the worker
 * detail page's Knowledge tab (WorkerKnowledgeAssignment.js, Package 3)
 * already manages per-worker — this page is for seeing/auditing everything
 * at once, not a second, competing way to do the same thing carelessly.
 *
 * Assign goes through the new admin-only POST /api/portal/admin/permissions
 * (→ POST /permissions/, admin-gated). Remove reuses the pre-existing
 * DELETE /api/portal/workers/{workerId}/knowledge route from Package 3 (→
 * DELETE /worker-knowledge/remove) — /permissions/ has no delete route of
 * its own (verified against api/permissions.py; see lib/api/admin.js).
 *
 * The assign picker's document list is filtered to exclude pairs already
 * granted for the selected worker. This is a UI-side safeguard only:
 * POST /permissions/ has no deduplication check server-side (unlike
 * POST /worker-knowledge/assign, which does) — verified live, calling it
 * twice for the same pair creates two separate rows. Excluding already-
 * granted pairs here prevents this screen from ever creating that duplicate,
 * even though the backend itself would allow it via a direct API call.
 */
export default function PermissionMatrix({ grants, workers, knowledge }) {
  const { user } = useAuth();
  const canWrite = isAtLeastRole(user?.role, 'employee');
  const [query, setQuery] = useState('');
  const [workerId, setWorkerId] = useState(workers[0]?.id ?? '');
  const [knowledgeId, setKnowledgeId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [pendingRemovalId, setPendingRemovalId] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const filteredGrants = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();
    if (!normalisedQuery) return grants;

    return grants.filter(
      (grant) =>
        grant.workerName.toLowerCase().includes(normalisedQuery) ||
        grant.knowledgeTitle.toLowerCase().includes(normalisedQuery)
    );
  }, [grants, query]);

  const availableKnowledge = useMemo(() => {
    const grantedIds = new Set(
      grants.filter((grant) => grant.workerId === workerId).map((grant) => grant.knowledgeId)
    );
    return knowledge.filter((item) => !grantedIds.has(item.id));
  }, [grants, knowledge, workerId]);

  async function handleAssign(event) {
    event.preventDefault();
    if (!workerId || !knowledgeId) return;

    setError(null);
    setAssigning(true);

    try {
      const response = await fetch('/api/portal/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: workerId, knowledge_id: knowledgeId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create this permission.');
      }

      setKnowledgeId('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create this permission.');
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemove(grant) {
    setError(null);
    setPendingRemovalId(grant.id);

    try {
      const response = await fetch(
        `/api/portal/workers/${grant.workerId}/knowledge?knowledgeId=${encodeURIComponent(grant.knowledgeId)}`,
        { method: 'DELETE' }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to remove this permission.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove this permission.');
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

      <div className="workers-toolbar">
        <input
          type="search"
          placeholder="Search by worker or document"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search permissions"
        />
      </div>

      {grants.length === 0 ? (
        <EmptyState
          title="No permissions granted yet"
          description="Assign a document to a worker below, or from the worker's own Knowledge tab."
        />
      ) : filteredGrants.length === 0 ? (
        <EmptyState title="No permissions match your search" description="Try a different keyword." />
      ) : (
        <ul className="activity-list">
          {filteredGrants.map((grant) => (
            <li key={grant.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">{grant.knowledgeTitle}</p>
                  <p className="activity-meta">Worker: {grant.workerName}</p>
                </div>
                {canWrite && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => handleRemove(grant)}
                    disabled={pendingRemovalId === grant.id}
                  >
                    {pendingRemovalId === grant.id ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!canWrite ? (
        <p className="form-note">You have read-only access and can&apos;t grant document access.</p>
      ) : workers.length === 0 ? (
        <p className="form-note">Create a worker first before granting it document access.</p>
      ) : (
        <form className="assign-form" onSubmit={handleAssign}>
          <select
            value={workerId}
            onChange={(event) => {
              setWorkerId(event.target.value);
              setKnowledgeId('');
            }}
            aria-label="Worker"
          >
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name}
              </option>
            ))}
          </select>

          {availableKnowledge.length > 0 ? (
            <>
              <select
                value={knowledgeId}
                onChange={(event) => setKnowledgeId(event.target.value)}
                aria-label="Document to grant"
              >
                <option value="">Choose a document</option>
                {availableKnowledge.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn btn-primary btn-small"
                disabled={assigning || !knowledgeId}
              >
                {assigning ? 'Granting...' : 'Grant Access'}
              </button>
            </>
          ) : (
            <p className="form-note">
              {knowledge.length === 0
                ? 'No knowledge documents exist yet in your organisation.'
                : 'This worker already has access to all of your organisation’s knowledge.'}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
