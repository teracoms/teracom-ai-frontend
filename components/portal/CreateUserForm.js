'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { ROLE_ORDER, isAtLeastRole } from '@/lib/roles';

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
  read_only: 'Read Only',
};

const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'employee',
};

/**
 * POST /users/ is admin-gated backend-side — this form only renders inside
 * the admin-only /portal/admin/users page (see the admin route group's
 * layout.js), so no extra client-side gate is added here. The backend's
 * `password_hash` field name is a naming quirk only (auth/security.py hashes
 * it server-side) — this form labels the field "Password", nothing more.
 * `role` is schemas/user.py#UserRole, the real 5-tier hierarchy
 * (auth/roles.py#ROLE_ORDER) — the backend's own
 * assert_can_grant_role() already rejects any role above the caller's
 * own tier, so the option list here is just the full set for
 * convenience, not a duplicated permission check.
 */
export default function CreateUserForm() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const router = useRouter();

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setCreated(null);
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

      setCreated({ email: form.email, password: form.password });
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

      {created && (
        <p className="form-note-banner" role="status">
          <strong>{created.email}</strong> was created. There&apos;s no email invite yet — copy
          this password now and share it with them directly; it won&apos;t be shown again:{' '}
          <code>{created.password}</code>
        </p>
      )}

      <p className="form-note">
        There&apos;s no email invite system yet — whatever password you set here is the one
        you&apos;ll need to share with this person yourself.
      </p>

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
        {ROLE_ORDER.filter((role) => isAtLeastRole(user?.role, role)).map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
