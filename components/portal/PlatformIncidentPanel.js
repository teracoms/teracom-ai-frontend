'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * Production Operations Platform (Phase 0 Package PQR, objective
 * #14) — mirrors ProjectPanel/TaskPanel's shape (operational
 * execution tracking, not a financial or contractual commitment),
 * gated at employee tier and above (Read Only Tier Enforcement).
 */
export default function PlatformIncidentPanel({ incidents }) {
  const { user } = useAuth();
  const canWrite = isAtLeastRole(user?.role, 'employee');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal/platform-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), severity }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to report this incident.');
      }

      setTitle('');
      setDescription('');
      setSeverity('medium');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to report this incident.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(incidentId, status) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/platform-incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this incident's status.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this incident's status.");
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Incidents</span>
        <h2>Platform incidents.</h2>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!canWrite ? (
        <p className="form-note">You have read-only access and can&apos;t report an incident.</p>
      ) : (
      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Incident title"
          disabled={submitting}
          aria-label="Incident title"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          disabled={submitting}
          aria-label="Description"
        />
        <select value={severity} onChange={(event) => setSeverity(event.target.value)} disabled={submitting} aria-label="Severity">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <button className="btn btn-primary" type="submit" disabled={submitting || !title.trim() || !description.trim()}>
          {submitting ? 'Reporting...' : 'Report Incident'}
        </button>
      </form>
      )}

      {(!incidents || incidents.length === 0) ? (
        <p className="activity-meta">No platform incidents yet.</p>
      ) : (
        <ul className="activity-list">
          {incidents.map((incident) => (
            <li key={incident.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {incident.title} <span className="badge">{incident.severity}</span>{' '}
                    <span className="badge">{incident.status}</span>
                  </p>
                  <p className="activity-meta">{incident.description}</p>
                </div>
                {canWrite && (
                  <select
                    value={incident.status}
                    onChange={(event) => handleStatusChange(incident.id, event.target.value)}
                    aria-label={`Status for ${incident.title}`}
                  >
                    <option value="open">Open</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="resolved">Resolved</option>
                  </select>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
