// Server-only Marketplace/Worker Pack data access, per
// FRONTEND_ARCHITECTURE_V1.md §C.4 — the browser never calls
// BACKEND_API_URL directly. Backed by real endpoints (Phase 0 Package D,
// PHASE_0_PACKAGE_D_MARKETPLACE_IMPLEMENTATION_REPORT.md), unlike
// lib/licensing/referenceLicence.js's illustrative-only data — see that
// file's own header for why it was written that way before this package
// existed.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/marketplace.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchMarketplacePacks(token) {
  return backendFetch('/marketplace/packs', { token });
}

// Phase 0 Package E — Worker Pack ranking (RECOMMENDATION_ENGINE_MVP_V1.md).
// Computed entirely server-side from local data; this call never reaches an
// Intelligence Cloud service, only teracom-ai-backend's own
// GET /marketplace/recommendations.
export async function fetchMarketplaceRecommendations(token) {
  return backendFetch('/marketplace/recommendations', { token });
}

export async function fetchMarketplacePackDetail(token, slug, { source } = {}) {
  return backendFetch(`/marketplace/packs/${encodeURIComponent(slug)}`, {
    token,
    searchParams: source ? { source } : undefined,
  });
}
