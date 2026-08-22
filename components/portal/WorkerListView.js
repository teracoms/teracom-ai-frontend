'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import WorkerCard from '@/components/portal/WorkerCard';
import EmptyState from '@/components/portal/EmptyState';

/**
 * Client-side search/filter over the full worker list. teracom-ai-backend's
 * worker list endpoints (GET /worker-list/, GET /workers/) accept no query
 * parameters at all — no server-side filtering, sorting or pagination exists
 * (FRONTEND_ARCHITECTURE_V1.md §B.5.7) — so this filters the already-fetched
 * array in the browser. Fine at the list sizes a single organisation has
 * today; would need a backend filter param if that ever changes.
 */
export default function WorkerListView({ workers, canCreate, departmentNamesById = {} }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    return workers.filter((worker) => {
      const matchesQuery =
        !normalisedQuery ||
        worker.name.toLowerCase().includes(normalisedQuery) ||
        worker.role.toLowerCase().includes(normalisedQuery);
      const matchesStatus = status === 'all' || worker.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [workers, query, status]);

  return (
    <div>
      <div className="workers-toolbar">
        <input
          type="search"
          placeholder="Search by name or role"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search workers"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {canCreate && (
          <Link className="btn btn-primary" href="/portal/workers/new">
            Create Worker
          </Link>
        )}{' '}
        <Link className="btn btn-secondary" href="/portal/workers/requests">
          Propose a Worker
        </Link>
      </div>

      {workers.length === 0 ? (
        <EmptyState
          title="No workers yet"
          description={
            canCreate
              ? 'Create your first AI worker to get started.'
              : 'An organisation admin needs to create your first AI worker.'
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No workers match your search"
          description="Try a different name, role or status filter."
        />
      ) : (
        <div className="product-grid">
          {filtered.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              departmentName={worker.department_id ? departmentNamesById[worker.department_id] : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
