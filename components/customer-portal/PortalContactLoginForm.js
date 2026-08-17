'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { usePortalContactAuth } from '@/components/customer-portal/PortalContactAuthProvider';

export default function PortalContactLoginForm({ nextPath = '/customer-portal' }) {
  const { login, loading, error, setError } = usePortalContactAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    try {
      await login(email, password);
      router.push(nextPath);
      router.refresh();
    } catch {
      // Error message is already captured in PortalContactAuthProvider's state.
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
