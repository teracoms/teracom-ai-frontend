// Server-only Media Centre data access, per Phase 0 Package K (Marketing &
// Media Platform, objective #8). An item is created only from an *approved*
// content piece or video asset (never automatic), and only advances from
// "ready" to "published" via a further explicit, admin-only action — the
// two-step content-publishing governance rule ADR-015 originates.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/mediaCentre.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function publishMediaItem(token, payload) {
  return backendFetch('/media-centre/publish', { method: 'POST', token, body: payload });
}

export async function markMediaItemPublished(token, itemId) {
  return backendFetch(`/media-centre/${itemId}/mark-published`, { method: 'POST', token });
}

export async function fetchMediaCentreItems(token, kind) {
  return backendFetch('/media-centre/', { token, searchParams: kind ? { kind } : undefined });
}
