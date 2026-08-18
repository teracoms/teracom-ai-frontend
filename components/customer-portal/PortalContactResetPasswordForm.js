'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalContactResetPasswordForm({ token }) {
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (newPassword.length < 8) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal-contact/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to reset this password.');
      }

      setSubmitted(true);
      setTimeout(() => router.push('/customer-portal/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset this password.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p className="form-note-banner" role="status">
        Password updated. Redirecting you to sign in...
      </p>
    );
  }

  return (
    <form className="contact-form auth-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <input
        type="password"
        placeholder="New password (min. 8 characters)"
        autoComplete="new-password"
        required
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        disabled={submitting}
      />

      <button className="btn btn-primary" type="submit" disabled={submitting || newPassword.length < 8}>
        {submitting ? 'Saving...' : 'Set new password'}
      </button>
    </form>
  );
}
