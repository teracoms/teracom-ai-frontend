'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';

/**
 * Video production workflows (Phase 0 Package K, objective #7) — the
 * Video Producer tier of the Marketing Manager -> Content Producer ->
 * Video Producer pipeline (objective #12). "Draft with AI" optionally
 * chains from an *approved* content piece (`approvedContentPieces`) — the
 * concrete pipeline handoff. Decide (approve/reject) buttons only render
 * for an admin — a presentation-layer convenience, the real gate is
 * backend-side (ADR-015).
 */
export default function VideoAssetPanel({ campaignId, videoAssets, workers, approvedContentPieces }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');
  const [contentPieceId, setContentPieceId] = useState('');
  const [workerId, setWorkerId] = useState(workers?.[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !script.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          title: title.trim(),
          script: script.trim(),
          content_piece_id: contentPieceId || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit this video asset.');
      }

      setTitle('');
      setScript('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit this video asset.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDraft() {
    if (!title.trim() || !workerId) return;

    setError(null);
    setDrafting(true);

    try {
      const response = await fetch('/api/portal/videos/draft-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          title: title.trim(),
          worker_id: workerId,
          content_piece_id: contentPieceId || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to draft this video script.');
      }

      setScript(data.script);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to draft this video script.');
    } finally {
      setDrafting(false);
    }
  }

  async function handleSubmitDraft(videoAssetId) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/videos/${videoAssetId}/submit`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit this video asset.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit this video asset.');
    }
  }

  async function handleDecide(videoAssetId, decision) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/videos/${videoAssetId}/decide`, {
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
        <span className="eyebrow">Video</span>
        <h2>Video production.</h2>
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
          placeholder="Video title"
          disabled={submitting}
          aria-label="Video title"
        />

        {approvedContentPieces?.length > 0 && (
          <select
            value={contentPieceId}
            onChange={(event) => setContentPieceId(event.target.value)}
            disabled={submitting || drafting}
            aria-label="Source content piece"
          >
            <option value="">No source content piece</option>
            {approvedContentPieces.map((piece) => (
              <option key={piece.id} value={piece.id}>
                {piece.title}
              </option>
            ))}
          </select>
        )}

        <textarea
          value={script}
          onChange={(event) => setScript(event.target.value)}
          placeholder="Script"
          disabled={submitting}
          aria-label="Script"
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
            <button type="button" className="btn btn-secondary" onClick={handleDraft} disabled={drafting || !title.trim()}>
              {drafting ? 'Drafting...' : 'Draft with AI'}
            </button>
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={submitting || !title.trim() || !script.trim()}>
          {submitting ? 'Submitting...' : 'Submit Video'}
        </button>
      </form>

      {(!videoAssets || videoAssets.length === 0) ? (
        <p className="activity-meta">No video assets yet.</p>
      ) : (
        <ul className="activity-list">
          {videoAssets.map((asset) => (
            <li key={asset.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {asset.title} <span className="badge">{asset.status}</span>
                  </p>
                  <p className="activity-meta">{asset.script}</p>
                </div>
                <div>
                  {asset.status === 'draft' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => handleSubmitDraft(asset.id)}
                    >
                      Submit
                    </button>
                  )}
                  {asset.status === 'submitted' && user?.role === 'admin' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        onClick={() => handleDecide(asset.id, 'approved')}
                      >
                        Approve
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => handleDecide(asset.id, 'rejected')}
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
