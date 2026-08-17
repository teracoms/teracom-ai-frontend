// Server-only Memory Summaries data access, per Phase 0 Package H. Purely
// additive long-term retention: a condensed rollup of a scope's raw memory,
// generated on demand via a real backend Ollama call — never edits or
// deletes any raw memory row (see MEMORY_INTELLIGENCE_IMPLEMENTATION_REPORT.md
// §6). Access is gated identically to that scope's own read rule
// (organisation: admin-only; department: any org member; worker: existing
// ownership check) plus the Memory Enrichment capability (Enterprise+).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/memorySummaries.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchMemorySummaries(token, scope, scopeId) {
  return backendFetch('/memory-summaries/', {
    token,
    searchParams: { scope, scope_id: scopeId },
  });
}

export async function generateMemorySummary(token, scope, scopeId) {
  return backendFetch('/memory-summaries/generate', {
    method: 'POST',
    token,
    body: { scope, scope_id: scopeId },
  });
}
