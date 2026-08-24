import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerPools } from '@/lib/api/workerPools';
import { fetchWorkerList } from '@/lib/api/workers';
import { settle, errorMessage } from '@/lib/api/results';
import WorkerPoolsPanel from '@/components/portal/WorkerPoolsPanel';
import WorkforceNav from '@/components/portal/WorkforceNav';

export const metadata = {
  title: 'Worker Pools | Teracom AI Portal',
};

/**
 * MULTI_ORGANISATION_PLATFORM_V1 -- Worker Evolution Model Phase 3
 * made real in the GUI: organisation-scoped Worker Pools, previously
 * a fully working backend capability with zero frontend surface at
 * all (DIGITAL_ORGANISATION_UX_V1's own review found this).
 */
export default async function WorkerPoolsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Worker Pools</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view worker pools.</p>
          </div>
        </section>
      </main>
    );
  }

  // Per-section resilience (ADR-008): the pool list and worker list
  // are independent of each other.
  const [poolsSettled, workersSettled] = await Promise.allSettled([
    fetchWorkerPools(token),
    fetchWorkerList(token),
  ]);

  const poolsResult = settle(poolsSettled);
  const workersResult = settle(workersSettled);

  return (
    <>
      <WorkforceNav />
      <main>
        <section className="hero hero-product hero-workforce">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Worker Pools</span>
              <h1>Scale a role, not just one worker.</h1>
              <p className="lead">
                Group several same-role workers into a pool so tasks can be routed to whichever
                member is available — the foundation for scaling a role&apos;s capacity without
                changing how projects and tasks work.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            {poolsResult.error || workersResult.error ? (
              <p className="form-error" role="alert">
                {errorMessage(poolsResult.error ?? workersResult.error)}
              </p>
            ) : (
              <WorkerPoolsPanel pools={poolsResult.value ?? []} workers={workersResult.value ?? []} />
            )}
          </div>
        </section>
      </main>
    </>
  );
}
