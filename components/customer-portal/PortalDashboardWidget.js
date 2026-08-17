import Link from 'next/link';

/**
 * The Customer Portal's own landing summary (Phase 0 Package O,
 * objective #1) — aggregate counts across every section below, each
 * linking out to its own page.
 */
export default function PortalDashboardWidget({ summary }) {
  return (
    <div>
      <ul className="activity-list">
        <li>
          <p className="activity-title">Proposals</p>
          <p className="activity-meta">{summary.proposals_count}</p>
        </li>
        <li>
          <p className="activity-title">Quotes</p>
          <p className="activity-meta">{summary.quotes_count}</p>
        </li>
        <li>
          <p className="activity-title">Contracts</p>
          <p className="activity-meta">{summary.contracts_count}</p>
        </li>
        <li>
          <p className="activity-title">Onboarding progress</p>
          <p className="activity-meta">
            {summary.onboarding_tasks_done} of {summary.onboarding_tasks_total} complete
          </p>
        </li>
        <li>
          <p className="activity-title">Projects</p>
          <p className="activity-meta">{summary.projects_count}</p>
        </li>
        <li>
          <p className="activity-title">Open support requests</p>
          <p className="activity-meta">{summary.open_support_requests_count}</p>
        </li>
      </ul>
      <p>
        <Link className="btn btn-secondary btn-small" href="/customer-portal/deals">
          View Proposals &amp; Contracts
        </Link>{' '}
        <Link className="btn btn-secondary btn-small" href="/customer-portal/support">
          Open Support
        </Link>
      </p>
    </div>
  );
}
