'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

/**
 * Seeds client-side auth state from the server-resolved session (see
 * app/portal/(public)/layout.js and app/portal/(protected)/layout.js) and
 * exposes login()/logout() to client components via useAuth().
 *
 * This context is a UI convenience only, not a security boundary: every
 * gated action still relies on the backend's own auth checks
 * (get_current_user / require_role) — see FRONTEND_ARCHITECTURE_V1.md §C.5.
 */
export function AuthProvider({ initialUser = null, children }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const retryAfter = response.headers.get('Retry-After');
        const message = retryAfter
          ? `${data.error || 'Too many attempts.'} Try again in ${retryAfter} seconds.`
          : data.error || 'Unable to sign in.';
        throw new Error(message);
      }

      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setLoading(false);
      router.push('/portal/login');
      router.refresh();
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
