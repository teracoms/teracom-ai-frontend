# Billing & Licensing Implementation Report — Frontend Package 9

**Scope:** Package 9 — Billing & Licensing only, per `docs/governance/BILLING_AND_LICENSING_UX.md`, `docs/governance/UX_VISION.md`, and `docs/commercial/LICENSING_MODEL_V1.md`.
**Status:** Complete as a **frontend UX scaffold** against a clearly-labelled reference/demonstration data model — not a real, backend-verified licensing system, because no such backend exists (see §2). Build, lint, and unit tests pass; end-to-end smoke-tested against a live backend as both an admin and a non-admin user, including a genuine information-exposure bug found and fixed during that testing (§9).
**Depends on:** Package 1 (Authentication), Package 2 (Dashboard), Package 3 (Workers), Package 7 (Administration) — the session cookie, `AuthProvider`, the existing `/portal/admin` role-gated layout, `StatTile`, `EmptyState`, `lib/api/results.js`, `lib/api/workers.js#fetchWorkerList`, `lib/api/admin.js#fetchUsers`, and `lib/api/dashboard.js#fetchOrganisationSummary` are all reused as-is, unchanged.
**Out of scope:** everything already excluded from every prior package, plus nothing new — this package does not touch Chat/Memory/Knowledge/Connectors.

---

## 1. Why this package is different from Packages 1–8

Every prior package (3 through 8) was built against **real, verified backend endpoints** — read the source first, then wire the frontend to exactly what exists, and refuse to build any affordance the backend can't back (no fake "Connect" button in Package 8, no fake worker-delete in Package 3, etc.). That discipline assumed *some* backend surface existed to verify.

**Billing & Licensing has none at all.** This is confirmed in §2, and it is a categorically different starting point from Package 8 (Connectors), which at least had four real, reachable, hardcoded-stub endpoints. Here there is nothing to call. Applying the same "only wire what's real" rule literally would mean building nothing — no Overview, no wizards, no capacity view — which would fail this task's explicit ask to complete all ten numbered items and to "identify backend requirements and frontend requirements separately."

The approach taken, consistent with the spirit (not the letter) of every prior package's discipline:

- **Where real backend data exists and is relevant** (current worker count, current user count, current organisation identity), **it is used** — nothing here is fabricated when a real answer is available.
- **Where no backend data exists at all** (tier, hosting model, licence status, expiry, allocation ceilings, request/approval history), the UI is built against a **reference/demonstration data module** (`lib/licensing/referenceLicence.js`), explicitly and repeatedly labelled in the UI itself as illustrative, not real. No wizard pretends to submit anywhere real (see `WizardShell.js`). No "Locked Mode" preview actually locks anything (see §7).
- **Nothing here invents enforcement the backend can't back** — the same principle that stopped Package 8 from building a fake "Connect" button stops this package from making Locked Mode actually restrict `/portal/**` access, or from making worker creation actually block at a limit (LICENSING_MODEL_V1.md §4 explicitly says this policy "is not yet implemented anywhere in the product... do not describe this as 'enforced'").

---

## 2. Backend capability review — performed before writing any code

Per this task's explicit instruction, the actual backend was reviewed directly:

```
grep -rli "licen|billing|plan|subscription|stripe|seat" teracom-ai-backend --include="*.py"
→ zero matches, anywhere, outside this frontend's own docs.
```

Confirmed by also reading every field on `models/organisation.py` (`id, name, slug` — nothing else) and `models/user.py` (`id, organisation_id, first_name, last_name, email, password_hash, role` — nothing else), and every one of the 39 routers registered in `main.py` (listed in full; none relate to billing, licensing, plans, tiers, or hosting).

**Conclusion, stated plainly: teracom-ai-backend has zero billing/licensing support today — not even a stub.** This is a stronger statement than Package 8's finding about Connectors (which at least had hardcoded, reachable endpoints); here there is nothing to call at all. This matches LICENSING_MODEL_V1.md §4's own admission exactly: "the backend has no plan/seat data model at all today... do not describe this as 'enforced' in customer-facing material until the corresponding backend work ships."

---

## 3. Backend requirements vs. frontend requirements — identified separately, per this task's instruction

