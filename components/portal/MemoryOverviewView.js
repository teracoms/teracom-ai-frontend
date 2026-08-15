'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import MemoryListItem from '@/components/portal/MemoryListItem';
import EmptyState from '@/components/portal/EmptyState';

/**
 * Cross-worker memory browser, per FRONTEND_ARCHITECTURE_V1.md §C.10:
 * "V1 renders this as a worker-grouped list, not a flat global table, to
 * match what the backend can actually answer efficiently" — there is no
 * org-wide "all memories" endpoint, only GET /memory/{worker_id} per worker
 * (see lib/api/memory.js and the page that fetches this data). `groups` only
 * contains workers that already have at least one memory — filtering here is
 * search-only, over content already fetched, the same client-side pattern
 * WorkerListView/KnowledgeListView established (no backend query params
 * exist for this either).
 */
export default function MemoryOverviewView({ groups }) {
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();
    if (!normalisedQuery) return groups;

    return groups
      .map((group) => ({
        ...group,
        memories: group.memories.filter((memory) =>
          memory.memory_content.toLowerCase().includes(normalisedQuery)
        ),
      }))
      .filter((group) => group.memories.length > 0);
  }, [groups, query]);

  return (
    <div>
      <div className="workers-toolbar">
        <input
          type="search"
          placeholder="Search memory content across all workers"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search memories"
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No memories yet"
          description="Facts get captured automatically during chat sessions, or added manually from a worker's memory page."
        />
      ) : filteredGroups.length === 0 ? (
        <EmptyState title="No memories match your search" description="Try a different keyword." />
      ) : (
        <div className="memory-groups">
          {filteredGroups.map((group) => (
            <div key={group.workerId} className="memory-group">
              <div className="assignment-row">
                <div>
                  <h3>{group.workerName}</h3>
                  <p className="activity-meta">{group.workerRole}</p>
                </div>
                <Link className="btn btn-secondary btn-small" href={`/portal/memory/${group.workerId}`}>
                  View Worker
                </Link>
              </div>
              <ul className="activity-list">
                {group.memories.map((memory) => (
                  <MemoryListItem key={memory.id} memory={memory} workerId={group.workerId} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
