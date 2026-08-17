import Link from 'next/link';

/**
 * Phase 0 Package J — executive visibility of customer health
 * (objective #9), surfaced on a "customer_success"-function
 * department's own dashboard (objective #10).
 */
export default function CustomerHealthWidget({ summary }) {
  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Customer Health</span>
        <h2>{summary.stage_counts.customer} customer{summary.stage_counts.customer === 1 ? '' : 's'}.</h2>
      </div>
      <ul className="activity-list">
        <li>
          <p className="activity-title">Healthy</p>
          <p className="activity-meta">{summary.health_counts.healthy}</p>
        </li>
        <li>
          <p className="activity-title">At Risk</p>
          <p className="activity-meta">{summary.health_counts.at_risk}</p>
        </li>
        <li>
          <p className="activity-title">Churned</p>
          <p className="activity-meta">{summary.health_counts.churned}</p>
        </li>
      </ul>
      <p>
        <Link className="btn btn-secondary btn-small" href="/portal/customer-success">
          Open Customer Success Workspace
        </Link>
      </p>
    </div>
  );
}
