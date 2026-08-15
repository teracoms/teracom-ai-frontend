'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';

const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'member',
};

/**
 * POST /users/ is admin-gated backend-side — this form only renders inside
 * the admin-only /portal/admin/users page (see the admin route group's
 * layout.js), so no extra client-side gate is added here. The backend's
 * `password_hash` field name is a naming quirk only (auth/security.py hashes
 * it server-side) — this form labels the field "Password", nothing more.
 * `role` has no server-side enum (a plain string, exact-match checked by
 * require_role) — the select below offers the two values every other role
 * check in this app actually keys off, not a backend-enforced list.
 */
export default function CreateUserForm() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/portal/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, organisation_id: user?.organisation_id }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create user.');
      }

      setForm(initialForm);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create user.');
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
        name="first_name"
        placeholder="First name"
        required
        value={form.first_name}
        onChange={updateField('first_name')}
        disabled={loading}
      />

      <input
        name="last_name"
        placeholder="Last name"
        required
        value={form.last_name}
        onChange={updateField('last_name')}
        disabled={loading}
      />

      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        value={form.email}
        onChange={updateField('email')}
        disabled={loading}
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        value={form.password}
        onChange={updateField('password')}
        disabled={loading}
      />

      <select
        name="role"
        value={form.role}
        onChange={updateField('role')}
        disabled={loading}
        aria-label="Role"
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