### Backend requirements (none of this exists today; needed to make this package real)

1. **An organisation-level licence record.** Either new columns on `organisations` (`tier`, `hosting_model`, `status`, `issued_date`, `expiry_date`, `worker_allocation`, `user_allocation`/licensed-user-count, `organisation_allocation`) or — more consistent with §8's "a licence is a signed artefact, not a database row a customer can edit" — a separate `licences` table keyed on `organisation_id`, populated only by a controlled issuance/renewal process, not general CRUD.
2. **A signed licence file mechanism** — format, signing algorithm, key custody, and embedded-public-key distribution for offline validation are all explicitly **not decided** (LICENSING_MODEL_V1.md §8, §19 items 1–4). This is greenfield work with no approved shape yet.
3. **Endpoints for the three request types**: renewal, worker-pack addition, ownership transfer — e.g. `POST /licensing/renewal-requests`, `POST /licensing/worker-pack-requests`, `POST /licensing/ownership-transfer-requests` — plus `GET /licensing/requests` for history, and `GET /licensing/status` for the current tier/hosting/status/expiry/capacity. None of these exist in any form.
4. **A human-approval workflow** behind every one of the above (§9) — who approves (a role, a queue, a specific worker persona — **not decided**), what SLA applies (**not decided**), and whether the approval step differs for a routine renewal vs. a substantive entitlement change (**not decided**).
5. **Worker-count enforcement at creation time** (§4) — a *decided policy* ("blocked immediately when the limit is reached, no grace period") with **zero implementation**. `POST /workers/` (Package 3) has no limit check of any kind today.
6. **A Locked Mode enforcement mechanism** — middleware or a dependency that checks licence validity on every request and restricts access to licence-management functions only, once grace period elapses (§14). This needs item 1 to exist first, and its own design (which routes count as "licence management," how a request in flight is handled, etc.) is undesigned.
7. **Hardware fingerprinting** (VM UUID + Disk UUID + TPM where available) for Customer Hosted (Sovereign) offline validation — algorithm and tolerance for routine hardware maintenance are **not decided** (§10, §19 item 3).
8. **Grace-period tracking** — a scheduled or on-request check of "has 30 days elapsed since expiry" (§13), needing item 1's `expiry_date` to exist and a real clock-based computation this frontend deliberately does not fabricate (§7).

None of items 1–8 exist in any form. This frontend cannot build toward them further than illustrative UI — there is no partial backend surface to extend, unlike every prior package's starting point.

### Frontend requirements (what this package actually delivers)

The ten numbered items in §4–§8 below, built against the reference data model in §1, plus:

