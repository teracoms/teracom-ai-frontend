import { getSessionToken } from '@/lib/api/auth';
import { fetchVendorSources } from '@/lib/api/vendorSources';
import { fetchSupportRequests } from '@/lib/api/supportRequests';
import { settle, errorMessage } from '@/lib/api/results';
import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';

export const metadata = {
  title: 'Reports | Technical Support OS | Teracom AI Portal',
};

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- a real, generated view over
 * real data (vendor scan history/counts, support case counts), the same
 * deterministic-aggregation discipline this codebase's other reporting
 * pages already follow. No fabricated metric.
 */
export default async function TechnicalSupportReportsPage() {
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
  const loadError = vendorSourcesResult.status === 'rejected' ? vendorSourcesResult.reason : null;

  const byStatus = supportRequests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <TechnicalSupportOSNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Technical Support OS</span>
              <h1>Reports</h1>
              <p className="lead">Vendor scan history and support case volume, generated from real data.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            {loadError ? (
              <p className="form-error" role="alert">
                {errorMessage(loadError)}
              </p>
            ) : (
              <>
                <h2>Vendor scan history</h2>
                <div className="console-list" style={{ marginBottom: 32 }}>
                  {vendorSources.map((vs) => (
                    <div key={vs.id} className="console-row">
                      <div className="console-row-main">
                        <span className="console-row-title">{vs.vendor_name}</span>
                        <span className="console-row-meta">
                          {vs.document_count} ingested, {vs.changed_count} superseded, {vs.failed_count} failed
                          {' — last scan: '}
                          {vs.last_scan_status} {vs.last_scan_at ? `(${new Date(vs.last_scan_at).toLocaleString()})` : '(never)'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <h2>Support case volume by status</h2>
                <div className="console-list">
                  {Object.entries(byStatus).length === 0 ? (
                    <p className="form-note">No support cases recorded.</p>
                  ) : (
                    Object.entries(byStatus).map(([status, count]) => (
                      <div key={status} className="console-row">
                        <div className="console-row-main">
                          <span className="console-row-title">{status}</span>
                          <span className="console-row-meta">{count} case{count === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
