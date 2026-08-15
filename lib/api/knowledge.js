// Server-only knowledge data access, per FRONTEND_ARCHITECTURE_V1.md §C.8.
//
// GET /knowledge/ (the full-catalogue read) is deliberately NOT duplicated
// here — Package 3 (Workers) already added fetchKnowledgeCatalogue() to
// lib/api/workers.js as the "assign existing knowledge to a worker" picker
// source, and it's the exact same call this package's list page needs. See
// KNOWLEDGE_IMPLEMENTATION_REPORT.md §2 for why it's imported from there
// instead of re-declared.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/knowledge.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchKnowledgeSummary(token) {
  return backendFetch('/knowledge-summary/', { token });
}

export async function fetchKnowledgeGrowth(token) {
  return backendFetch('/knowledge-growth/', { token });
}

export async function fetchKnowledgeAssignmentsSummary(token) {
  return backendFetch('/knowledge-assignments/summary', { token });
}

export async function fetchDocument(token, documentId) {
  return backendFetch(`/documents/${documentId}`, { token });
}

export async function deleteDocument(token, documentId) {
  return backendFetch(`/documents/${documentId}`, { method: 'DELETE', token });
}

export async function reindexDocument(token, documentId) {
  return backendFetch(`/documents/reindex/${documentId}`, { method: 'POST', token });
}

export async function fetchUploadHistory(token) {
  return backendFetch('/upload-history/', { token });
}

export async function fetchUploadMetrics(token) {
  return backendFetch('/upload-metrics/', { token });
}

/**
 * POST /upload/ (services/upload_service.py + knowledge_ingestion_service.py)
 * is multipart: `worker_id` (Form) + `file` (File). It extracts text, creates
 * the Knowledge row, assigns it to the given worker, and indexes it into
 * Chroma in one call — but its response is only `{filename, status}`, with
 * no id of the created document (see schemas/upload.py#UploadResponse).
 * Callers cannot redirect to the new document's detail page after upload for
 * this reason — see KNOWLEDGE_IMPLEMENTATION_REPORT.md §3.
 */
export async function uploadKnowledgeDocument(token, formData) {
  return backendFetch('/upload/', { method: 'POST', token, body: formData });
}

export async function semanticSearch(token, query) {
  return backendFetch('/search/', { method: 'POST', token, body: { query } });
}
