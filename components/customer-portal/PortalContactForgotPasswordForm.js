'use client';

import { useState } from 'react';

/**
 * Password reset for the PortalContact identity plane ("Customer
 * Experience & Commercial Readiness Wave"). Mirrors
 * components/portal/ForgotPasswordForm.js exactly.
 */
export default function PortalContactForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal-contact/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(
          retryAfter ? `${data.error || 'Too many attempts.'} Try again in ${retryAfter} seconds.` : data.error || 'Unable to submit this request.'
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit this request.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p className="form-note-banner" role="status">
        If an account exists for that email, password reset instructions will be sent to it. Email
        delivery isn&apos;t configured in this environment yet — contact the organisation that
        gave you portal access if you don&apos;t receive one.
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
        type="email"
        placeholder="Email"
        autoComplete="username"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={submitting}
      />

      <button className="btn btn-primary" type="submit" disabled={submitting || !email.trim()}>
        {submitting ? 'Submitting...' : 'Send reset instructions'}
      </button>
    </form>
  );
}
