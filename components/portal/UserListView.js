'use client';

import { useMemo, useState } from 'react';

import EmptyState from '@/components/portal/EmptyState';
import UserRoleStatusControl from '@/components/portal/UserRoleStatusControl';

/**
 * Client-side search/filter over the full user list — same rationale as
 * WorkerListView.js: GET /users/ accepts no query parameters at all, so this
 * filters the already-fetched array in the browser. Rendered as rows, not
 * cards — there is no per-user detail page to link to.
 *
 * `currentUserId`/`viewerRole` come from the signed-in admin's own token
 * (see app/portal/(protected)/admin/users/page.js) and are threaded through
 * to UserRoleStatusControl per row — User Management (PATCH /users/{id}/role,
 * /users/{id}/status) now has a real UI here; it previously had none even
 * though the backend endpoints and their escalation/self-action guards
 * already existed.
 */
export default function UserListView({ users, currentUserId, viewerRole }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');

  const roles = useMemo(
    () => Array.from(new Set(users.map((user) => user.role))).sort(),
    [users]
  );

  const filtered = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const matchesQuery =
        !normalisedQuery ||
        fullName.includes(normalisedQuery) ||
        user.email.toLowerCase().includes(normalisedQuery);
      const matchesRole = role === 'all' || user.role === role;
      return matchesQuery && matchesRole;
    });
  }, [users, query, role]);

  return (
    <div>
      <div className="workers-toolbar">
        <input
          type="search"
          placeholder="Search by name or email"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search users"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          aria-label="Filter by role"
        >
          <option value="all">All roles</option>
          {roles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {users.length === 0 ? (
        <EmptyState
          title="No users yet"
          description="Create your first organisation user below."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No users match your search"
          description="Try a different name, email or role filter."
        />
      ) : (
        <ul className="activity-list">
          {filtered.map((user) => (
            <li key={user.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="activity-meta">
                    {user.email} · {user.status === 'inactive' ? 'Inactive' : 'Active'}
                  </p>
                </div>
                <UserRoleStatusControl
                  userId={user.id}
                  role={user.role}
                  status={user.status}
                  viewerRole={viewerRole}
                  isSelf={user.id === currentUserId}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
