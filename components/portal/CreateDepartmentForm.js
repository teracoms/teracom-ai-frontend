'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// POST /api/portal/departments → POST /departments/. Admin-only
// backend-side; this page (app/portal/(protected)/admin/departments) is
// already under the admin-only route tree, so this form's own visibility
// needs no additional client-side role check.
export default function CreateDepartmentForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/portal/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, description: description.trim() || undefined }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create this department.');
      }

      setName('');
      setDescription('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create this department.');
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

      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Department name, e.g. Engineering"
        disabled={loading}
        aria-label="Department name"
      />

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description (optional)"
        disabled={loading}
        aria-label="Department description"
        rows={2}
      />

      <button className="btn btn-primary" type="submit" disabled={loading || !name.trim()}>
        {loading ? 'Creating...' : 'Create Department'}
      </button>
    </form>
  );
}
