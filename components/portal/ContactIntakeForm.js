'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * Prospect intake (Phase 0 Package J, objective #4). POST
 * /api/portal/crm/contacts → POST /crm/contacts/, backend-gated at
 * employee tier and above (Read Only Tier Enforcement) — the form
 * itself is hidden below that tier.
 */
export default function ContactIntakeForm() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
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
      const response = await fetch('/api/portal/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          company: company.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          source: source.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create this contact.');
      }

      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setSource('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create this contact.');
    } finally {
      setLoading(false);
    }
  }

  if (!isAtLeastRole(user?.role, 'employee')) {
    return <p className="form-note">You have read-only access and can&apos;t add a prospect.</p>;
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
        placeholder="Contact name"
        disabled={loading}
        aria-label="Contact name"
      />
      <input
        type="text"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        placeholder="Company (optional)"
        disabled={loading}
        aria-label="Company"
      />
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email (optional)"
        disabled={loading}
        aria-label="Email"
      />
      <input
        type="text"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="Phone (optional)"
        disabled={loading}
        aria-label="Phone"
      />
      <input
        type="text"
        value={source}
        onChange={(event) => setSource(event.target.value)}
        placeholder="Source (optional) — e.g. referral, web form"
        disabled={loading}
        aria-label="Source"
      />

      <button className="btn btn-primary" type="submit" disabled={loading || !name.trim()}>
        {loading ? 'Adding...' : 'Add Prospect'}
      </button>
    </form>
  );
}
