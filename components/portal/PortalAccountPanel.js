'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';

/**
 * Phase 0 Package O, objective #12 — staff-side visibility into this
 * contact's Customer Portal account. Admin-only creation, mirroring
 * POST /users/'s own "admin sets the password directly" convention —
 * no email-sending capability exists anywhere in this backend for a
 * real invite flow.
 */
export default function PortalAccountPanel({ contactId, portalAccount }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/portal/crm/contacts/${contactId}/portal-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create this portal account.');
      }

      setEmail('');
      setPassword('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create this portal account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Customer Portal</span>
        <h2>Portal access.</h2>
      </div>

      {portalAccount ? (
        <p className="activity-meta">
          {portalAccount.email} · {portalAccount.active ? 'active' : 'inactive'} · last signed in{' '}
          {portalAccount.last_login_at ? new Date(portalAccount.last_login_at).toLocaleString() : 'never'}
        </p>
      ) : user?.role === 'admin' ? (
        <>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Customer email"
              disabled={submitting}
              aria-label="Portal account email"
            />
            <input
              type="text"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Initial password (share with the customer directly)"
              disabled={submitting}
              aria-label="Portal account password"
            />
            <button
              className="btn btn-primary btn-small"
              type="submit"
              disabled={submitting || !email.trim() || !password.trim()}
            >
              {submitting ? 'Creating...' : 'Create Portal Login'}
            </button>
          </form>
        </>
      ) : (
        <p className="activity-meta">No portal account yet. An admin can create one.</p>
      )}
    </div>
  );
}
