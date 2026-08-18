import EmptyState from '@/components/portal/EmptyState';
import { OrganisationIcon, ClockIcon } from '@/components/portal/icons';

function daysRemaining(trialEndsAt) {
  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

const TRIAL_BANNER_TEXT = {
  active: (days) => `Trial — ${days} day${days === 1 ? '' : 's'} remaining.`,
  grace: () => 'Your trial has ended and is now in a grace period. Contact Teracom to continue without interruption.',
  locked: () => 'Your trial has ended and this workspace is now in Locked Mode. Contact Teracom to continue.',
};

/**
 * GET /organisations/ is admin-only backend-side (auth/roles.require_role
 * "admin") — a non-admin signed-in user will never be able to see this data,
 * which is a real, permanent state for that role, not a transient error.
 * `restricted` renders that as a plain informational note rather than an
 * error banner.
 *
 * The trial banner ("Platform Review Wave 1" trial experience foundation,
 * extended in "Customer Experience & Commercial Readiness Wave" with the
 * real grace/locked states) only renders when `organisation.status ===
 * "trial"` — every organisation created before Wave 1, and every one
 * created via the pre-existing /signup path, has `trial_ends_at: null` and
 * shows nothing extra here. `trial_status` ("active"/"grace"/"locked") is
 * computed backend-side (services/trial_service.py) so the grace-period
 * length doesn't need to be duplicated here.
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
  const trialStatus = organisation.trial_status;

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

      {isTrial && trialStatus && (
        <p
          className={trialStatus === 'active' ? 'form-note-banner trial-banner' : 'form-error trial-banner'}
          role="status"
        >
          <ClockIcon width={16} height={16} />{' '}
          {trialStatus === 'active'
            ? TRIAL_BANNER_TEXT.active(daysRemaining(organisation.trial_ends_at))
            : TRIAL_BANNER_TEXT[trialStatus]()}
        </p>
      )}
    </div>
  );
}
