import EmptyState from '@/components/portal/EmptyState';

/**
 * GET /organisations/ is admin-only backend-side (auth/roles.require_role
 * "admin") — a non-admin signed-in user will never be able to see this data,
 * which is a real, permanent state for that role, not a transient error.
 * `restricted` renders that as a plain informational note rather than an
 * error banner.
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

  return (
    <div className="org-summary-card">
      <span className="eyebrow">Organisation</span>
      <p className="org-summary-name">{organisation.name}</p>
      <p className="org-summary-meta">Slug: {organisation.slug}</p>
    </div>
  );
}
