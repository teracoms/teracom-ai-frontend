import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchUsers } from '@/lib/api/admin';
import { fetchOrganisationSummary } from '@/lib/api/dashboard';
import { fetchFinanceSummary } from '@/lib/api/finance';
import { settle, errorMessage } from '@/lib/api/results';
import { getReferenceLicence, TIER_ALLOCATIONS } from '@/lib/licensing/referenceLicence';
import CapacityMeter from '@/components/portal/CapacityMeter';
import { WorkersIcon, OrganisationIcon } from '@/components/portal/icons';

export const metadata = {
  title: 'Usage & Capacity | Teracom AI Portal',
};

/**
 * Requirements #3 and #10 — the same screen serves both "Usage & Capacity
 * Dashboard" and "Capacity Monitoring Views". DIGITAL_ORGANISATION_OPERATIONS_V1
 * closes the gap this page's own banner used to name: real per-licence
 * entitlement limits now exist (services/finance_summary_service.py#
 * get_licensing_summary(), enhanced with real worker/user counts and
 * utilisation percentages this same round) and this page is now wired
 * to them. An organisation with no real licence issued yet (e.g. a
 * trial) has no Entitlement row to check against — GET /finance/summary's
 * own `licensing: null` in that case — so this page falls back to the
 * illustrative reference licence only then, clearly labelled as such
 * either way.
 */
export default async function BillingUsagePage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Usage &amp; Capacity</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view usage and capacity.</p>
          </div>
        </section>
      </main>
    );
  }

  // Belt-and-braces beyond the parent admin layout's role gate: Next.js's
  // App Router still executes a child page.js's own Server Component (and
  // any data fetches it makes) even when a parent layout renders a
  // different tree instead of `{children}` — the un-displayed result still
  // reaches the browser as an unreferenced entry in the RSC flight payload.
  // Verified live during this package's smoke test (see
  // BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md §9). Returning early here
  // means a non-admin reaching this page triggers none of the three real
  // backend calls below at all — the parent layout's restricted message is
  // what actually gets shown either way, so this content is never seen.
  if (!isAtLeastRole(decodeJwtPayload(token)?.role, 'admin')) {
    return null;
  }

  const [workersResult, usersResult, organisationResult, financeResult] = await Promise.allSettled([
    fetchWorkerList(token),
    fetchUsers(token),
    fetchOrganisationSummary(token),
    fetchFinanceSummary(token),
  ]);

  const workers = settle(workersResult);
  const users = settle(usersResult);
  const organisation = settle(organisationResult);
  const finance = settle(financeResult);

  const licensing = finance.value?.licensing ?? null;
  const referenceLicence = getReferenceLicence();
  const referenceAllocation = TIER_ALLOCATIONS[referenceLicence.tier];

  const tierLabel = licensing ? licensing.tier : referenceLicence.tier;
  const workerAllocation = licensing ? licensing.worker_limit : referenceAllocation.workers;
  const organisationAllocation = licensing ? licensing.organisation_limit : referenceAllocation.organisations;
  const userAllocation = licensing ? licensing.user_limit : null;

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Usage &amp; capacity.</h1>
            <p className="lead">
              Real, current counts from your organisation, shown against the {tierLabel} tier&apos;s{' '}
              {licensing ? 'real licensed' : 'illustrative'} allocation.
            </p>
            {licensing?.expiring_soon && (
              <p className="form-note">
                This licence expires in {licensing.days_until_expiry} day(s)
                {licensing.expires_at ? ` (${licensing.expires_at.slice(0, 10)})` : ''}.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stat-grid stat-grid-3">
            {workers.error ? (
              <p className="form-error" role="alert">
                {errorMessage(workers.error)}
              </p>
            ) : (
              <CapacityMeter
                label="Workers"
                used={workers.value.length}
                allocation={workerAllocation}
                icon={<WorkersIcon />}
              />
            )}

            {users.error ? (
              <p className="form-error" role="alert">
                {errorMessage(users.error)}
              </p>
            ) : userAllocation != null ? (
              <CapacityMeter label="Users" used={users.value.length} allocation={userAllocation} icon={<OrganisationIcon />} />
            ) : (
              <CapacityMeter
                label="Users"
                used={users.value.length}
                allocationLabel={licensing ? 'Per your licensed user count (contract-specific)' : referenceLicence.userAllocationLabel}
                icon={<OrganisationIcon />}
              />
            )}

            {organisation.error ? (
              <p className="form-error" role="alert">
                {errorMessage(organisation.error)}
              </p>
            ) : (
              <CapacityMeter
                label="Organisations"
                used={organisation.value ? 1 : 0}
                allocation={organisationAllocation}
                icon={<OrganisationIcon />}
              />
            )}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {licensing ? (
            <p className="activity-meta">
              Worker/user/organisation allocation ceilings above are your organisation&apos;s own real,
              active <code>{licensing.tier}</code> licence — not illustrative data.
            </p>
          ) : (
            <p className="illustrative-data-banner" role="note">
              <strong>Partially illustrative</strong>
              Worker, user, and organisation counts above are real, live data. Your organisation has
              no active licence yet, so the allocation ceilings shown are illustrative example values
              for the {referenceLicence.tier} tier, not a real <code>Licence</code>/<code>Entitlement</code>{' '}
              record — once a real licence is issued, this page shows its real limits instead.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
