'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * For an enterprise customer managing more than one named entity under
 * one umbrella — POST /organisations/ (admin-gated) always existed and
 * always created a real Organisation row, but until backend
 * c3d4e5f6a7b8/api/organisations.py's parent_organisation_id fix, that
 * row was never linked back to anything and no page ever exposed the
 * action.
 */
export default function CreateSubOrganisationForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal/organisations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create this sub-organisation.');
      }

      setName('');
      setSlug('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create this sub-organisation.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Sub-organisation name"
          disabled={submitting}
          aria-label="Sub-organisation name"
        />
        <input
          type="text"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="Unique slug (e.g. acme-west)"
          disabled={submitting}
          aria-label="Sub-organisation slug"
        />
        <button className="btn btn-primary btn-small" type="submit" disabled={submitting || !name.trim() || !slug.trim()}>
          {submitting ? 'Creating...' : 'Create Sub-organisation'}
        </button>
      </form>
    </div>
  );
}
