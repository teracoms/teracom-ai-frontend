'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * POST /api/portal/department-memory → POST /department-memory/store.
 * Write is admin-only backend-side (read, unlike write, is any member of
 * the owning organisation — see DepartmentMemoryView.js, rendered for
 * every visitor to this page) — this form only renders for an admin
 * client-side as a UI convenience (useAuth().user.role, same pattern
 * PortalNav.js already uses), same "presentation-layer gate, backend is
 * the real enforcement" posture as every role-aware control in this app.
 */
export default function AddDepartmentMemoryForm({ departmentId }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  if (!isAtLeastRole(user?.role, 'admin')) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const memory = content.trim();
    if (!memory) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/portal/department-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_id: departmentId, memory }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save this memory.');
      }

      setContent('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this memory.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="e.g. We prefer Cisco switches"
        disabled={loading}
        aria-label="Department memory content"
        rows={3}
      />

      <button className="btn btn-primary" type="submit" disabled={loading || !content.trim()}>
        {loading ? 'Saving...' : 'Add Department Memory'}
      </button>
    </form>
  );
}
