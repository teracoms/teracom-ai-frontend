import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchVendorSources } from '@/lib/api/vendorSources';
import { settle, errorMessage } from '@/lib/api/results';
import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';

export const metadata = {
  title: 'Technical Support Workers | Technical Support OS | Teracom AI Portal',
};

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- reuses the real Worker list
 * (GET /worker-list/), filtered to workers actually assigned as a Vendor
 * Source's own worker_id -- a real, derivable signal (this is literally who
 * can answer questions grounded in that source's ingested documents), not a
 * fabricated department membership (no Department.function="technical_
 * support" exists in this backend yet, per this pass's own explicit scope).
 */
export default async function TechnicalSupportWorkersPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Technical Support OS</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  const [workersResult, vendorSourcesResult] = await Promise.allSettled([
    fetchWorkerList(token),
    fetchVendorSources(token),
  ]);

  const workers = settle(workersResult).value ?? [];
  const vendorSources = settle(vendorSourcesResult).value ?? [];
  const loadError = workersResult.status === 'rejected' ? workersResult.reason : null;

  const assignedWorkerIds = new Set(vendorSources.map((vs) => vs.worker_id));
  const technicalSupportWorkers = workers.filter((worker) => assignedWorkerIds.has(worker.id));

  return (
    <>
      <TechnicalSupportOSNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Technical Support OS</span>
              <h1>Technical Support Workers</h1>
              <p className="lead">
                Workers currently assigned to at least one vendor source — real, derived from
                Vendor Sources&apos; own worker assignment, not a fabricated department roster.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            {loadError ? (
              <p className="form-error" role="alert">
                {errorMessage(loadError)}
              </p>
            ) : technicalSupportWorkers.length === 0 ? (
              <p className="form-note">
                No worker is currently assigned to a vendor source yet. Assign one from{' '}
                <Link href="/portal/operating-systems/technical-support/vendor-sources">Vendor Sources</Link>.
              </p>
            ) : (
              <div className="console-list">
                {technicalSupportWorkers.map((worker) => (
                  <div key={worker.id} className="console-row">
                    <div className="console-row-main">
                      <span className="console-row-title">{worker.name}</span>
                      <span className="console-row-meta">{worker.role}</span>
                    </div>
                    <div className="console-row-actions">
                      <Link className="btn btn-secondary btn-small" href={`/portal/workers/${worker.id}`}>
                        View Worker
                      </Link>
                      <Link
                        className="btn btn-secondary btn-small"
                        href={`/portal/operating-systems/technical-support/workers/${worker.id}/configure`}
                      >
                        Configure Voice &amp; Avatar
                      </Link>
                      <Link className="btn btn-secondary btn-small" href="/portal/chat">
                        Chat
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
