import Link from 'next/link';
import { PulseIcon } from '@/components/portal/icons';

/**
 * Phase 0 Package PQR — objectives #12/#13/#15. Reused on
 * /portal/platform-health and /portal/cto, the same integration depth
 * Package K/L/M/N already established there for marketing/federation/
 * finance/operations summaries. `summary` is a computed snapshot from
 * real rows (incidents, deployments), never a stored time series.
 */
export default function PlatformHealthSummaryWidget({ summary }) {
  const { status, open_incidents_by_severity: bySeverity, pending_deployments_count: pendingDeployments, last_deployment: lastDeployment } = summary;

  return (
    <div>
      <div className="section-heading left">
        <div className="eyebrow-icon-row">
          <span className="stat-tile-icon"><PulseIcon /></span>
          <span className="eyebrow">Platform Health</span>
        </div>
        <h2>
          Status: <span className="badge">{status}</span>
        </h2>
      </div>
      <ul className="activity-list">
        <li>
          <p className="activity-title">Open incidents by severity</p>
          <p className="activity-meta">
            {bySeverity.low} low · {bySeverity.medium} medium · {bySeverity.high} high · {bySeverity.critical} critical
          </p>
        </li>
        <li>
          <p className="activity-title">Pending deployments</p>
          <p className="activity-meta">{pendingDeployments}</p>
        </li>
        <li>
          <p className="activity-title">Last deployment</p>
          <p className="activity-meta">
            {lastDeployment ? `${lastDeployment.version_label} — ${new Date(lastDeployment.deployed_at).toLocaleString()}` : 'None yet'}
          </p>
        </li>
      </ul>
      <p>
        <Link className="btn btn-secondary btn-small" href="/portal/platform-health">
          Open Platform Health Workspace
        </Link>
      </p>
    </div>
  );
}
