'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * POST /api/portal/organisation-memory → POST /organisation-memory/store.
 * Admin-only AND requires the Memory Enrichment capability (Enterprise+)
 * backend-side — this form only renders on a page already gated to admins
 * (see app/portal/(protected)/memory/organisation/page.js), but a 403 here
 * still surfaces cleanly (e.g. an admin on a Starter-tier organisation).
 */
export default function AddOrganisationMemoryForm() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    const memory = content.trim();
    if (!memory) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/portal/organisation-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory }),
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
        placeholder="e.g. Our head office is in Sydney"
        disabled={loading}
        aria-label="Organisation memory content"
        rows={3}
      />

      <button className="btn btn-primary" type="submit" disabled={loading || !content.trim()}>
        {loading ? 'Saving...' : 'Add Organisation Memory'}
      </button>
    </form>
  );
}
