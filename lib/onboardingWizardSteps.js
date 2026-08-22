// CUSTOMER_ONBOARDING_WIZARD_V1.md -- the full 9-step design, used here only
// to render the wizard's own stepper shell so the framework has its real
// shape for walkthrough testing. Only step 1 is `available: true` -- Wizard
// Framework V1's actual implemented scope (organisation details, logo,
// industry, business size). Steps 2-9 are shown, not hidden, so the
// framework's intended shape is visible and testable, but are deliberately
// non-interactive ("coming soon") -- their own content (departments,
// executive structure, marketplace worker packs, etc.) remains
// design-only, per instruction.
//
// Plain data, deliberately not inside a 'use client' component -- see
// lib/portalNavGroups.js's own docstring for why (Next.js turns every
// export of a 'use client' file into a client-boundary reference, breaking
// any Server Component that tries to read it).
export const ONBOARDING_WIZARD_STEPS = [
  { step: 1, label: 'Organisation Setup', available: true },
  { step: 2, label: 'Organisation Structure', available: false },
  { step: 3, label: 'Executive Structure', available: false },
  { step: 4, label: 'Digital Workforce', available: false },
  { step: 5, label: 'Knowledge Setup', available: false },
  { step: 6, label: 'Governance Setup', available: false },
  { step: 7, label: 'Integrations', available: false },
  { step: 8, label: 'Organisation Review', available: false },
  { step: 9, label: 'Launch Organisation', available: false },
];

export const LAST_AVAILABLE_STEP = ONBOARDING_WIZARD_STEPS.filter((s) => s.available).length;
