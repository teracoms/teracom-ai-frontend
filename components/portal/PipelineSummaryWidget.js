import Link from 'next/link';
import { FunnelIcon } from '@/components/portal/icons';

/**
 * Phase 0 Package J — executive visibility of the sales pipeline
 * (objective #9), surfaced on a "sales"-function department's own
 * dashboard (objective #10).
 */
export default function PipelineSummaryWidget({ summary }) {
  return (
    <div>
      <div className="section-heading left">
        <div className="eyebrow-icon-row">
          <span className="stat-tile-icon"><FunnelIcon /></span>
          <span className="eyebrow">Sales Pipeline</span>
        </div>
        <h2>Stage funnel &amp; pending approvals.</h2>
      </div>
      <ul className="activity-list">
        <li>
          <p className="activity-title">Prospects</p>
          <p className="activity-meta">{summary.stage_counts.prospect}</p>
        </li>
        <li>
          <p className="activity-title">Leads</p>
          <p className="activity-meta">{summary.stage_counts.lead}</p>
        </li>
        <li>
          <p className="activity-title">Customers</p>
          <p className="activity-meta">{summary.stage_counts.customer}</p>
        </li>
      </ul>
      <p className="activity-meta">
        Pending: {summary.pending_proposals} proposal{summary.pending_proposals === 1 ? '' : 's'} ·{' '}
        {summary.pending_quotes} quote{summary.pending_quotes === 1 ? '' : 's'} ·{' '}
        {summary.pending_contracts} contract{summary.pending_contracts === 1 ? '' : 's'} awaiting decision
      </p>
      <p>
        <Link className="btn btn-secondary btn-small" href="/portal/sales">
          Open Sales Workspace
        </Link>
      </p>
    </div>
  );
}
