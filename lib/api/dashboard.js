// Server-only dashboard data access.
//
// Per FRONTEND_ARCHITECTURE_V1.md §B.5.5 / §C.6, teracom-ai-backend exposes
// five-plus near-duplicate aggregate endpoints (/dashboard/, /portal-dashboard/,
// /platform/summary, /system/overview, /stats/platform) that all return the
// same shape of counts for the caller's organisation. This module deliberately
// calls only the endpoints the architecture doc names as canonical for the
// portal dashboard screen, rather than mirroring all of them:
//
//   - GET /portal-dashboard/  -> the four headline stat tiles
//   - GET /activity/          -> the recent-activity feed
//   - GET /analytics/chat     -> "platform statistics" (chat session/message totals)
//   - GET /organisations/     -> organisation summary (admin-only backend-side;
//                                callers must handle a 403 gracefully, see
//                                fetchOrganisationSummary below)
if (typeof window !== 'undefined') {
  throw new Error('lib/api/dashboard.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchPortalDashboard(token) {
  return backendFetch('/portal-dashboard/', { token });
}

export async function fetchRecentActivity(token) {
  return backendFetch('/activity/', { token });
}

export async function fetchChatAnalytics(token) {
  return backendFetch('/analytics/chat', { token });
}

/**
 * GET /organisations/ requires the "admin" role backend-side (auth/roles.py's
 * require_role("admin")) — a non-admin caller gets a 403. Rather than treat
 * that as a page-breaking error, the dashboard renders a smaller, degraded
 * "organisation details aren't available to your role" note instead. Callers
 * should catch ApiError and branch on `error.status === 403` for that case;
 * this function does not swallow the error itself, so genuine outages
 * (network failure, 5xx) are still surfaced as real errors.
 */
export async function fetchOrganisationSummary(token) {
  const organisations = await backendFetch('/organisations/', { token });
  return Array.isArray(organisations) ? organisations[0] ?? null : null;
}

/**
 * UI_IMPLEMENTATION_SPRINT_1.md item 1/9 — GET /organisations/me, open to
 * every authenticated role (unlike fetchOrganisationSummary above, which
 * hits the admin-only GET /organisations/). Returns just {id, name, slug,
 * status} — enough for persistent identity display (the nav bar, the
 * dashboard heading), not organisation management. Used from
 * app/(product)/portal/(protected)/layout.js so every portal page can show
 * it, not just the dashboard.
 */
export async function fetchMyOrganisationIdentity(token) {
  return backendFetch('/organisations/me', { token });
}

// CUSTOMER_ONBOARDING_WIZARD_V1.md §1.1 -- Wizard Framework V1, Organisation
// Setup. country/business_size share one endpoint since the wizard collects
// both on one screen; industry keeps its own pre-existing endpoint
// (set_organisation_industry, added for RECOMMENDATION_ENGINE_MVP_V1.md,
// never wired into any frontend form until now).
export async function updateOrganisationProfile(token, payload) {
  return backendFetch('/organisations/profile', { method: 'PATCH', token, body: payload });
}

export async function updateOrganisationIndustry(token, industry) {
  return backendFetch('/organisations/industry', { method: 'PATCH', token, body: { industry } });
}

export async function uploadOrganisationLogo(token, formData) {
  return backendFetch('/organisations/logo', { method: 'POST', token, body: formData });
}
