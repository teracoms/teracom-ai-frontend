// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 2 -- Wizard Framework V2.
// Deliberately frontend-only static data, matching this project's own
// established recommendation (CUSTOMER_ONBOARDING_WIZARD_V1.md §1.2):
// "no department-template table or endpoint exists, and building one
// is unnecessary -- a hardcoded, curated starter list... pre-fills the
// existing create-department form." `function` maps onto
// Department.function (Phase 0 Package J's free-string identity tag)
// -- "sales" and "customer_success" already match this codebase's own
// pre-existing recommended values; the other six extend that same
// convention to the remaining templates this wizard step asks for.
//
// Plain data, deliberately not inside a 'use client' component -- see
// lib/portalNavGroups.js's own docstring for why (Next.js turns every
// export of a 'use client' file into a client-boundary reference,
// breaking any Server Component that tries to read it).
export const DEPARTMENT_TEMPLATES = [
  {
    key: 'executive',
    name: 'Executive',
    function: 'executive',
    description: 'Coordinates across every other department.',
    purpose:
      'Gives your organisation a real place to designate leadership and a natural home for Orchestration to route cross-department requests through.',
  },
  {
    key: 'finance',
    name: 'Finance',
    function: 'finance',
    description: 'Budgets, spend, and financial reporting.',
    purpose: 'Keep the organisation informed on cost, budget, and financial health.',
  },
  {
    key: 'operations',
    name: 'Operations',
    function: 'operations',
    description: 'Day-to-day delivery and internal process.',
    purpose: 'Keep the rest of the organisation running smoothly.',
  },
  {
    key: 'sales',
    name: 'Sales',
    function: 'sales',
    description: 'Pipeline, deals, and customer acquisition.',
    purpose: 'Grow revenue by winning new customers.',
  },
  {
    key: 'marketing',
    name: 'Marketing',
    function: 'marketing',
    description: 'Campaigns, content, and brand.',
    purpose: 'Build awareness and demand for what the organisation offers.',
  },
  {
    key: 'customer_success',
    name: 'Customer Success',
    function: 'customer_success',
    description: 'Onboarding, support, and retention for existing customers.',
    purpose: 'Keep existing customers successful and renewing.',
  },
  {
    key: 'engineering',
    name: 'Engineering',
    function: 'engineering',
    description: 'Builds and maintains the product.',
    purpose: 'Turn requirements into working, reliable software.',
  },
  {
    key: 'hr',
    name: 'HR',
    function: 'hr',
    description: 'People, hiring, and organisational policy.',
    purpose: 'Support the people who work at the organisation.',
  },
];
