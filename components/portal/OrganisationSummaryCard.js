import Link from 'next/link';

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
// CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- `linkToFullProfile` fixes
// UX_REVIEW_CUSTOMER_PLATFORM_V1.md §M3: the Dashboard and
// /portal/admin/organisation both render this exact card from the exact
// same GET /organisations/ data, with nothing telling a user why they'd
// ever need the second one. The Dashboard now passes this prop to add a
// direct link to the fuller profile page (federation setting, AI provider
// config, sub-organisations, business owner); the profile page itself
// passes nothing, so it doesn't link to itself.
export default function OrganisationSummaryCard({ organisation, restricted, linkToFullProfile = false }) {
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

      {linkToFullProfile && !restricted && (
        <p style={{ marginTop: '0.75rem' }}>
          <Link className="btn btn-secondary btn-small" href="/portal/admin/organisation">
            View full organisation profile
          </Link>
        </p>
      )}
    </div>
  );
}
