// Server-only, Customer Portal (Phase 0 Package O) — read-only. No
// customer-facing write capability exists on Proposal/Quote/Contract of any
// kind — financial and contract approvals remain human-controlled,
// unchanged from Package J.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/portalContactDeals.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchPortalContactProposals(token) {
  return backendFetch('/portal-contact/proposals', { token });
}

export async function fetchPortalContactQuotes(token) {
  return backendFetch('/portal-contact/quotes', { token });
}

export async function fetchPortalContactContracts(token) {
  return backendFetch('/portal-contact/contracts', { token });
}
