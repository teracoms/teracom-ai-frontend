import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchUsers } from '@/lib/api/admin';
import { fetchOrganisationSummary } from '@/lib/api/dashboard';
import { settle, errorMessage } from '@/lib/api/results';
import { getReferenceLicence, TIER_ALLOCATIONS } from '@/lib/licensing/referenceLicence';
import CapacityMeter from '@/components/portal/CapacityMeter';
import { WorkersIcon, OrganisationIcon } from '@/components/portal/icons';

export const metadata = {
  title: 'Usage & Capacity | Teracom AI Portal',
};

/**
 * Requirements #3 and #10 — the same screen serves both "Usage & Capacity
 * Dashboard" and "Capacity Monitoring Views". Deliberately hybrid: the
 * *consumption* side (worker/user/organisation counts) is real, live data
 * from endpoints Packages 3/7/2 already built — nothing here is fabricated.
 * The *allocation* ceiling is the reference licence's illustrative tier
 * limit, since no backend entitlement record exists to check consumption
 * against. Each meter is honest about which half is which (see
 * CapacityMeter.js).
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

  const [workersResult, usersResult, organisationResult] = await Promise.allSettled([
    fetchWorkerList(token),
    fetchUsers(token),
    fetchOrganisationSummary(token),
  ]);

  const workers = settle(workersResult);
  const users = settle(usersResult);
  const organisation = settle(organisationResult);

  const licence = getReferenceLicence();
  const allocation = TIER_ALLOCATIONS[licence.tier];

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Usage &amp; capacity.</h1>
            <p className="lead">
              Real, current counts from your organisation, shown against the {licence.tier} tier&apos;s
              illustrative allocation.
            </p>
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
                allocation={allocation.workers}
                icon={<WorkersIcon />}
              />
            )}

            {users.error ? (
              <p className="form-error" role="alert">
                {errorMessage(users.error)}
              </p>
            ) : (
              <CapacityMeter
                label="Users"
                used={users.value.length}
                allocationLabel={licence.userAllocationLabel}
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
                allocation={allocation.organisations}
                icon={<OrganisationIcon />}
              />
            )}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <p className="illustrative-data-banner" role="note">
            <strong>Partially illustrative</strong>
            Worker, user, and organisation counts above are real, live data. The allocation
            ceilings shown are illustrative example values, not this page&apos;s own real{' '}
            <code>Plan</code>/<code>Entitlement</code> data — real per-licence entitlement limits
            already exist, but this specific page has not yet been wired to call them.
            Worker-limit enforcement itself also remains inconsistent — enforced only on the
            Marketplace pack-provisioning path, not on direct admin worker creation.
          </p>
        </div>
      </section>
    </main>
  );
}
