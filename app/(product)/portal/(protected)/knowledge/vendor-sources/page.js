import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchVendorSources } from '@/lib/api/vendorSources';
import { fetchWorkerList } from '@/lib/api/workers';
import { settle, errorMessage } from '@/lib/api/results';
import AddVendorSourceForm from '@/components/portal/AddVendorSourceForm';
import VendorSourceListView from '@/components/portal/VendorSourceListView';

export const metadata = {
  title: 'Vendor Sources | Teracom AI Portal',
};

/**
 * TECHNICAL_SUPPORT_OS_MVP_V1 -- the one new GUI surface this MVP adds.
 * Not nested under a Technical Support department tab (SD-048 §8's own
 * placement) since that department doesn't exist in this MVP -- reachable
 * from Knowledge instead, matching
 * Workstreams/TECHNICAL_SUPPORT_OS_MVP_IMPLEMENTATION_PLAN_V1.md §5.
 */
export default async function VendorSourcesPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Vendor Sources</span>
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

  const vendorSources = settle(vendorSourcesResult) ?? [];
  const workers = settle(workersResult) ?? [];
  const loadError = vendorSourcesResult.status === 'rejected' ? vendorSourcesResult.reason : null;

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Knowledge</span>
            <h1>Vendor Sources</h1>
            <p className="lead">
              Point at a vendor&apos;s public documentation page — its PDFs are discovered,
              downloaded, and added to your knowledge base automatically, so the worker you
              choose can answer questions grounded in the vendor&apos;s own documentation.
            </p>
          </div>
          <div className="hero-actions">
            <Link className="btn btn-secondary" href="/portal/knowledge">
              Back to Knowledge
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Add Vendor</h2>
          <AddVendorSourceForm workers={workers} />
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
            <VendorSourceListView vendorSources={vendorSources} />
          )}
        </div>
      </section>
    </main>
  );
}
