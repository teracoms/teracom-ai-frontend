// Server-only vendor source data access, per FRONTEND_ARCHITECTURE_V1.md
// §C.8's own convention (mirrors lib/api/knowledge.js). TECHNICAL_SUPPORT_
// OS_MVP_V1 -- backs the "Vendor Sources" tab under Knowledge.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/vendorSources.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchVendorSources(token) {
  return backendFetch('/vendor-sources/', { token });
}

export async function createVendorSource(token, payload) {
  return backendFetch('/vendor-sources/', { method: 'POST', token, body: payload });
}

export async function scanVendorSource(token, vendorSourceId) {
  return backendFetch(`/vendor-sources/${vendorSourceId}/scan`, { method: 'POST', token });
}
