// Reference / demonstration licence data — deliberately NOT under lib/api/,
// and NOT a wrapper around any teracom-ai-backend endpoint.
//
// Stale as of Package M (2026-08-17) onward, corrected in
// teracom-ai-docs/Reports/PROJECT_STATE.md §3: real `Licence`/`Entitlement`
// issuance (submit -> Teracom-staff-decide -> signed licence, backend
// Packages A-D) has existed since before this session, and
// GET /finance/summary's own `licensing` field (services/finance_summary_
// service.py#get_licensing_summary(), enhanced with real worker/user
// utilisation and expiry visibility by DIGITAL_ORGANISATION_OPERATIONS_V1)
// is the real source of truth wherever an organisation has an active
// licence. This module remains the honest *fallback* for an organisation
// with no active licence yet (e.g. a trial, or `pending_licence`) — see
// app/portal/(protected)/admin/billing/usage/page.js for the real-data-
// first, illustrative-fallback pattern every consumer of this module
// should follow.
//
// Everything below is illustrative example data shaped to match what
// LICENSING_MODEL_V1.md's *decided* sections describe (§2 tiers, §3 hosting
// models, §7 worker packs, §12–14 renewal/grace/locked lifecycle) — it does
// not represent a real, persisted, or backend-verified entitlement for any
// organisation. Every page that renders this data says so explicitly.

export const TIERS = ['Starter', 'Enterprise', 'Platinum'];

export const HOSTING_MODELS = ['Teracom Hosted', 'Dedicated Hosted', 'Customer Hosted (Sovereign)'];

// LICENSING_MODEL_V1.md §2 — worker/org allocation by tier. User allocation
// is a per-customer contractual figure for Enterprise/Platinum ("Licensed
// User Count"), not a fixed number, so it is represented as a label, not a
// count, for those two tiers.
export const TIER_ALLOCATIONS = {
  Starter: { workers: 5, users: 10, organisations: 1 },
  Enterprise: { workers: 30, users: null, organisations: 5 },
  Platinum: { workers: 50, users: null, organisations: 30 },
};

// LICENSING_MODEL_V1.md §7 — the two approved worker pack sizes.
export const WORKER_PACK_SIZES = [5, 10];

// LICENSING_MODEL_V1.md §12/§13 — decided windows.
export const RENEWAL_WINDOW_DAYS = 90;
export const GRACE_PERIOD_DAYS = 30;

/**
 * The one example licence this whole section renders. `status` always
 * starts 'active' — grace/locked are shown only via an explicit
 * `?preview=grace|locked` query param on the Overview page (see
 * app/portal/(protected)/admin/billing/page.js), never derived from real
 * date math against `expiryDate`. This is deliberate: computing a real
 * "is this demo licence expired yet" check would mean this section's
 * behaviour silently changes on its own as real time passes, which is
 * exactly the kind of invented, undiscoverable state change every prior
 * package's "don't fabricate behaviour the backend can't back" discipline
 * has avoided (see e.g. Package 8's refusal to build a fake "Connect"
 * button). Grace/Locked here are deliberate, explicit previews of what the
 * experience would look like, not live enforcement.
 */
export function getReferenceLicence() {
  return {
    tier: 'Enterprise',
    hostingModel: 'Teracom Hosted',
    status: 'active',
    issuedDate: '2025-08-15',
    expiryDate: '2026-08-15',
    userAllocationLabel: 'Licensed User Count — 25 (per signed licence)',
    recentEvents: [
      { date: '2025-08-15', description: 'Licence issued — Enterprise / Teracom Hosted.' },
    ],
  };
}

/**
 * Returns a copy of the reference licence with `status`, and a matching
 * `nextRequiredAction`/`recentEvents` entry, overridden for one of the three
 * lifecycle states LICENSING_MODEL_V1.md §12–14 describes — used only to
 * render the Grace Period and Locked Mode preview experiences (requirements
 * #7/#8). `daysRemaining` is a fixed illustrative number for the preview,
 * not computed from the real clock, for the same reason noted above.
 */
export function withPreviewState(licence, state) {
  if (state === 'grace') {
    return {
      ...licence,
      status: 'grace',
      daysRemainingInGracePeriod: 12,
      nextRequiredAction: 'Renew before the grace period ends to avoid entering Locked Mode.',
    };
  }

  if (state === 'locked') {
    return {
      ...licence,
      status: 'locked',
      nextRequiredAction: 'Upload a valid licence to exit Locked Mode.',
    };
  }

  return { ...licence, status: 'active', nextRequiredAction: null };
}

// Pure date-math helper — no `new Date()` default arguments, so it stays
// testable and deterministic; callers pass the current date explicitly.
export function daysBetween(fromISO, toISO) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const from = new Date(`${fromISO}T00:00:00Z`).getTime();
  const to = new Date(`${toISO}T00:00:00Z`).getTime();
  return Math.round((to - from) / msPerDay);
}

/**
 * Static example rows for the Requests & Approval History page. Not derived
 * from any wizard submission in this app — see WizardShell.js for why this
 * frontend deliberately does not fabricate cross-page persistence for a
 * submission with nowhere real to go yet.
 */
export function getExampleRequestHistory() {
  return [
    {
      id: 'example-1',
      date: '2025-08-15',
      type: 'Initial licence issuance',
      status: 'Approved',
      note: 'Enterprise / Teracom Hosted — initial licence for this organisation.',
    },
  ];
}
