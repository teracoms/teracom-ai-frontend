import Link from 'next/link';

/**
 * Phase 0 Package K — executive/CTO visibility of campaign status,
 * content/video pipeline status, and publication readiness (objectives
 * #11/#15). Surfaced on a "marketing"-function department's own
 * dashboard and on /portal/cto — a dashboard widget, not woven into the
 * CTO chain's Ollama synthesis context (see ADR-015).
 */
export default function MarketingSummaryWidget({ summary }) {
  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Marketing</span>
        <h2>Campaign &amp; production pipeline.</h2>
      </div>
      <ul className="activity-list">
        <li>
          <p className="activity-title">Planning</p>
          <p className="activity-meta">{summary.campaign_stage_counts.planning}</p>
        </li>
        <li>
          <p className="activity-title">Active</p>
          <p className="activity-meta">{summary.campaign_stage_counts.active}</p>
        </li>
        <li>
          <p className="activity-title">Completed</p>
          <p className="activity-meta">{summary.campaign_stage_counts.completed}</p>
        </li>
      </ul>
      <p className="activity-meta">
        Pending: {summary.pending_content_count} content piece{summary.pending_content_count === 1 ? '' : 's'} ·{' '}
        {summary.pending_video_count} video{summary.pending_video_count === 1 ? '' : 's'} awaiting decision
      </p>
      <p className="activity-meta">
        Media Centre: {summary.media_ready_count} ready · {summary.media_published_count} published
      </p>
      <p>
        <Link className="btn btn-secondary btn-small" href="/portal/marketing">
          Open Marketing Workspace
        </Link>
      </p>
    </div>
  );
}
