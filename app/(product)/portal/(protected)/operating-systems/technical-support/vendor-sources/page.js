import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchVendorSources } from '@/lib/api/vendorSources';
import { fetchWorkerList } from '@/lib/api/workers';
import { settle, errorMessage } from '@/lib/api/results';
import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';
import VendorSourceForm from '@/components/portal/VendorSourceForm';
import VendorSourceListView from '@/components/portal/VendorSourceListView';

export const metadata = {
  title: 'Vendor Sources | Technical Support OS | Teracom AI Portal',
};

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- moved out of generic
 * Knowledge nav entirely, per direct instruction. The old
 * /portal/knowledge/vendor-sources route now redirects here (see its own
 * page.js). Full CRUD: Add/Edit/Remove/Enable-Disable/Schedule/Scan Now/
 * status/document-and-version detail — all against the real, extended
 * backend contract (teracom-ai-backend 781cfe3).
 */
export default async function VendorSourcesPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Technical Support OS</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view vendor sources.</p>
          </div>
        </section>
      </main>
    );
  }

  const [vendorSourcesResult, workersResult] = await Promise.allSettled([
    fetchVendorSources(token),
    fetchWorkerList(token),
  ]);

  const vendorSources = settle(vendorSourcesResult).value ?? [];
  const workers = settle(workersResult).value ?? [];
  const loadError = vendorSourcesResult.status === 'rejected' ? vendorSourcesResult.reason : null;

  return (
    <>
      <TechnicalSupportOSNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Technical Support OS</span>
              <h1>Vendor Sources</h1>
              <p className="lead">
                Point at a vendor&apos;s public documentation page — its PDFs are discovered,
                downloaded, and added to your knowledge base automatically, so the worker you
                choose can answer questions grounded in the vendor&apos;s own documentation.
              </p>
            </div>
            <div className="hero-actions">
              <Link className="btn btn-secondary" href="/portal/operating-systems/technical-support">
                Back to Technical Support OS
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2>Add Vendor</h2>
            <VendorSourceForm workers={workers} />
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2>Your Vendor Sources</h2>
            {loadError ? (
              <p className="form-error" role="alert">
                {errorMessage(loadError)}
              </p>
            ) : (
              <VendorSourceListView vendorSources={vendorSources} workers={workers} />
            )}
          </div>
        </section>
      </main>
    </>
  );
}
