import EmptyState from '@/components/portal/EmptyState';

/**
 * Licensing and subscription tracking (Phase 0 Package M, objective
 * #10) — surfaces the organisation's real, existing Licence/
 * Entitlement data (backend Packages A-D). No Subscription entity
 * exists anywhere in this backend yet (see the backend's own
 * models/licence.py docstring), so subscription-cost tracking is not
 * represented here — an honest gap, not a hidden one.
 */
export default function LicensingSummaryCard({ licensing }) {
  if (!licensing) {
    return (
      <EmptyState
        title="No active licence on record"
        description="This organisation has not been issued a licence yet."
      />
    );
  }

  return (
    <div>
      <p className="activity-title">
        {licensing.tier} <span className="badge">{licensing.status}</span>
      </p>
      <p className="activity-meta">Hosting: {licensing.hosting_model}</p>
      <p className="activity-meta">Expires: {licensing.expires_at ?? 'No expiry on record'}</p>
      <p className="activity-meta">
        Limits: {licensing.worker_limit} workers · {licensing.user_limit ?? 'unlimited'} users ·{' '}
        {licensing.organisation_limit} organisations
      </p>
      <p className="activity-meta">
        No subscription/billing record exists yet for this organisation — licensing tracking above
        reflects real, issued entitlement data; subscription-cost tracking is not yet built.
      </p>
    </div>
  );
}
