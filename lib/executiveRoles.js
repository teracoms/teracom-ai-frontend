// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 3 -- Wizard Framework V3. The
// fixed 8-role list Step 3 offers, matching
// schemas/executive_role.py#VALID_EXECUTIVE_ROLE_KEYS on the backend
// exactly (`key` here is that endpoint's `role_key`).
//
// Plain data, deliberately not inside a 'use client' component -- see
// lib/portalNavGroups.js's own docstring for why (Next.js turns every
// export of a 'use client' file into a client-boundary reference,
// breaking any Server Component that tries to read it).
export const EXECUTIVE_ROLES = [
  { key: 'ceo', label: 'CEO' },
  { key: 'coo', label: 'COO' },
  { key: 'cfo', label: 'CFO' },
  { key: 'cto', label: 'CTO' },
  { key: 'head_of_sales', label: 'Head of Sales' },
  { key: 'head_of_marketing', label: 'Head of Marketing' },
  { key: 'head_of_operations', label: 'Head of Operations' },
  { key: 'head_of_customer_success', label: 'Head of Customer Success' },
];

export function executiveRoleLabel(roleKey) {
  return EXECUTIVE_ROLES.find((role) => role.key === roleKey)?.label ?? roleKey;
}
