import EmptyState from '@/components/portal/EmptyState';
import { OrganisationIcon, ClockIcon } from '@/components/portal/icons';

function daysRemaining(trialEndsAt) {
  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * GET /organisations/ is admin-only backend-side (auth/roles.require_role
 * "admin") — a non-admin signed-in user will never be able to see this data,
 * which is a real, permanent state for that role, not a transient error.
 * `restricted` renders that as a plain informational note rather than an
 * error banner.
 *
 * The trial banner ("Platform Review Wave 1" trial experience foundation)
 * only renders when `organisation.status === "trial"` — every organisation
 * created before this package, and every one created via the pre-existing
 * /signup path, has `trial_ends_at: null` and shows nothing extra here.
 */
export default function OrganisationSummaryCard({ organisation, restricted }) {
  if (restricted) {
    return (
      <EmptyState
        title="Organisation details are restricted"
        description="Only organisation admins can view organisation summary details."
      />
    );
  }

  if (!organisation) {
    return (
      <EmptyState
        title="Organisation summary unavailable"
        description="No organisation record was returned for your account."
      />
    );
  }

  const isTrial = organisation.status === 'trial' && organisation.trial_ends_at;
  const remaining = isTrial ? daysRemaining(organisation.trial_ends_at) : null;

  return (
    <div className="org-summary-card">
      <div className="stat-tile-heading">
        <span className="stat-tile-icon">
          <OrganisationIcon />
        </span>
        <span className="eyebrow">Organisation</span>
      </div>
      <p className="org-summary-name">{organisation.name}</p>
      <p className="org-summary-meta">Slug: {organisation.slug}</p>
      <p className="org-summary-meta">
        <span className={organisation.status === 'active' ? 'badge status-operational' : 'badge'}>
          {organisation.status.replace('_', ' ')}
        </span>
      </p>

      {isTrial && (
        <p className={remaining > 0 ? 'form-note-banner trial-banner' : 'form-error trial-banner'} role="status">
          <ClockIcon width={16} height={16} />{' '}
          {remaining > 0
            ? `Trial — ${remaining} day${remaining === 1 ? '' : 's'} remaining.`
            : 'Your trial has ended. Contact Teracom to continue.'}
        </p>
      )}
    </div>
  );
}
