import Link from 'next/link';

import EmptyState from '@/components/portal/EmptyState';

const STAGES = ['planning', 'active', 'completed'];

/**
 * Campaign management (Phase 0 Package K, objective #5) — a
 * stage-filterable campaign list.
 */
export default function CampaignListView({ campaigns, activeStage }) {
  return (
    <div>
      <div className="workers-toolbar">
        <Link
          className={!activeStage ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
          href="/portal/marketing"
        >
          All
        </Link>
        {STAGES.map((stage) => (
          <Link
            key={stage}
            className={activeStage === stage ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
            href={`/portal/marketing?stage=${stage}`}
          >
            {stage.charAt(0).toUpperCase() + stage.slice(1)}
          </Link>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet" description="Create a campaign above to get started." />
      ) : (
        <ul className="activity-list">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">{campaign.name}</p>
                  <p className="activity-meta">
                    <span className="badge">{campaign.stage}</span>
                    {campaign.objective ? ` · ${campaign.objective}` : ''}
                  </p>
                </div>
                <Link className="btn btn-secondary btn-small" href={`/portal/marketing/${campaign.id}`}>
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
