import Link from 'next/link';

/**
 * Phase 0 Package L — executive/CTO visibility of federation activity
 * (objectives #10/#11). Surfaced on /portal/federation and on
 * /portal/cto — a dashboard widget, not woven into the CTO chain's
 * own Ollama synthesis context, the same integration depth Package K
 * gave marketing summary data.
 */
export default function FederationSummaryWidget({ summary }) {
  const providerEntries = Object.entries(summary.consultation_count_by_provider);

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Federation</span>
        <h2>External AI consultation activity.</h2>
      </div>
      <ul className="activity-list">
        {providerEntries.map(([providerName, count]) => (
          <li key={providerName}>
            <p className="activity-title">{providerName}</p>
            <p className="activity-meta">{count} consultation{count === 1 ? '' : 's'}</p>
          </li>
        ))}
      </ul>
      <p className="activity-meta">
        {summary.total_consultations} total consultation{summary.total_consultations === 1 ? '' : 's'} · $
        {summary.total_estimated_cost.toFixed(4)} estimated cost (simulated)
      </p>
      <p className="activity-meta">
        {summary.escalations_suggested_count} escalation{summary.escalations_suggested_count === 1 ? '' : 's'} suggested ·{' '}
        {summary.escalations_actioned_count} actioned
      </p>
      <p>
        <Link className="btn btn-secondary btn-small" href="/portal/federation">
          Open Federation Workspace
        </Link>
      </p>
    </div>
  );
}
