'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import MemoryListItem from '@/components/portal/MemoryListItem';
import EmptyState from '@/components/portal/EmptyState';

const PAGE_SIZE = 20;

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
 *
 * CUSTOMER_UX_ACCEPTANCE_V1 -- "improve department-based organisation."
 * Worker groups are now nested one level under their department (a plain
 * client-side re-grouping of the same `groups`, keyed on the
 * `departmentName` the page already attaches to each one) so an
 * organisation with hundreds of workers reads as a real org chart, not a
 * flat wall of cards. A visible-count cap (matching WorkerListView/
 * KnowledgeListView) keeps that same scale from rendering everything at
 * once.
 */
export default function MemoryOverviewView({ groups }) {
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

  const departmentSections = useMemo(() => {
    const byDepartment = new Map();
    for (const group of filteredGroups) {
      const name = group.departmentName ?? 'Unassigned';
      if (!byDepartment.has(name)) byDepartment.set(name, []);
      byDepartment.get(name).push(group);
    }
    return [...byDepartment.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredGroups]);

  const visibleWorkerGroups = useMemo(() => {
    let remaining = visibleCount;
    return departmentSections.map(([departmentName, deptGroups]) => {
      const visible = deptGroups.slice(0, Math.max(remaining, 0));
      remaining = Math.max(remaining - deptGroups.length, 0);
      return [departmentName, visible];
    });
  }, [departmentSections, visibleCount]);

  const totalWorkerGroups = filteredGroups.length;
  const shownWorkerGroups = visibleWorkerGroups.reduce((sum, [, g]) => sum + g.length, 0);

  return (
    <div>
      <div className="workers-toolbar">
        <input
          type="search"
          placeholder="Search memory content across all workers"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
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
        <>
          {visibleWorkerGroups
            .filter(([, deptGroups]) => deptGroups.length > 0)
            .map(([departmentName, deptGroups]) => (
              <div key={departmentName} className="memory-department-section">
                <h2 className="memory-department-heading">{departmentName}</h2>
                <div className="memory-groups">
                  {deptGroups.map((group) => (
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
              </div>
            ))}

          {shownWorkerGroups < totalWorkerGroups && (
            <div className="console-list-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Show more ({totalWorkerGroups - shownWorkerGroups} more workers)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
