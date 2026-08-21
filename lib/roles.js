// Mirrors backend/auth/roles.py#ROLE_ORDER exactly — the Human
// Authority Model's five tiers, lowest privilege first. Pure,
// dependency-free (no next/headers, no `@/` alias) so it's safe to
// import from a 'use client' component.
export const ROLE_ORDER = ['read_only', 'employee', 'manager', 'admin', 'owner'];

export function isAtLeastRole(role, minimumRole) {
  const roleIndex = ROLE_ORDER.indexOf(role);
  const minimumIndex = ROLE_ORDER.indexOf(minimumRole);

  if (roleIndex === -1 || minimumIndex === -1) return false;

  return roleIndex >= minimumIndex;
}