- `lib/licensing/referenceLicence.js` — the reference data module (not under `lib/api/`, since it wraps no backend endpoint).
- `components/portal/WizardShell.js` — a reusable, generic guided-wizard shell (step indicator, back/continue, an honest non-persisting submit outcome) shared by all three wizards.
- `components/portal/BillingNav.js` — section-local sub-navigation (7 sub-pages is enough to warrant one, the same precedent `PortalNav.js` set at the top level).
- `components/portal/CapacityMeter.js` — one resource's real consumption vs. reference-data allocation.
- Three wizard components (`RenewalWizard.js`, `WorkerPackWizard.js`, `OwnershipTransferWizard.js`) built on `WizardShell`.
- 8 pages under `/portal/admin/billing/**`, one shared `layout.js`/`loading.js`/`error.js` for the whole section.
- One card added to the existing `/portal/admin` landing page (requirement #9).

---

## 4. UX Vision rubric applied per screen (docs/governance/UX_VISION.md §6 rule 5)

| Screen(s) | Tier | Why |
|---|---|---|
| Overview, Licence Details, Usage & Capacity, Requests & History | **None of the three** | These are read-only information displays with no task to take — the same category Package 8's connector-status page landed in. Natural language and wizards both guide a user through *doing* something; there is nothing to do here, only to see. |
| Renewal, Worker Pack, Ownership Transfer | **Wizard** | Directly named in UX_VISION.md §5 item 4: "a guided flow is a natural fit here regardless of NL feasibility, since a human-approval step is mandatory either way." Built as genuine multi-step flows per §3's strategy (one thing at a time, sensible defaults — e.g. Annual renewal cadence and the smaller +5 worker pack are pre-selected — progressive disclosure of the review step only after the real choices are made), not single dense forms. |
| Grace Period, Locked Mode | **None of the three (a state preview, not a task)** | Same reasoning as the read-only group — these demonstrate what an *existing* state looks like; there is no action being guided. |

No screen in this package defaulted to a form for convenience. The three wizards are the only task-taking screens, and all three landed on Wizard by direct governance instruction, not by evaluation-of-convenience.

---

## 5. Requirements #1–#3: Overview, Licence Details, Usage & Capacity

- **Overview** (`/portal/admin/billing`) shows tier, hosting model, status, expiry date, next required action, and recent events — every field `docs/governance/BILLING_AND_LICENSING_UX.md`'s Overview Dashboard section lists, sourced from `getReferenceLicence()`.
- **Licence Details** (`/portal/admin/billing/licence`) is a read-only `<dl>` of every entitlement/metadata field the reference model has — no edit affordance, consistent with §8's "a licence is a signed artefact... not a database row a customer can edit," even though the underlying data here is illustrative.
- **Usage & Capacity** (`/portal/admin/billing/usage`) is deliberately hybrid and is the one page in this package that calls real backend endpoints: `fetchWorkerList` (Package 3), `fetchUsers` (Package 7), `fetchOrganisationSummary` (Package 2) supply the real, live *consumption* numbers; `TIER_ALLOCATIONS[licence.tier]` supplies the illustrative *ceiling*. `CapacityMeter` renders both halves and is explicit about which is which. Verified live (§9): with one real worker created, the meter correctly showed "1 / 30," not a fabricated number.

---

## 6. Requirement #10: Capacity Monitoring Views

Served by the same Usage & Capacity page (§5) — `docs/governance/BILLING_AND_LICENSING_UX.md` lists "Usage & Capacity" once, and requirement #10 names the same underlying concept ("Capacity Monitoring Views") rather than a distinct screen. Building a second, separate capacity view with the identical three meters would duplicate content for no benefit; this is recorded here as a deliberate consolidation, the same kind Package 7 applied to "Requests" and "Approval History" being one page rather than two.

---

## 7. Requirements #4–#6: the three wizards

All three follow `WizardShell.js`'s shared shape (step tabs, Back/Continue, a non-persisting final screen) and match `docs/governance/BILLING_AND_LICENSING_UX.md`'s step lists exactly:

- **Renewal** (4 steps: Review Current Licence → Select Renewal Type → Review Summary → Submit Request). Step 2 defaults to Annual (a sensible default per UX_VISION.md §3).
- **Worker Pack** (3 steps: Select Pack Size → Review Capacity Change → Submit Approval Request). "Review Capacity Change" shows the **real** current worker count next to the reference allocation and the requested pack size — verified live with a real worker present.
- **Ownership Transfer** (5 steps: Current Ownership → New Ownership → Transfer Reason → Review → Submit). "Current Ownership" shows the **real** organisation name/slug (`fetchOrganisationSummary`) — verified live.

**None of the three actually submits anywhere.** There is no backend endpoint to submit to (§2). Each wizard's final screen says this in plain language rather than showing a fake "success" state, and cites the specific LICENSING_MODEL_V1.md section requiring human approval for that request type. This is the same honesty standard every prior package applied to its own dead-end (Package 5's chat sessions that can't be resumed, Package 6's memories that can't be deleted) — the wizard is genuinely complete and navigable end-to-end; only the very last step's real-world effect is (accurately) "nothing persists yet."

---

## 8. Requirements #7–#8: Grace Period and Locked Mode experiences

Both are rendered by the Overview page (`/portal/admin/billing`), switched by an explicit `?preview=grace|locked` query parameter — **not** by comparing the reference licence's `expiryDate` against the real clock.

This was a deliberate design choice, not a shortcut: computing a genuine "has this demo licence expired yet" check would mean the section's behaviour silently changes on its own as real time passes in this environment, with no way for a future session to know why the Overview page suddenly looks different. That is exactly the kind of undiscoverable, invented state change every prior package's "don't fabricate behaviour the backend can't back" discipline has avoided. The explicit query-param toggle is a **preview of the experience**, clearly banner-labelled as such, reachable via buttons on the Overview page itself.

**Locked Mode does not lock anything.** It renders a full "locked" takeover screen within the Billing & Licensing section only — it does not touch `middleware.js`, does not gate `/portal/**`, and does not modify `PortalNav`. Building real cross-app lockout driven by fabricated client-side state would be inventing a security/availability behaviour with no real backend signal behind it — precisely the antipattern Package 7 and Package 8 both explicitly avoided (advisory-only role gating; no fake connector "Connect" button). This is stated plainly in the preview banner itself, not just in this report.

---

## 9. A real bug found and fixed during smoke testing: admin-gated data reaching a non-admin's raw response

While smoke-testing the Usage & Capacity, Worker Pack, and Ownership Transfer pages as a non-admin (`member`) user, the **visible, rendered page correctly showed only the parent admin layout's "This area requires admin access" message** — confirmed by stripping `<script>` tags from the response and inspecting the actual `<body>` content. However, the **raw HTTP response bytes** (inside a `<script>` tag carrying React's Server Component "flight" payload, used for client-side hydration) contained a second, **unreferenced** copy of the page's real content — including the real worker count fetched via `fetchWorkerList` (which is not role-gated backend-side, so the call succeeded).

