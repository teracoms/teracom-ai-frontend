'use client';

import { useEffect, useState } from 'react';

function formatSession(session) {
  const device = session.user_agent || 'Unknown device';
  const location = session.ip_address || 'Unknown location';
  return `${device} — ${location}`;
}

/**
 * Settings & Security V1 -- Active Sessions
 * (SETTINGS_SECURITY_V1_ARCHITECTURE.md §3, §1.3). Client-rendered
 * (not server-fetched like most of this product's pages) because
 * revoking a row needs to update the list in place without a full page
 * reload -- the same real-time-list-with-inline-actions shape this
 * page's own MFA/Password sections don't need, since those aren't
 * lists.
 */
export default function ActiveSessionsPanel() {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  async function load() {
    try {
      const response = await fetch('/api/portal/sessions');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to load your sessions.');
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your sessions.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function revoke(sessionId) {
    setError(null);
    setBusyId(sessionId);
    try {
      const response = await fetch(`/api/portal/sessions/${sessionId}/revoke`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to revoke this session.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to revoke this session.');
    } finally {
      setBusyId(null);
    }
  }

  async function revokeOthers() {
    setError(null);
    setRevokingOthers(true);
    try {
      const response = await fetch('/api/portal/sessions/revoke-others', { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to sign out other sessions.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign out other sessions.');
    } finally {
      setRevokingOthers(false);
    }
  }

  if (error) {
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  }

  if (sessions === null) {
    return <p className="activity-meta">Loading your sessions...</p>;
  }

  return (
    <div>
      <ul className="activity-list">
        {sessions.map((session) => (
          <li key={session.id}>
            <div className="assignment-row">
              <div>
                <p className="activity-title">
                  {formatSession(session)} {session.is_current && <span className="badge">This session</span>}
                </p>
                <p className="activity-meta">
                  Signed in {new Date(session.created_at).toLocaleString()} · expires{' '}
                  {new Date(session.expires_at).toLocaleString()}
                </p>
              </div>
              {!session.is_current && (
                <button
                  className="btn btn-secondary btn-small"
                  type="button"
                  onClick={() => revoke(session.id)}
                  disabled={busyId === session.id}
                >
                  {busyId === session.id ? 'Revoking...' : 'Revoke'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {sessions.length > 1 && (
        <button className="btn btn-secondary btn-small" type="button" onClick={revokeOthers} disabled={revokingOthers}>
          {revokingOthers ? 'Signing out...' : 'Sign out all other sessions'}
        </button>
      )}
    </div>
  );
}
