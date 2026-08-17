// Server-only, Customer Portal (Phase 0 Package O). The only two
// customer-portal mutation paths — create a request, reply to one.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/portalContactSupportRequests.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function createPortalContactSupportRequest(token, payload) {
  return backendFetch('/portal-contact/support-requests/', { method: 'POST', token, body: payload });
}

export async function fetchPortalContactSupportRequests(token) {
  return backendFetch('/portal-contact/support-requests/', { token });
}

export async function fetchPortalContactSupportRequest(token, requestId) {
  return backendFetch(`/portal-contact/support-requests/${requestId}`, { token });
}

export async function postPortalContactSupportRequestMessage(token, requestId, body) {
  return backendFetch(`/portal-contact/support-requests/${requestId}/messages`, {
    method: 'POST',
    token,
    body: { body },
  });
}

export async function fetchPortalContactSupportRequestMessages(token, requestId) {
  return backendFetch(`/portal-contact/support-requests/${requestId}/messages`, { token });
}
