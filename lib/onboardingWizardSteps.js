// CUSTOMER_ONBOARDING_WIZARD_V1.md -- the full 9-step design, used here
// to render the wizard's own stepper shell. Every step is now
// `available: true` -- Wizard Framework V1 through V5 (see each
// WIZARD_FRAMEWORK_V{1-5}_IMPLEMENTATION.md in teracom-ai-docs) shipped
// Steps 1-9 as one onboarding sprint. Step 7 (Integrations) implements
// only Federation/External AI Providers for real (already-supported
// backend capability) -- Microsoft 365, SharePoint, OneDrive, Outlook,
// and Teams are shown honestly as not yet available, per instruction;
// see INTEGRATIONS_ARCHITECTURE_V1.md in teracom-ai-docs.
//
// Plain data, deliberately not inside a 'use client' component -- see
// lib/portalNavGroups.js's own docstring for why (Next.js turns every
// export of a 'use client' file into a client-boundary reference, breaking
// any Server Component that tries to read it).
export const ONBOARDING_WIZARD_STEPS = [
  { step: 1, label: 'Organisation Setup', available: true },
  { step: 2, label: 'Organisation Structure', available: true },
  { step: 3, label: 'Executive Structure', available: true },
  { step: 4, label: 'Digital Workforce', available: true },
  { step: 5, label: 'Knowledge Setup', available: true },
  { step: 6, label: 'Governance Setup', available: true },
  { step: 7, label: 'Integrations', available: true },
  { step: 8, label: 'Organisation Review', available: true },
  { step: 9, label: 'Launch Organisation', available: true },
];

export const LAST_AVAILABLE_STEP = ONBOARDING_WIZARD_STEPS.filter((s) => s.available).length;
