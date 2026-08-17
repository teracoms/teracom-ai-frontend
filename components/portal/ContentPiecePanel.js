'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';

/**
 * Content production workflows (Phase 0 Package K, objective #6) — the
 * Content Producer tier of the Marketing Manager -> Content Producer ->
 * Video Producer pipeline (objective #12). "Draft with AI" is gated
 * backend-side by the "marketing_intelligence" capability. Decide
 * (approve/reject) buttons only render for an admin — a
 * presentation-layer convenience, the real gate is backend-side
 * (ADR-015).
 */
export default function ContentPiecePanel({ campaignId, contentPieces, workers }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [brief, setBrief] = useState('');
  const [workerId, setWorkerId] = useState(workers?.[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId, title: title.trim(), content: content.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit this content piece.');
      }

      setTitle('');
      setContent('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit this content piece.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDraft() {
    if (!title.trim() || !brief.trim() || !workerId) return;

    setError(null);
    setDrafting(true);

    try {
      const response = await fetch('/api/portal/content/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId, title: title.trim(), brief: brief.trim(), worker_id: workerId }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to draft this content piece.');
      }

      setContent(data.content);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to draft this content piece.');
    } finally {
      setDrafting(false);
    }
  }

  async function handleSubmitDraft(contentPieceId) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/content/${contentPieceId}/submit`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit this content piece.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit this content piece.');
    }
  }

  async function handleDecide(contentPieceId, decision) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/content/${contentPieceId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to record this decision.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record this decision.');
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Content</span>
        <h2>Content production.</h2>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Content title"
          disabled={submitting}
          aria-label="Content title"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Content"
          disabled={submitting}
          aria-label="Content"
          rows={4}
        />

        {workers?.length > 0 && (
          <div>
            <select
              value={workerId}
              onChange={(event) => setWorkerId(event.target.value)}
              disabled={drafting}
              aria-label="Drafting worker"
            >
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="Brief for AI draft"
              disabled={drafting}
              aria-label="Draft brief"
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDraft}
              disabled={drafting || !title.trim() || !brief.trim()}
            >
              {drafting ? 'Drafting...' : 'Draft with AI'}
            </button>
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={submitting || !title.trim() || !content.trim()}>
          {submitting ? 'Submitting...' : 'Submit Content'}
        </button>
      </form>

      {(!contentPieces || contentPieces.length === 0) ? (
        <p className="activity-meta">No content pieces yet.</p>
      ) : (
        <ul className="activity-list">
          {contentPieces.map((piece) => (
            <li key={piece.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {piece.title} <span className="badge">{piece.status}</span>
                  </p>
                  <p className="activity-meta">{piece.content}</p>
                </div>
                <div>
                  {piece.status === 'draft' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => handleSubmitDraft(piece.id)}
                    >
                      Submit
                    </button>
                  )}
                  {piece.status === 'submitted' && user?.role === 'admin' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        onClick={() => handleDecide(piece.id, 'approved')}
                      >
                        Approve
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => handleDecide(piece.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
