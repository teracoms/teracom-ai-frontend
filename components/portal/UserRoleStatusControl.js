'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { ROLE_ORDER, isAtLeastRole } from '@/lib/roles';

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
  read_only: 'Read Only',
};

/**
 * User Management (backend PATCH /users/{id}/role, /users/{id}/status) —
 * the Human Authority Model's own mutation UI, previously nonexistent:
 * the backend guards (escalation, self-action) were real but nothing in
 * the app could reach either endpoint. The role <select> only ever offers
 * roles the viewer can actually grant (isAtLeastRole(viewerRole, role)),
 * mirroring services/user_management_service.py#assert_can_grant_role —
 * a UI-side courtesy, not a replacement for the backend's own fail-closed
 * guard, which still applies regardless. `isSelf` disables both controls
 * outright rather than letting the viewer hit the backend's self-action
 * 403 — the guard covers both role and status changes on one's own row.
 */
export default function UserRoleStatusControl({ userId, role, status, viewerRole, isSelf }) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function patch(field, body, fallbackError) {
    setError(null);
    setUpdating(true);

    try {
      const response = await fetch(`/api/portal/admin/users/${userId}/${field}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || fallbackError);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackError);
    } finally {
      setUpdating(false);
    }
  }

  function handleRoleChange(event) {
    patch('role', { role: event.target.value }, "Unable to update this user's role.");
  }

  function handleStatusToggle() {
    const nextStatus = status === 'active' ? 'inactive' : 'active';
    patch('status', { status: nextStatus }, "Unable to update this user's status.");
  }

  if (isSelf) {
    return (
      <div>
        <span className="badge">{ROLE_LABELS[role] ?? role}</span>{' '}
        <span className="activity-meta">(you)</span>
      </div>
    );
  }

  const grantableRoles = ROLE_ORDER.filter((candidate) => isAtLeastRole(viewerRole, candidate));
  const roleOptions = grantableRoles.includes(role) ? grantableRoles : [...grantableRoles, role];

  return (
    <div>
      <select value={role} onChange={handleRoleChange} disabled={updating} aria-label="Role">
        {roleOptions.map((option) => (
          <option key={option} value={option}>
            {ROLE_LABELS[option] ?? option}
          </option>
        ))}
      </select>{' '}
      <button
        type="button"
        className="btn btn-secondary btn-small"
        onClick={handleStatusToggle}
        disabled={updating}
      >
        {status === 'active' ? 'Deactivate' : 'Activate'}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
