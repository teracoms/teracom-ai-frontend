'use client';

import { useState } from 'react';

/**
 * Settings & Security V1 -- POST /auth/change-password via
 * app/api/portal/change-password/route.js. On success, every existing
 * session (including this one) is signed out backend-side
 * (SETTINGS_SECURITY_V1_ARCHITECTURE.md §3) -- this form redirects to
 * login rather than pretending the current session survives.
 */
export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to change your password.');
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change your password.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div>
        <p className="activity-meta">
          Your password has been changed. For your security, every session — including this one — has
          been signed out.
        </p>
        <a className="btn btn-primary" href="/portal/login">
          Sign in again
        </a>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <input
        type="password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        placeholder="Current password"
        autoComplete="current-password"
        required
        disabled={submitting}
        aria-label="Current password"
      />
      <input
        type="password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        placeholder="New password"
        autoComplete="new-password"
        required
        disabled={submitting}
        aria-label="New password"
      />
      <button className="btn btn-primary" type="submit" disabled={submitting || !currentPassword || !newPassword}>
        {submitting ? 'Changing...' : 'Change password'}
      </button>
    </form>
  );
}
