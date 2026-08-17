// Server-only, staff-facing support request access (Phase 0 Package O).
// Reused by both the org-wide /portal/support inbox and the per-contact
// SupportRequestPanel on ContactDetailPage.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/supportRequests.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchSupportRequests(token, filters = {}) {
  return backendFetch('/support-requests/', { token, searchParams: filters });
}

export async function fetchSupportRequest(token, requestId) {
  return backendFetch(`/support-requests/${requestId}`, { token });
}

export async function updateSupportRequestStatus(token, requestId, status) {
  return backendFetch(`/support-requests/${requestId}/status`, { method: 'PATCH', token, body: { status } });
}

export async function postSupportRequestMessage(token, requestId, body) {
  return backendFetch(`/support-requests/${requestId}/messages`, { method: 'POST', token, body: { body } });
}

export async function fetchSupportRequestMessages(token, requestId) {
  return backendFetch(`/support-requests/${requestId}/messages`, { token });
}
