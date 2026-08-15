import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { fetchWorkerList } from '@/lib/api/workers';
import { getReferenceLicence, TIER_ALLOCATIONS } from '@/lib/licensing/referenceLicence';
import WorkerPackWizard from '@/components/portal/WorkerPackWizard';

export const metadata = {
  title: 'Worker Pack | Teracom AI Portal',
};

export default async function WorkerPackPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to request a worker pack.</p>
          </div>
        </section>
      </main>
    );
  }

  // Belt-and-braces beyond the parent admin layout's role gate — see
  // BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md §9 for why a layout that
  // renders a different tree instead of `{children}` does not, by itself,
  // stop this page's own Server Component (and its real fetch below) from
  // executing for a non-admin request.
  if (decodeJwtPayload(token)?.role !== 'admin') {
    return null;
  }

  let currentWorkerCount = 0;
  try {
    currentWorkerCount = (await fetchWorkerList(token)).length;
  } catch {
    // Non-fatal: the wizard still works with a 0 baseline if the real count
    // can't be fetched — the illustrative allocation figure is the point of
    // this step, not a hard dependency on the live count.
  }

  const licence = getReferenceLicence();
  const allocation = TIER_ALLOCATIONS[licence.tier];

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Request additional workers.</h1>
            <p className="lead">
              A guided flow, per docs/governance/UX_VISION.md §5 — an entitlement change needs
              human approval regardless of how the request is phrased.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <WorkerPackWizard
            currentWorkerCount={currentWorkerCount}
            workerAllocation={allocation.workers}
          />
        </div>
      </section>
    </main>
  );
}
