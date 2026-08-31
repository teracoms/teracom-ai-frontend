import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchVendorSourceDocuments, fetchVendorSources } from '@/lib/api/vendorSources';
import { errorMessage } from '@/lib/api/results';
import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';

export const metadata = {
  title: 'Vendor Documents | Technical Support OS | Teracom AI Portal',
};

const STATUS_LABELS = {
  discovered: 'Discovered',
  downloaded: 'Downloaded',
  ingested: 'Ingested (current)',
  failed: 'Failed',
  superseded: 'Superseded (older version)',
};

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- "View discovered, downloaded,
 * changed and failed documents. View document versions. View ingestion
 * status." One flat GET /vendor-sources/{id}/documents call already carries
 * everything needed: grouped here by source_url, each group's own version
 * chain walked via superseded_by_id (real, per teracom-ai-backend 781cfe3)
 * rather than a second endpoint.
 */
export default async function VendorSourceDocumentsPage({ params }) {
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

  let documents;
  let vendorSource;
  try {
    const [docs, sources] = await Promise.all([
      fetchVendorSourceDocuments(token, params.id),
      fetchVendorSources(token),
    ]);
    documents = docs;
    vendorSource = sources.find((vs) => vs.id === params.id);
  } catch (error) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <p className="form-error" role="alert">
              {errorMessage(error)}
            </p>
          </div>
        </section>
      </main>
    );
  }

  // Group by source_url so each real document's own version chain
  // (discovered -> ... -> superseded -> superseded -> ingested/current)
  // renders as one unit, newest first.
  const groups = new Map();
  for (const doc of documents) {
    if (!groups.has(doc.source_url)) groups.set(doc.source_url, []);
    groups.get(doc.source_url).push(doc);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => new Date(b.discovered_at) - new Date(a.discovered_at));
  }

  return (
    <>
      <TechnicalSupportOSNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Technical Support OS</span>
              <h1>Documents — {vendorSource?.vendor_name ?? 'Vendor source'}</h1>
              <p className="lead">
                Every document discovered under this vendor source, grouped by URL, newest
                version first.
              </p>
            </div>
            <div className="hero-actions">
              <Link className="btn btn-secondary" href="/portal/operating-systems/technical-support/vendor-sources">
                Back to Vendor Sources
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            {groups.size === 0 ? (
              <p className="form-note">No documents discovered yet — run Scan Now from the Vendor Sources page.</p>
            ) : (
              [...groups.entries()].map(([sourceUrl, versions]) => (
                <div key={sourceUrl} className="console-list" style={{ marginBottom: 20 }}>
                  <div className="console-row" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <p className="form-note">{sourceUrl}</p>
                      {versions.map((doc, index) => (
                        <p key={doc.id} className="form-note">
                          {index === 0 ? '● ' : '○ '}
                          <strong>{STATUS_LABELS[doc.status] ?? doc.status}</strong>
                          {' — discovered '}
                          {new Date(doc.discovered_at).toLocaleString()}
                          {doc.content_hash ? ` — hash ${doc.content_hash.slice(0, 12)}…` : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}
