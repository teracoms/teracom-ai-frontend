import Link from 'next/link';

import EmptyState from '@/components/portal/EmptyState';

/**
 * Read-only — teracom-ai-backend has no "which workers is this document
 * assigned to" endpoint (only GET /worker-knowledge/{worker_id}, the reverse
 * direction, already used by Package 3's worker detail page). Mutating an
 * assignment stays a Worker-page action (WorkerKnowledgeAssignment.js) so
 * there is exactly one place that does it, not two; this section only
 * displays the result and links to the relevant worker's page to change it.
 */
export default function KnowledgeAssignedWorkers({ workers }) {
  if (workers.length === 0) {
    return (
      <EmptyState
        title="Not assigned to any workers"
        description="Assign this document from a worker's Knowledge section so it can be used in chat."
      />
    );
  }

  return (
    <ul className="activity-list">
      {workers.map((worker) => (
        <li key={worker.id}>
          <div className="assignment-row">
            <div>
              <p className="activity-title">{worker.name}</p>
              <p className="activity-meta">{worker.role}</p>
            </div>
            <Link className="btn btn-secondary btn-small" href={`/portal/workers/${worker.id}`}>
              View Worker
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
