'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * MULTI_ORGANISATION_PLATFORM_V1 -- Worker Evolution Model Phase 3
 * (teracom-ai-docs/TERACOM_DECISIONS.md SD-015/SD-016) made real in
 * the GUI: organisation-scoped Worker Pools (e.g. "Developer Pool"),
 * each with an admin-set `capacity` ceiling itself bounded by the
 * organisation's own entitlement worker_limit. Creating a pool and
 * assigning a worker into one are both admin-tier backend-side,
 * matching every other organisational-structure action (departments,
 * governance rules).
 */
export default function WorkerPoolsPanel({ pools, workers }) {
  const { user } = useAuth();
  const canManage = isAtLeastRole(user?.role, 'admin');
  const router = useRouter();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [assigningWorkerId, setAssigningWorkerId] = useState(null);
  const [assignError, setAssignError] = useState(null);

  async function handleCreate(event) {
    event.preventDefault();
    if (!name.trim() || !role.trim()) return;

    setCreateError(null);
    setCreating(true);

    try {
      const response = await fetch('/api/portal/worker-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), role: role.trim(), capacity: Number(capacity) }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create this worker pool.');
      }

      setName('');
      setRole('');
      setCapacity('1');
      router.refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unable to create this worker pool.');
    } finally {
      setCreating(false);
    }
  }

  async function handleAssign(workerId, workerPoolId) {
    setAssignError(null);
    setAssigningWorkerId(workerId);

    try {
      const response = await fetch(`/api/portal/worker-pools/workers/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_pool_id: workerPoolId || null }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this worker's pool assignment.");
      }

      router.refresh();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Unable to update this worker's pool assignment.");
    } finally {
      setAssigningWorkerId(null);
    }
  }

  const memberCountByPoolId = new Map();
  for (const worker of workers ?? []) {
    if (!worker.worker_pool_id) continue;
    memberCountByPoolId.set(worker.worker_pool_id, (memberCountByPoolId.get(worker.worker_pool_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Worker Pools</span>
        <h2>Organisation-scoped worker pools.</h2>
        <p>
          A pool groups several same-role workers (e.g. a Developer Pool) so tasks can be routed to
          whichever member is available, rather than one fixed worker. Pools exist inside your
          organisation only — never shared with another organisation.
        </p>
      </div>

      {!canManage ? (
        <p className="form-note">Only an admin can create pools or assign workers to them.</p>
      ) : (
        <form className="contact-form" onSubmit={handleCreate} noValidate>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Pool name, e.g. Developer Pool"
            disabled={creating}
            aria-label="Pool name"
          />
          <input
            type="text"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Role, e.g. Software Developer"
            disabled={creating}
            aria-label="Pool role"
          />
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            disabled={creating}
            aria-label="Capacity"
          />
          <button
            className="btn btn-primary btn-small"
            type="submit"
            disabled={creating || !name.trim() || !role.trim()}
          >
            {creating ? 'Creating...' : 'Create Pool'}
          </button>
        </form>
      )}
      {createError && (
        <p className="form-error" role="alert">
          {createError}
        </p>
      )}

      {(!pools || pools.length === 0) ? (
        <p className="activity-meta">No worker pools yet.</p>
      ) : (
        <ul className="activity-list">
          {pools.map((pool) => (
            <li key={pool.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {pool.name} <span className="badge">{pool.role}</span>
                  </p>
                  <p className="activity-meta">
                    {memberCountByPoolId.get(pool.id) ?? 0} / {pool.capacity} member(s)
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canManage && (pools ?? []).length > 0 && (
        <div style={{ marginTop: '28px' }}>
          <div className="section-heading left">
            <span className="eyebrow">Assign Workers</span>
            <h3>Assign a worker into a pool.</h3>
          </div>
          {assignError && (
            <p className="form-error" role="alert">
              {assignError}
            </p>
          )}
          {(!workers || workers.length === 0) ? (
            <p className="activity-meta">No workers yet.</p>
          ) : (
            <ul className="activity-list">
              {workers.map((worker) => (
                <li key={worker.id}>
                  <div className="assignment-row">
                    <div>
                      <p className="activity-title">{worker.name}</p>
                      <p className="activity-meta">{worker.role}</p>
                    </div>
                    <select
                      value={worker.worker_pool_id ?? ''}
                      onChange={(event) => handleAssign(worker.id, event.target.value)}
                      disabled={assigningWorkerId === worker.id}
                      aria-label={`Pool for ${worker.name}`}
                    >
                      <option value="">No pool</option>
                      {pools.map((pool) => (
                        <option key={pool.id} value={pool.id}>
                          {pool.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
