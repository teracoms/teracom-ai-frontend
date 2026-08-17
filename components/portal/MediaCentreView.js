'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import EmptyState from '@/components/portal/EmptyState';

/**
 * Media Centre foundation (Phase 0 Package K, objective #8). An item is
 * published here only from an *approved* content piece or video asset
 * (never automatic — publishItem is a deliberate, explicit action, not a
 * side effect of approval). "Mark Published" only renders for an admin —
 * a presentation-layer convenience, the real gate is backend-side
 * (ADR-015's second governance step).
 */
export default function MediaCentreView({ items, approvedContentPieces, approvedVideoAssets }) {
  const { user } = useAuth();
  const [kind, setKind] = useState('content');
  const [title, setTitle] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const sourceOptions = kind === 'content' ? approvedContentPieces : approvedVideoAssets;

  async function handlePublish(event) {
    event.preventDefault();
    if (!title.trim() || !sourceId) return;

    setError(null);
    setPublishing(true);

    try {
      const response = await fetch('/api/portal/media-centre/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          title: title.trim(),
          content_piece_id: kind === 'content' ? sourceId : undefined,
          video_asset_id: kind === 'video' ? sourceId : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to publish this item.');
      }

      setTitle('');
      setSourceId('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish this item.');
    } finally {
      setPublishing(false);
    }
  }

  async function handleMarkPublished(itemId) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/media-centre/${itemId}/mark-published`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to mark this item published.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark this item published.');
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Media Centre</span>
        <h2>Publication foundation.</h2>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="contact-form" onSubmit={handlePublish} noValidate>
        <select
          value={kind}
          onChange={(event) => {
            setKind(event.target.value);
            setSourceId('');
          }}
          disabled={publishing}
          aria-label="Kind"
        >
          <option value="content">Content</option>
          <option value="video">Video</option>
        </select>
        <select
          value={sourceId}
          onChange={(event) => setSourceId(event.target.value)}
          disabled={publishing || !sourceOptions?.length}
          aria-label="Approved source item"
        >
          <option value="">Select an approved item...</option>
          {sourceOptions?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Publication title"
          disabled={publishing}
          aria-label="Publication title"
        />
        <button className="btn btn-primary" type="submit" disabled={publishing || !title.trim() || !sourceId}>
          {publishing ? 'Publishing...' : 'Publish'}
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState title="Nothing in the Media Centre yet" description="Publish an approved content piece or video above." />
      ) : (
        <ul className="activity-list">
          {items.map((item) => (
            <li key={item.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {item.title} <span className="badge">{item.publication_status}</span>
                  </p>
                  <p className="activity-meta">{item.kind}</p>
                </div>
                {item.publication_status === 'ready' && user?.role === 'admin' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    onClick={() => handleMarkPublished(item.id)}
                  >
                    Mark Published
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
