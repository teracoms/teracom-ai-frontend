'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';

const initialForm = {
  name: '',
  role: '',
  purpose: '',
  instructions: '',
  status: 'active',
};

export default function CreateWorkerForm() {
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
      const response = await fetch('/api/portal/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, organisation_id: user?.organisation_id }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create worker.');
      }

      router.push(`/portal/workers/${data.worker.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create worker.');
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
        name="name"
        placeholder="Worker name"
        required
        value={form.name}
        onChange={updateField('name')}
        disabled={loading}
      />

      <input
        name="role"
        placeholder="Role (e.g. Estimation Assistant)"
        required
        value={form.role}
        onChange={updateField('role')}
        disabled={loading}
      />

      <textarea
        name="purpose"
        placeholder="Purpose — what this worker is for"
        required
        value={form.purpose}
        onChange={updateField('purpose')}
        disabled={loading}
      />

      <textarea
        name="instructions"
        placeholder="Instructions — how this worker should behave"
        required
        value={form.instructions}
        onChange={updateField('instructions')}
        disabled={loading}
      />

      <select
        name="status"
        value={form.status}
        onChange={updateField('status')}
        disabled={loading}
        aria-label="Status"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Worker'}
      </button>
    </form>
  );
}
