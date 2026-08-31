// Server-only vendor source data access, per FRONTEND_ARCHITECTURE_V1.md
// §C.8's own convention (mirrors lib/api/knowledge.js).
// TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- now backs the full Vendor
// Sources surface under Technical Support OS (moved out of Knowledge
// entirely, per direct instruction); the underlying backend contract
// (teracom-ai-backend 781cfe3) gained enabled/removed_at/schedule_interval,
// a shared PATCH endpoint, and a fuller per-source document/version list.
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

// One shared partial-update call backing edit, enable/disable, schedule
// change, and remove -- mirrors the backend's own single PATCH endpoint
// exactly (only the fields present in `payload` are changed).
export async function updateVendorSource(token, vendorSourceId, payload) {
  return backendFetch(`/vendor-sources/${vendorSourceId}`, { method: 'PATCH', token, body: payload });
}

export async function scanVendorSource(token, vendorSourceId) {
  return backendFetch(`/vendor-sources/${vendorSourceId}/scan`, { method: 'POST', token });
}

export async function fetchVendorSourceDocuments(token, vendorSourceId) {
  return backendFetch(`/vendor-sources/${vendorSourceId}/documents`, { token });
}
