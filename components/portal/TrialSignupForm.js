'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Trial experience foundation ("Platform Review Wave 1") — self-service
 * signup for a limited-duration trial organisation. No billing, no
 * entitlement is issued here; the trial is a data-model/UX foundation
 * only (see api/signup.py's trial_signup() docstring for the explicit
 * scope boundary).
 */
export default function TrialSignupForm() {
  const [organisationName, setOrganisationName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const canSubmit =
    organisationName.trim() && firstName.trim() && lastName.trim() && email.trim() && password.length >= 8;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisationName: organisationName.trim(),
          adminFirstName: firstName.trim(),
          adminLastName: lastName.trim(),
          adminEmail: email.trim(),
          adminPassword: password,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(
          retryAfter ? `${data.error || 'Too many attempts.'} Try again in ${retryAfter} seconds.` : data.error || 'Unable to start your trial.'
        );
      }

      router.push('/portal/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start your trial.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="contact-form auth-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <input
        type="text"
        placeholder="Organisation name"
        required
        value={organisationName}
        onChange={(event) => setOrganisationName(event.target.value)}
        disabled={submitting}
      />
      <input
        type="text"
        placeholder="First name"
        required
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        disabled={submitting}
      />
      <input
        type="text"
        placeholder="Last name"
        required
        value={lastName}
        onChange={(event) => setLastName(event.target.value)}
        disabled={submitting}
      />
      <input
        type="email"
        placeholder="Work email"
        autoComplete="username"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={submitting}
      />
      <input
        type="password"
        placeholder="Password (min. 8 characters)"
        autoComplete="new-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={submitting}
      />

      <button className="btn btn-primary" type="submit" disabled={submitting || !canSubmit}>
        {submitting ? 'Starting your trial...' : 'Start free trial'}
      </button>
    </form>
  );
}