**Root cause:** in Next.js's App Router, a layout receives `children` as an already-rendered element — the child route segment's own `page.js` (and any data fetching inside it) executes regardless of what the parent layout ultimately does with `{children}`. `app/portal/(protected)/admin/layout.js` (Package 7) renders a *different* tree instead of `{children}` when the caller isn't an admin, which correctly keeps the restricted message as the only thing composed into the visible document — but it does not stop the child page's Server Component from having already run. The resulting (unused) render still gets serialized into the flight payload sent to the browser.

**Verified precisely, not just asserted:**
- The composed/hydrated DOM (both server-rendered HTML and what React would hydrate onto it) referenced only the restricted-message subtree (`$b` in the flight graph) — the real-data subtree (`$4`) existed in the payload but was never pointed to by the tree that actually mounts.
- The exposed data was the caller's **own organisation's** worker count (their own org, since `fetchWorkerList` isn't cross-tenant) — not another organisation's data, and not something the same user couldn't already see via the existing `/portal/workers` page. This is a real defense-in-depth gap and unnecessary backend load, not a proven cross-tenant data leak or privilege escalation.
- The two genuinely admin-gated calls on the same page (`fetchUsers`, `fetchOrganisationSummary`) correctly returned real `403 Insufficient permissions` errors from the backend itself — the backend's own enforcement was never in question, only this page's incidental, unnecessary, and now-fixed extra fetch.

**Fix applied:** each of the three pages that call a real backend endpoint (`usage/page.js`, `worker-pack/page.js`, `ownership-transfer/page.js`) now decodes the session JWT and returns `null` immediately if the caller isn't an admin, before making any real fetch. Verified live after the fix: the same non-admin request now shows zero occurrences of the page's real content or data anywhere in the response, while the admin path is unaffected (re-verified all three pages still work correctly for an admin).

**Not fixed, and out of this package's scope:** the same underlying pattern (a layout conditionally rendering instead of `{children}`) is how `app/portal/(protected)/admin/layout.js` itself has worked since Package 7, and by extension affects Package 7's own pages (`/portal/admin/users`, `/portal/admin/organisation`, `/portal/admin/permissions`) the same way — their own real backend calls likely also execute and land in the flight payload for a non-admin, even though (per Package 7's own smoke test) the visible page has always correctly shown only the restricted message. This is flagged as a carried-forward finding for whoever next touches those pages, not fixed here, since modifying Package 7's already-shipped files is outside "only complete Package 9." The general, permanent fix (used sparingly since it changes the established UX) would be calling Next.js's `redirect()` in the layout instead of conditionally rendering — which was deliberately not chosen in Package 7 in favour of an inline, friendly message, mirroring the `/portal/workers/new` precedent.

---

## 10. Portal navigation integration (requirement #9)

- **A "Billing & Licensing" card was added to the existing `/portal/admin` landing page** (Package 7), linking to `/portal/admin/billing` — the same treatment every prior sub-section got on its parent's landing page.
- **No new top-level `PortalNav` entry.** Per the blueprint's own "Administration > Billing & Licensing" breadcrumb, this hangs off the existing "Admin" entry, the same relationship Package 8's Connectors page has to Knowledge. `PortalNav`'s existing nested-path active-matching (`pathname.startsWith('/portal/admin/')`) already highlights "Admin" correctly on every billing sub-page with zero code changes — verified live.
- **A new `BillingNav` sub-navigation** was added for the 7 sub-pages within this section, the same "one nav component per meaningfully-sized section" precedent `PortalNav.js` set at the top level.

---

## 11. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, 45 routes (including the 7 new
                     /portal/admin/billing/** routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 90, pass 90, fail 0
```

### Unit tests (90 total; 8 new for this package)

`lib/licensing/__tests__/referenceLicence.test.js` — pure-function tests for `withPreviewState`, `daysBetween`, and the tier-allocation/pack-size constants against LICENSING_MODEL_V1.md §2/§7's exact figures. No `lib/api/*`-style mocked-fetch tests were added, since this package (deliberately, per §1–2) adds no new backend-calling function — the three real backend reads it makes all reuse functions already tested by Packages 2/3/7.

### End-to-end smoke test (real backend, not mocked)

A temporary organisation, one admin user, one member user, and one worker were created for this test and fully deleted again afterward.

| Check | Result |
|---|---|
| `/portal/admin` → "Billing & Licensing" card | Present, links correctly |
| Admin → Overview (active) | `200`; Enterprise / Teracom Hosted / active / "Nothing needs your attention" all render |
| Admin → Overview (`?preview=grace`) | `200`; preview banner, "expired and is now in a 30-day grace period — 12 days remaining" |
| Admin → Overview (`?preview=locked`) | `200`; preview banner, full Locked Mode takeover screen, "a valid licence is required to continue" |
| Admin → Licence Details | `200`; every reference field renders |
| Admin → Usage & Capacity | `200`; **real** counts — Workers 1/30, Users "1 in use" + Licensed User Count label, Organisations 1/5 — verified via the raw flight payload, not just the rendered text |
| Admin → Renewal wizard | `200`; all 4 step labels render, Annual pre-selected |
| Admin → Worker Pack wizard | `200`; both pack sizes render, +5 pre-selected |
| Admin → Ownership Transfer wizard | `200`; step 1 shows the **real** organisation name/slug |
| Admin → Requests & History | `200`; three wizard entry cards + one example history row |
| No session → any billing route | `307` → `/portal/login?next=...`, preserved correctly for nested paths |
| Member (non-admin) → Overview/Users-adjacent billing routes | `200`; "This area requires admin access" shown, inherited correctly from Package 7's admin layout |
| **Member → raw response bytes for Usage/Worker Pack/Ownership Transfer, before the §9 fix** | Real data (own-org worker count, own-org name) present in an unreferenced flight-payload entry despite the visible page being correct — bug found live |
| **Same, after the §9 fix** | Zero occurrences of the page's real content or fetched data anywhere in the response |
| Admin → same three pages, after the §9 fix | Unaffected, still render correctly with real data |

---

## 12. Files changed

### New files

```
lib/licensing/referenceLicence.js                             reference/demonstration licence data
lib/licensing/__tests__/referenceLicence.test.js               unit tests

components/portal/WizardShell.js                              reusable guided-wizard shell
components/portal/BillingNav.js                                section sub-navigation
components/portal/CapacityMeter.js                              real-usage vs. reference-allocation meter
components/portal/RenewalWizard.js                              4-step renewal wizard content
components/portal/WorkerPackWizard.js                           3-step worker-pack wizard content
components/portal/OwnershipTransferWizard.js                    5-step ownership-transfer wizard content

app/portal/(protected)/admin/billing/layout.js                  BillingNav wrapper (inherits admin role gate)
app/portal/(protected)/admin/billing/loading.js                 shared Suspense fallback for the section
app/portal/(protected)/admin/billing/error.js                    shared error boundary for the section
app/portal/(protected)/admin/billing/page.js                     Overview / Grace Period / Locked Mode
app/portal/(protected)/admin/billing/licence/page.js              Licence Details
app/portal/(protected)/admin/billing/usage/page.js                Usage & Capacity / Capacity Monitoring
app/portal/(protected)/admin/billing/renewal/page.js              Renewal wizard page
app/portal/(protected)/admin/billing/worker-pack/page.js          Worker Pack wizard page
app/portal/(protected)/admin/billing/ownership-transfer/page.js   Ownership Transfer wizard page
app/portal/(protected)/admin/billing/requests/page.js             Requests & Approval History

docs/frontend/IMPLEMENTATION_REPORTS/BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `app/portal/(protected)/admin/page.js` | Added a "Billing & Licensing" card linking to `/portal/admin/billing` | Requirement #9 |
| `app/globals.css` | +30 lines, additive only | New `.billing-nav*`, `.capacity-meter*`, `.wizard-*`, `.preview-banner`, `.locked-mode-screen*`, `.radio-option` classes — all built from the existing token set. No existing rule was changed. |

No file from Packages 1–8 was changed in behaviour beyond the one new card above.

---

## 13. Remaining risks / follow-ups

1. **This entire package is a frontend UX scaffold, not a real licensing system.** Every field on every screen except Usage & Capacity's consumption numbers and Ownership Transfer's "Current Ownership" step is illustrative example data. This is stated repeatedly in the UI itself and is the central, unavoidable consequence of §2's finding — it is not a bug to fix from this repository.
2. **The information-exposure pattern found and fixed in §9 for this package's own pages still affects Package 7's pre-existing admin pages** (`/portal/admin/users`, `/portal/admin/organisation`, `/portal/admin/permissions`). Worth a dedicated follow-up pass applying the same per-page role check, or — better — solving it once at the layout level with `redirect()` instead of conditional rendering, accepting the UX change that implies.
3. **Every item in §3's "Backend requirements" list is a real, unstarted prerequisite** for this package ever becoming a functioning licensing system, not a demo of one. The single most consequential is item 1 (an organisation-level licence record) — nothing else in that list can be built until it exists.
4. **LICENSING_MODEL_V1.md's own "not decided" list (§19) has 13 open items**, several of which (licence file format, signing key custody, hardware-fingerprint algorithm) block real implementations of Licence Details, Grace Period, and Locked Mode long before any frontend work would need to change — this frontend's job in the meantime is representing the *shape* of the decided parts accurately, which it does.
5. **All risks carried over from Packages 1–8 remain unchanged** (Knowledge's delete bug, Chat's unresumable sessions, Memory's no-update/delete, Workers' no-update endpoint, Administration's permission-duplication bug, Connectors' non-functional backend) — see the respective prior reports. None are specific to or worsened by this package.

---

## 14. Files changed, test results, remaining risks, recommended next phase

### Files changed
See §12 — 15 new files, 2 modified files, 0 deleted files.

### Test results
`npm run build` → 45 routes, 0 errors. `npm run lint` → 0 warnings/errors. `npm test` → 90/90 passing (8 new). Live smoke test against a real backend confirmed every UX requirement (§11) and found + fixed one genuine information-exposure bug (§9), re-verifying both the fix and that the admin path remained unaffected afterward.

### Remaining risks
See §13.

### Recommended next phase

With Packages 1–9 now all addressed, `FRONTEND_ARCHITECTURE_V1.md` Part E's original sequencing is exhausted. The concrete next steps are no longer "which package," but:

1. **Start the backend schema/endpoint work §3 lists**, beginning with the organisation-level licence record (item 1) — nothing else in that list, or any further frontend work on this package, can proceed without it. This has been flagged as the single most urgent non-code gap in this project since Package 1; it is now the only thing standing between this package's UX scaffold and a real licensing system.
2. **Resolve LICENSING_MODEL_V1.md §19's still-open items** that block specific screens — licence file format/signing (blocks a real Licence Details), hardware-fingerprint algorithm (blocks real Sovereign enforcement), and who performs human approval (blocks a real approval workflow behind the three wizards already built here).
3. **Revisit the §9 finding across Package 7's admin pages** as a small, standalone hardening pass, once resourced — not urgent (the visible UX has never been wrong, only the raw response bytes), but worth closing properly rather than leaving as a known gap indefinitely.
