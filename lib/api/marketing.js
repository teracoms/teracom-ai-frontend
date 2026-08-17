// Server-only campaign data access, per Phase 0 Package K (Marketing &
// Media Platform). A Campaign is the container that starts the Marketing
// Manager -> Content Producer -> Video Producer pipeline (objective #12) —
// see docs/backend/PHASE_0_PACKAGE_K_MARKETING_AND_MEDIA_IMPLEMENTATION_REPORT.md.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/marketing.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function createCampaign(token, payload) {
  return backendFetch('/campaigns/', { method: 'POST', token, body: payload });
}

export async function fetchCampaigns(token, stage) {
  return backendFetch('/campaigns/', { token, searchParams: stage ? { stage } : undefined });
}

export async function fetchCampaign(token, campaignId) {
  return backendFetch(`/campaigns/${campaignId}`, { token });
}

// Stage only ever moves forward (planning -> active -> completed) —
// teracom-ai-backend rejects a backward move with a 400.
export async function updateCampaignStage(token, campaignId, stage) {
  return backendFetch(`/campaigns/${campaignId}/stage`, {
    method: 'PATCH',
    token,
    body: { stage },
  });
}

// Executive marketing dashboards (objective #11) and CTO dashboard
// visibility (objective #15).
export async function fetchMarketingSummary(token) {
  return backendFetch('/marketing/summary', { token });
}
