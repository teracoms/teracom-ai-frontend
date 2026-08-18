import Link from 'next/link';
import { BillingIcon } from '@/components/portal/icons';

/**
 * Phase 0 Package M — executive/CTO financial dashboards (objectives
 * #7, #10, #11). Reuses the backend's own federation cost rollup
 * (objective #8) and real licensing/entitlement data (objective #10)
 * — surfaced as a dashboard widget, not woven into the CTO chain's
 * own Ollama synthesis context, the same integration depth Package
 * K/L already established there for marketing/federation summaries.
 */
export default function FinanceSummaryWidget({ summary }) {
  const { department_budgets: budgets, proposal_cost_estimates: costEstimates, federation_cost: federationCost, licensing } = summary;

  return (
    <div>
      <div className="section-heading left">
        <div className="eyebrow-icon-row">
          <span className="stat-tile-icon"><BillingIcon /></span>
          <span className="eyebrow">Finance</span>
        </div>
        <h2>Budgets, costs &amp; licensing.</h2>
      </div>
      <ul className="activity-list">
        <li>
          <p className="activity-title">Approved budget allocated</p>
          <p className="activity-meta">${budgets.total_allocated.toFixed(2)}</p>
        </li>
        <li>
          <p className="activity-title">Budgets pending approval</p>
          <p className="activity-meta">{budgets.pending_count}</p>
        </li>
        <li>
          <p className="activity-title">Proposal cost estimates</p>
          <p className="activity-meta">
            {costEstimates.count_with_estimate} estimated · ${costEstimates.total_estimated_cost.toFixed(2)} total
          </p>
        </li>
        <li>
          <p className="activity-title">Federation cost (simulated)</p>
          <p className="activity-meta">${federationCost.total_estimated_cost.toFixed(4)}</p>
        </li>
      </ul>
      <p className="activity-meta">
        Total estimated organisation cost: ${summary.total_estimated_organisation_cost.toFixed(2)}
      </p>
      {licensing ? (
        <p className="activity-meta">
          Licence: {licensing.tier} · {licensing.hosting_model} · {licensing.status}
        </p>
      ) : (
        <p className="activity-meta">No active licence on record.</p>
      )}
      <p>
        <Link className="btn btn-secondary btn-small" href="/portal/finance">
          Open Finance Workspace
        </Link>
      </p>
    </div>
  );
}
