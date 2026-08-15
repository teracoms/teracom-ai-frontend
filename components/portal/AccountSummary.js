'use client';

import { useAuth } from '@/components/portal/AuthProvider';

export default function AccountSummary() {
  const { user, logout, loading } = useAuth();

  return (
    <div className="account-summary">
      <div>
        <span className="eyebrow">Signed in</span>
        <p className="account-email">{user?.email}</p>
      </div>
      <button type="button" className="btn btn-secondary" onClick={logout} disabled={loading}>
        {loading ? 'Signing out...' : 'Sign out'}
      </button>
    </div>
  );
}
