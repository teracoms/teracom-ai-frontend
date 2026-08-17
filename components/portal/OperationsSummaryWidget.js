import Link from 'next/link';

/**
 * Phase 0 Package N — Operations & Project Delivery Platform. Reused
 * on /portal/operations, the Operations department dashboard, and
 * /portal/cto, the same integration depth Package K/L/M already
 * established there for marketing/federation/finance summaries.
 */
export default function OperationsSummaryWidget({ summary }) {
  const { projects, tasks } = summary;

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Operations</span>
        <h2>Projects &amp; tasks.</h2>
      </div>
      <ul className="activity-list">
        <li>
          <p className="activity-title">Active projects</p>
          <p className="activity-meta">{projects.count_by_status.active}</p>
        </li>
        <li>
          <p className="activity-title">Completed projects</p>
          <p className="activity-meta">{projects.count_by_status.completed}</p>
        </li>
        <li>
          <p className="activity-title">Tasks by status</p>
          <p className="activity-meta">
            {tasks.count_by_status.pending} pending · {tasks.count_by_status.in_progress} in progress ·{' '}
            {tasks.count_by_status.done} done
          </p>
        </li>
        <li>
          <p className="activity-title">Overdue tasks</p>
          <p className="activity-meta">{tasks.overdue_count}</p>
        </li>
      </ul>
      <p>
        <Link className="btn btn-secondary btn-small" href="/portal/operations">
          Open Operations Workspace
        </Link>
      </p>
    </div>
  );
}
