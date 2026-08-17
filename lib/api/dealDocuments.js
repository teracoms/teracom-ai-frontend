// Server-only proposal/quote/contract data access, per Phase 0 Package J
// (Sales & Customer Success Platform). One file, not three — the three
// backend routers (POST /proposals/, /quotes/, /contracts/) are near-identical
// in shape, and three near-duplicate frontend files would be pure
// repetition. Quotes and contracts are always human-entered (submitted in
// one step); only proposals get an optional AI-drafted path
// (draftProposal/submitProposal), gated by the "sales_intelligence"
// capability backend-side.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/dealDocuments.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function submitProposal(token, payload) {
  return backendFetch('/proposals/', { method: 'POST', token, body: payload });
}

export async function draftProposal(token, workerId, payload) {
  return backendFetch('/proposals/draft', {
    method: 'POST',
    token,
    body: payload,
    searchParams: { worker_id: workerId },
  });
}

export async function submitDraftedProposal(token, proposalId) {
  return backendFetch(`/proposals/${proposalId}/submit`, { method: 'POST', token });
}

export async function decideProposal(token, proposalId, decision, notes) {
  return backendFetch(`/proposals/${proposalId}/decide`, {
    method: 'POST',
    token,
    body: { decision, ...(notes ? { notes } : {}) },
  });
}

export async function fetchProposals(token, crmContactId) {
  return backendFetch('/proposals/', { token, searchParams: { crm_contact_id: crmContactId } });
}

export async function submitQuote(token, payload) {
  return backendFetch('/quotes/', { method: 'POST', token, body: payload });
}

export async function decideQuote(token, quoteId, decision, notes) {
  return backendFetch(`/quotes/${quoteId}/decide`, {
    method: 'POST',
    token,
    body: { decision, ...(notes ? { notes } : {}) },
  });
}

export async function fetchQuotes(token, crmContactId) {
  return backendFetch('/quotes/', { token, searchParams: { crm_contact_id: crmContactId } });
}

export async function submitContract(token, payload) {
  return backendFetch('/contracts/', { method: 'POST', token, body: payload });
}

export async function decideContract(token, contractId, decision, notes) {
  return backendFetch(`/contracts/${contractId}/decide`, {
    method: 'POST',
    token,
    body: { decision, ...(notes ? { notes } : {}) },
  });
}

export async function fetchContracts(token, crmContactId) {
  return backendFetch('/contracts/', { token, searchParams: { crm_contact_id: crmContactId } });
}
