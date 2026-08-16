import EmptyState from '@/components/portal/EmptyState';

/**
 * CTO dashboard visibility (Phase 0 Package G) — the customer's own
 * organisation's past chain executions, most recent first. Every
 * execution here already ran to completion (this backend has no
 * background job queue, so there is no "currently mid-chain" state to
 * poll for — see the implementation report's "explicitly not done"
 * section), so this is a completed-work-package list, not a live
 * progress view.
 */
export default function CtoExecutionHistory({ executions }) {
  if (!executions || executions.length === 0) {
    return (
      <EmptyState
        title="No CTO task executions yet"
        description="When you run a chain from the panel above, its full delegation trail and executive synthesis will be recorded here."
      />
    );
  }

  return (
    <ul className="activity-list">
      {executions.map((execution) => (
        <li key={execution.id}>
          <p className="activity-title">{execution.objective}</p>
          <p className="activity-meta">
            {execution.steps.length} hop{execution.steps.length === 1 ? '' : 's'} ·{' '}
            {execution.steps.map((step) => step.worker_name).join(' → ')} · {execution.created_at}
          </p>
        </li>
      ))}
    </ul>
  );
}
