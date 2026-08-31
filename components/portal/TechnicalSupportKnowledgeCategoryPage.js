import { getSessionToken } from '@/lib/api/auth';
import { fetchAllVendorDocuments, categoriseVendorDocument } from '@/lib/api/vendorKnowledge';
import { errorMessage } from '@/lib/api/results';
import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';
import VendorKnowledgeListView from '@/components/portal/VendorKnowledgeListView';

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- shared server-component body
 * for the four Knowledge-derived OS areas, each a thin page.js instantiating
 * this with its own title/category. `category=null` means "documentation"
 * (no keyword match) — used by both Product Documentation and Technical
 * Knowledge, which are, honestly, the same real underlying pool today; no
 * real signal in this backend distinguishes them yet.
 */
export default async function TechnicalSupportKnowledgeCategoryPage({ eyebrow, title, lead, category }) {
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

  let documents = [];
  let loadError = null;
  try {
    const allDocuments = await fetchAllVendorDocuments(token);
    documents = allDocuments.filter((doc) => categoriseVendorDocument(doc) === category);
  } catch (error) {
    loadError = error;
  }

  return (
    <>
      <TechnicalSupportOSNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
              <p className="lead">{lead}</p>
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
              <VendorKnowledgeListView
                documents={documents}
                emptyDescription="Nothing here yet — documents appear once ingested from a vendor source and matching this category."
              />
            )}
          </div>
        </section>
      </main>
    </>
  );
}
