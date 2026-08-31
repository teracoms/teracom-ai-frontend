import EmptyState from '@/components/portal/EmptyState';

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- shared rendering for Product
 * Documentation / Technical Knowledge / Software and Firmware / Vendor
 * Advisories. All four are the identical real document list
 * (lib/api/vendorKnowledge.js#fetchAllVendorDocuments), filtered by
 * lib/api/vendorKnowledge.js#categoriseVendorDocument's own best-effort,
 * title-based category -- there is no real per-document "kind" field in
 * this backend today, named honestly rather than presented as four
 * independently-sourced views.
 */
export default function VendorKnowledgeListView({ documents, emptyDescription }) {
  if (documents.length === 0) {
    return <EmptyState title="No documents yet" description={emptyDescription} />;
  }

  return (
    <div className="console-list">
      {documents
        .filter((doc) => doc.status === 'ingested')
        .map((doc) => (
          <div key={doc.id} className="console-row">
            <div className="console-row-main">
              <span className="console-row-title">{doc.vendor_name}</span>
              <span className="console-row-meta">{doc.source_url}</span>
            </div>
          </div>
        ))}
    </div>
  );
}
