import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchVendorSources } from '@/lib/api/vendorSources';
import { fetchSupportRequests } from '@/lib/api/supportRequests';
import { settle } from '@/lib/api/results';
import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';

export const metadata = {
  title: 'Technical Support OS | Teracom AI Portal',
};

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- the Operating System's own
 * landing/dashboard page. Follows /portal/digital-workforce's own real
 * precedent exactly: aggregates already-real endpoints (GET /vendor-sources/,
 * GET /support-requests/) into one "whole module at a glance" view, no
 * fabricated metric and no new backend aggregate endpoint.
 */
export default async function TechnicalSupportOSDashboard() {
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

  const [vendorSourcesResult, supportRequestsResult] = await Promise.allSettled([
    fetchVendorSources(token),
    fetchSupportRequests(token),
  ]);

  const vendorSources = settle(vendorSourcesResult).value ?? [];
  const supportRequests = settle(supportRequestsResult).value ?? [];

  const totalIngested = vendorSources.reduce((sum, vs) => sum + (vs.document_count ?? 0), 0);
  const totalPending = vendorSources.reduce((sum, vs) => sum + (vs.pending_count ?? 0), 0);
  const totalFailed = vendorSources.reduce((sum, vs) => sum + (vs.failed_count ?? 0), 0);
  const enabledSources = vendorSources.filter((vs) => vs.enabled).length;
  const openCases = supportRequests.filter((r) => r.status !== 'closed' && r.status !== 'resolved').length;

  return (
    <>
      <TechnicalSupportOSNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Operating System</span>
              <h1>Technical Support OS.</h1>
              <p className="lead">
                Vendor documentation acquisition, technical knowledge, and worker-answered
                support — grounded in your own ingested vendor documents.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container product-grid">
            <article className="product-card">
              <div>
                <h3>{vendorSources.length}</h3>
                <p>
                  Vendor sources configured ({enabledSources} enabled)
                </p>
              </div>
              <Link className="btn btn-secondary" href="/portal/operating-systems/technical-support/vendor-sources">
                Manage Vendor Sources
              </Link>
            </article>

            <article className="product-card">
              <div>
                <h3>{totalIngested}</h3>
                <p>
                  Documents ingested ({totalPending} pending review, {totalFailed} failed)
                </p>
              </div>
              <Link className="btn btn-secondary" href="/portal/operating-systems/technical-support/technical-knowledge">
                Browse Knowledge
              </Link>
            </article>

            <article className="product-card">
              <div>
                <h3>{openCases}</h3>
                <p>Open support cases (of {supportRequests.length} total)</p>
              </div>
              <Link className="btn btn-secondary" href="/portal/operating-systems/technical-support/support-cases">
                View Support Cases
              </Link>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
