# Wave 2, Workstream 3 — Onboarding & Trust Surface Clarity — Implementation Report

**Date:** 2026-08-19 · **Repo:** `teracom-ai-frontend` only — the first frontend-facing workstream in this implementation sequence (every workstream in Wave 1 and the first two of Wave 2 were backend-only). **Source:** `WAVE2_IMPLEMENTATION_PLAN.md` (`teracom-ai-docs`) §3, derived from `INTERNAL_PILOT_READINESS_ASSESSMENT.md`'s findings on the three confusing onboarding surfaces and the Billing/Licensing UI mixing real and illustrative data. **Scope:** presentation-only — no new data model, no backend change.

---

## 1. Investigation before implementation

Direct inspection of all three onboarding surfaces and every admin/billing page referencing illustrative data, before any edit was made, surfaced two things beyond the original ask:

- **`RenewalWizard.js` and `OwnershipTransferWizard.js` had no illustrative-data disclaimer at all.** The source plan's framing ("a more prominent... banner, not just a disclaimer sentence") assumed a disclaimer already existed on every illustrative-data page; it didn't on these two.
- **The three existing admin/billing disclaimers were factually stale, not just insufficiently prominent.** `admin/billing/licence/page.js` claimed "teracom-ai-backend has no licence data model today"; `admin/billing/requests/page.js` claimed "teracom-ai-backend has no endpoint to submit, route, approve, or record a licensing request today"; `admin/billing/usage/page.js` claimed "teracom-ai-backend has no plan/seat data model." All three are false since Wave 1 Workstream 5's real `Licence`/`Entitlement`/`Plan` work and the licensing-request lifecycle that has existed since Phase 0 — these pages simply haven't been wired to call the real endpoints, a different and more precise claim than "the backend doesn't have this."

---

## 2. What was implemented

### Onboarding surface labels
- `app/portal/(protected)/onboarding/page.js` — eyebrow "Onboarding" → "Your Organisation's Onboarding" (all 3 occurrences: success, error, and session-expired states).
- `components/portal/OnboardingChecklist.js` (the CRM-contact-scoped staff view, embedded in `app/portal/(protected)/sales/[contactId]/page.js`) — eyebrow "Onboarding" → "Customer Onboarding (CRM)".
- `app/customer-portal/(protected)/onboarding/page.js` — kept the existing "Customer Portal" eyebrow (preserving consistency with every other page on that identity plane) and changed the heading from the generic "Onboarding." to the explicitly first-person "Your Onboarding Progress."

### Illustrative-data banners
- New `.illustrative-data-banner` CSS class (`app/globals.css`) — a bold-labelled, red-tinted banner reusing this site's existing red accent family (no amber/warning colour exists in this palette), deliberately kept distinct from the visually-similar `.preview-banner`, which means something different (the Grace Period preview-mode toggle).
- `components/portal/RenewalWizard.js` and `components/portal/OwnershipTransferWizard.js` — both gained a new `IllustrativeDataBanner` sub-component, rendered above the wizard itself, where none existed before.
- `app/portal/(protected)/admin/billing/licence/page.js`, `.../requests/page.js`, `.../usage/page.js` — existing `.form-note-banner` disclaimers upgraded to `.illustrative-data-banner`, and their text corrected to state the real current backend capability accurately (see §1) rather than the previous, now-false "backend has none of this" framing.

---

## 3. Validation

- **`next lint`** — clean, no warnings or errors.
- **`next build`** — clean; every touched route (all three onboarding surfaces, all three admin/billing pages, the sales contact detail page embedding `OnboardingChecklist`) compiled successfully.
- **`npm test`** — 302/302 passing, unchanged. Confirmed by direct investigation that this frontend has no React component-rendering test infrastructure (no `@testing-library/react`, no `jsdom` configured) — none of these changes had existing test coverage to protect, and introducing that infrastructure was judged out of scope for a presentation-only workstream.
- **Backend:** untouched — no backend files were modified in this workstream; the existing 286/286 backend test result from Workstream 2 stands unchanged.

---

## 4. What was deliberately not done

- **No new React testing infrastructure was added.** A deliberate scope boundary — see §3.
- **No change to which pages actually call real vs. illustrative data.** This workstream corrects what the pages *say* about their own data source; it does not wire `RenewalWizard.js`/`OwnershipTransferWizard.js`/the three admin/billing pages to real API calls. That remains separate, future frontend work.
- **The customer-portal onboarding page's "Customer Portal" eyebrow was deliberately left unchanged** — altering it would have been a broader cross-page consistency change beyond this workstream's scope; the heading text change alone was judged sufficient to resolve the specific confusion identified.

---

## 5. Commit status

Frontend changes complete and validated (lint + build), ready to commit locally. No backend changes in this workstream. **Not pushed** — per instruction ("Commit locally... Do not push").
