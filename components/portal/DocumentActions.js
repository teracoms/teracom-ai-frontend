'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Delete and reindex both go through the same-origin BFF proxy
 * (app/api/portal/knowledge/[documentId]/{,reindex}/route.js), never
 * straight to the backend. Neither action is role-gated backend-side
 * (api/documents.py's DELETE/reindex routes only require get_current_user,
 * no require_role check) — `canDelete` is a presentation-only convention
 * restricting the destructive action to admins in this UI, not a security
 * boundary the backend itself enforces. See
 * KNOWLEDGE_IMPLEMENTATION_REPORT.md §4.
 */
export default function DocumentActions({ documentId, canDelete }) {
  const [reindexing, setReindexing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [reindexed, setReindexed] = useState(false);
  const router = useRouter();

  async function handleReindex() {
    setError(null);
    setReindexing(true);

    try {
      const response = await fetch(`/api/portal/knowledge/${documentId}/reindex`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to reindex this document.');
      }

      setReindexed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reindex this document.');
    } finally {
      setReindexing(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;

    setError(null);
    setDeleting(true);

    try {
      const response = await fetch(`/api/portal/knowledge/${documentId}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete this document.');
      }

      router.push('/portal/knowledge');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this document.');
      setDeleting(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {reindexed && !error && (
        <p className="form-note-banner" role="status">
          Reindexed — this document&apos;s embeddings have been refreshed.
        </p>
      )}

      <div className="document-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleReindex}
          disabled={reindexing || deleting}
        >
          {reindexing ? 'Reindexing...' : 'Reindex'}
        </button>

        {canDelete && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDelete}
            disabled={reindexing || deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Document'}
          </button>
        )}
      </div>
    </div>
  );
}
