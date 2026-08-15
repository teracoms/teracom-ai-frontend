'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * POST /api/portal/memory → POST /memory/store. Not role-gated backend-side
 * (only worker-ownership is checked), so this form is open to every
 * authenticated org member — same treatment Package 4 gave document upload,
 * not admin-gated like worker creation.
 */
export default function AddMemoryForm({ workerId }) {
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
      const response = await fetch('/api/portal/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: workerId, memory }),
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
        placeholder="e.g. Our preferred vendor is Acme Corp"
        disabled={loading}
        aria-label="Memory content"
        rows={3}
      />

      <button className="btn btn-primary" type="submit" disabled={loading || !content.trim()}>
        {loading ? 'Saving...' : 'Add Memory'}
      </button>
    </form>
  );
}
