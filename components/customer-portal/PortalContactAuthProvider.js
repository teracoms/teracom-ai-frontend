'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

const PortalContactAuthContext = createContext(null);

/**
 * The Customer Portal's own auth context (Phase 0 Package O) — mirrors
 * components/portal/AuthProvider.js exactly, but for the portal-contact
 * session plane. Never shares state or a code path with the staff/
 * org-member AuthProvider.
 */
export function PortalContactAuthProvider({ initialPortalContact = null, children }) {
  const [portalContact, setPortalContact] = useState(initialPortalContact);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/customer-portal-auth/login', {
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

      setPortalContact(data.portalContact);
      return data.portalContact;
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
      await fetch('/api/customer-portal-auth/logout', { method: 'POST' });
    } finally {
      setPortalContact(null);
      setLoading(false);
      router.push('/customer-portal/login');
      router.refresh();
    }
  }, [router]);

  return (
    <PortalContactAuthContext.Provider value={{ portalContact, loading, error, login, logout, setError }}>
      {children}
    </PortalContactAuthContext.Provider>
  );
}

export function usePortalContactAuth() {
  const context = useContext(PortalContactAuthContext);

  if (!context) {
    throw new Error('usePortalContactAuth must be used within a PortalContactAuthProvider');
  }

  return context;
}
