'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * Production Operations Platform (Phase 0 Package PQR, objectives
 * #10-#11) — a two-step gate mirroring Package K's MediaCentreItem
 * "ready" -> "published" gate: submit -> admin-decide -> a further,
 * separate admin "Mark Completed" action. No code path here touches
 * real infrastructure; this is a recorded row through a human-gated
 * workflow.
 */
export default function DeploymentRecordPanel({ records }) {
  const { user } = useAuth();
  const [versionLabel, setVersionLabel] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!versionLabel.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal/deployment-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version_label: versionLabel.trim(),
          description: description.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit this deployment.');
      }

      setVersionLabel('');
      setDescription('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit this deployment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecide(recordId, decision) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/deployment-records/${recordId}/decide`, {
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

  async function handleComplete(recordId) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/deployment-records/${recordId}/complete`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to mark this deployment completed.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark this deployment completed.');
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Deployments</span>
        <h2>Deployment governance.</h2>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          value={versionLabel}
          onChange={(event) => setVersionLabel(event.target.value)}
          placeholder="Version label (e.g. v1.2.0)"
          disabled={submitting}
          aria-label="Version label"
        />
        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (optional)"
          disabled={submitting}
          aria-label="Description"
        />
        <button className="btn btn-primary" type="submit" disabled={submitting || !versionLabel.trim()}>
          {submitting ? 'Submitting...' : 'Submit Deployment'}
        </button>
      </form>

      {(!records || records.length === 0) ? (
        <p className="activity-meta">No deployment records yet.</p>
      ) : (
        <ul className="activity-list">
          {records.map((record) => (
            <li key={record.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {record.version_label} <span className="badge">{record.status}</span>
                  </p>
                  {record.description && <p className="activity-meta">{record.description}</p>}
                </div>
                {isAtLeastRole(user?.role, 'admin') && record.status === 'proposed' && (
                  <div>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => handleDecide(record.id, 'approved')}
                    >
                      Approve
                    </button>{' '}
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => handleDecide(record.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {isAtLeastRole(user?.role, 'admin') && record.status === 'approved' && (
                  <button type="button" className="btn btn-primary btn-small" onClick={() => handleComplete(record.id)}>
                    Mark Completed
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
