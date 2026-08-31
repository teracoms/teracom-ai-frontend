// Server-only aggregation over the real vendor-sources/vendor-documents
// endpoints -- TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION. No new backend
// endpoint: Product Documentation / Technical Knowledge / Software and
// Firmware / Vendor Advisories and the Dashboard/Reports pages all need an
// org-wide view across every vendor source's own documents, and the real
// backend only exposes documents per-source (GET /vendor-sources/{id}/
// documents). This fetches the source list once, then each source's own
// document list, and flattens them -- an accepted N+1 at this MVP's real
// scale (a handful of vendor sources per organisation), not a new
// aggregate endpoint.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/vendorKnowledge.js must only be used on the server.');
}

import { fetchVendorSources, fetchVendorSourceDocuments } from './vendorSources.js';

export async function fetchAllVendorDocuments(token) {
  const vendorSources = await fetchVendorSources(token);

  const perSource = await Promise.all(
    vendorSources.map(async (vendorSource) => {
      try {
        const documents = await fetchVendorSourceDocuments(token, vendorSource.id);
        return documents.map((doc) => ({ ...doc, vendor_source_id: vendorSource.id, vendor_name: vendorSource.vendor_name }));
      } catch {
        // One source's documents failing to load must never take down the
        // whole aggregate view -- the same "one bad item never aborts the
        // batch" discipline this codebase applies elsewhere.
        return [];
      }
    })
  );

  return perSource.flat();
}

// Best-effort, title-based categorisation -- the real backend has no
// per-document "kind" tagging today (confirmed: neither VendorDocument nor
// Knowledge carries one). This is a coarse, honestly-labelled filter over
// one real document list, not four independently fabricated categories.
const CATEGORY_KEYWORDS = {
  firmware: ['firmware', 'release note', 'release_notes', 'changelog'],
  advisory: ['advisory', 'bulletin', 'recall', 'security notice'],
};

export function categoriseVendorDocument(document) {
  const haystack = `${document.source_url ?? ''}`.toLowerCase();

  if (CATEGORY_KEYWORDS.firmware.some((keyword) => haystack.includes(keyword))) {
    return 'firmware';
  }

  if (CATEGORY_KEYWORDS.advisory.some((keyword) => haystack.includes(keyword))) {
    return 'advisory';
  }

  return 'documentation';
}
