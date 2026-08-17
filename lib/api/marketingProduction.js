// Server-only content/video data access, per Phase 0 Package K (Marketing &
// Media Platform). One file, not two — the two backend routers (POST
// /content/, /videos/) are near-identical in shape, same "one shared file"
// precedent lib/api/dealDocuments.js set for proposal/quote/contract. Both
// content and video get an optional AI-drafted path (draftContent/
// draftScript), gated by the "marketing_intelligence" capability
// backend-side — unlike Package J, where only proposals (not quotes/
// contracts) got that treatment.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/marketingProduction.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function submitContent(token, payload) {
  return backendFetch('/content/', { method: 'POST', token, body: payload });
}

export async function draftContent(token, workerId, payload) {
  return backendFetch('/content/draft', {
    method: 'POST',
    token,
    body: payload,
    searchParams: { worker_id: workerId },
  });
}

export async function submitDraftedContent(token, contentPieceId) {
  return backendFetch(`/content/${contentPieceId}/submit`, { method: 'POST', token });
}

export async function decideContent(token, contentPieceId, decision, notes) {
  return backendFetch(`/content/${contentPieceId}/decide`, {
    method: 'POST',
    token,
    body: { decision, ...(notes ? { notes } : {}) },
  });
}

export async function fetchContent(token, campaignId) {
  return backendFetch('/content/', { token, searchParams: { campaign_id: campaignId } });
}

export async function submitVideo(token, payload) {
  return backendFetch('/videos/', { method: 'POST', token, body: payload });
}

// content_piece_id, if given, must reference an approved content piece —
// the concrete Content Producer -> Video Producer pipeline handoff
// (objective #12).
export async function draftScript(token, workerId, payload) {
  return backendFetch('/videos/draft-script', {
    method: 'POST',
    token,
    body: payload,
    searchParams: { worker_id: workerId },
  });
}

export async function submitDraftedVideo(token, videoAssetId) {
  return backendFetch(`/videos/${videoAssetId}/submit`, { method: 'POST', token });
}

export async function decideVideo(token, videoAssetId, decision, notes) {
  return backendFetch(`/videos/${videoAssetId}/decide`, {
    method: 'POST',
    token,
    body: { decision, ...(notes ? { notes } : {}) },
  });
}

export async function fetchVideo(token, campaignId) {
  return backendFetch('/videos/', { token, searchParams: { campaign_id: campaignId } });
}
