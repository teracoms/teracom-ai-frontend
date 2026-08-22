'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';

export default function LoginForm({ nextPath = '/portal' }) {
  const { login, verifyMfaLogin, loading, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challengeToken, setChallengeToken] = useState(null);
  const [code, setCode] = useState('');
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    try {
      const result = await login(email, password);
      // "Settings & Security V1" -- an MFA-enabled account gets a
      // challenge instead of a session; switch to the code-entry step
      // rather than navigating away.
      if (result?.mfaRequired) {
        setChallengeToken(result.challengeToken);
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      // Error message is already captured in AuthProvider's context state.
    }
  }

  async function handleVerifySubmit(event) {
    event.preventDefault();
    setError(null);

    try {
      await verifyMfaLogin(challengeToken, code);
      router.push(nextPath);
      router.refresh();
    } catch {
      // Error message is already captured in AuthProvider's context state.
    }
  }

  if (challengeToken) {
    return (
      <form className="contact-form auth-form" onSubmit={handleVerifySubmit} noValidate>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <p className="form-note">Enter the 6-digit code from your authenticator app, or a backup code.</p>
        <input
          name="code"
          type="text"
          placeholder="Code"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
          disabled={loading}
        />
        <button className="btn btn-primary" type="submit" disabled={loading || !code.trim()}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
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
        name="email"
        type="email"
        placeholder="Email"
        autoComplete="username"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={loading}
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={loading}
      />

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
