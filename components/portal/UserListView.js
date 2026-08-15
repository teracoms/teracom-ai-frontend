'use client';

import { useMemo, useState } from 'react';

import EmptyState from '@/components/portal/EmptyState';

/**
 * Client-side search/filter over the full user list — same rationale as
 * WorkerListView.js: GET /users/ accepts no query parameters at all, so this
 * filters the already-fetched array in the browser. Rendered as rows, not
 * cards — there is no per-user detail page to link to (no update/delete
 * endpoint exists backend-side, so a detail page would just repeat what's
 * already shown here — see ADMIN_IMPLEMENTATION_REPORT.md §2).
 */
export default function UserListView({ users }) {
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
                  <p className="activity-meta">{user.email}</p>
                </div>
                <span className="badge">{user.role}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
