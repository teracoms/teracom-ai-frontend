# Wave 2 Completion Report

**Date:** 2026-08-19 · **Scope:** all five Wave 2 workstreams (RAG-to-Chat Wiring → Deployment & Health Readiness → Onboarding & Trust Surface Clarity → GOV1 → Commerce-to-Licensing Lifecycle Automation, Phase 1), run in the order approved. **Source:** `WAVE2_IMPLEMENTATION_PLAN.md` (`teracom-ai-docs`), itself derived from `INTERNAL_PILOT_READINESS_ASSESSMENT.md`, `MASTER_RECOMMENDATION.md`, and `PRIORITISED_EXECUTION_PLAN.md`. **Status:** all five workstreams implemented, tested, documented, and committed locally in both repositories. **Not pushed** — holding for review, per instruction ("Do not push without approval").

---

## 1. Summary

Every workstream named in `WAVE2_IMPLEMENTATION_PLAN.md` shipped, in the order it was approved, each following the same discipline established in Wave 1: implement, test against the full suite (not just the new tests), produce a real implementation report, commit, and hold for review before pushing.

**Workstream 1 — RAG-to-Chat Wiring.** Worker chat previously concatenated the full content of every permitted Knowledge document into its context with no retrieval, no ranking, and no size bound. `services/worker_retrieval_service.py#get_worker_context()` now routes through the platform's already-real semantic search (`services/rag_service.py`) whenever a query is supplied, bounded by new `CHAT_CONTEXT_TOP_K`/`CHAT_CONTEXT_MAX_CHARS` config, with results over-fetched and post-filtered to enforce worker-level `KnowledgePermission` scoping (Chroma itself only scopes by organisation). Investigation found 8 real call sites of `build_context()`; only Worker chat has a natural query to embed, and the other 7 were confirmed byte-for-byte unaffected. **6 new tests.** See `WAVE2_RAG_TO_CHAT_WIRING_IMPLEMENTATION_REPORT.md`, ADR-033.

**Workstream 2 — Deployment & Health Readiness.** A new, genuinely unauthenticated `GET /healthz` at the conventional root-level path — a real `SELECT 1`, `503` on failure — distinct from the pre-existing static `GET /` and the pre-existing authenticated `GET /health/`. Database connection pool now explicitly sized (`DB_POOL_SIZE`/`DB_MAX_OVERFLOW`, defaults 10/20) rather than left on SQLAlchemy's implicit defaults. Multi-worker deployment was deliberately **not** enabled — the existing in-process-rate-limiter blocker is reaffirmed, not fixed, in `docs/operations/PRODUCTION_RUNBOOK.md`. **3 new tests.** See `WAVE2_DEPLOYMENT_HEALTH_READINESS_IMPLEMENTATION_REPORT.md`, ADR-034.

**Workstream 3 — Onboarding & Trust Surface Clarity.** The first frontend-facing workstream in this sequence. Three onboarding surfaces gained distinguishing labels. Investigation found `RenewalWizard.js`/`OwnershipTransferWizard.js` had **no** illustrative-data disclaimer at all (not merely an insufficiently prominent one), and found the three existing admin/billing disclaimers were **factually stale** — claiming no licence/plan/request-endpoint data model exists, all false since Wave 1 Workstream 5. Both gaps were fixed, not just re-styled. A new `.illustrative-data-banner` CSS class was added, kept distinct from the semantically different `.preview-banner`. No backend change. Validated via `next lint`/`next build` (both clean) — this frontend has no React component-rendering test infrastructure, confirmed by investigation. See `WAVE2_ONBOARDING_TRUST_SURFACE_CLARITY_IMPLEMENTATION_REPORT.md`, ADR-035.

**Workstream 4 — Package GOV1 (Governance, Policy, Standards & Knowledge Inheritance Cascade).** The largest workstream in the wave. A new, additive `GovernanceRule`/`GovernanceAuditLog` cascade engine (organisation-level defaults, department-level overrides, one resolution mechanism across four rule types) built entirely alongside the pre-existing `services/governance_policy_service.py` registry, which is completely unchanged — investigation found reshaping it would have broken its own regression test. Knowledge Inheritance (the fourth rule type) is wired into `assign_worker_department()`, confirmed to be the real integration point since `POST /workers/` never sets a department at creation time. Additive and idempotent: grants new knowledge access, never revokes, never duplicates. **12 new tests.** See `WAVE2_GOV1_GOVERNANCE_CASCADE_IMPLEMENTATION_REPORT.md`, ADR-036.

**Workstream 5 — Commerce-to-Licensing Lifecycle Automation, Phase 1.** `app/api/webhooks/stripe/route.js` previously handled exactly one Stripe event type; four more (`invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`) were silently dropped with no Zoho sync and no record anywhere — a real, present-tense bug. All four now have a deliberate outcome (Zoho sync for renewals, structured logging otherwise). A new backend endpoint, authenticated by a new shared service-token dependency rather than the staff JWT plane (no staff/user identity exists on a webhook's call path), lets the webhook write to the previously-inert `LicenceBillingReference` table when a commerce event carries a known Teracom `licenceId` — an optional, not-yet-UI-exposed field added to checkout for exactly this purpose. No real Teracom SaaS tier was wired to a real Stripe product — explicitly out of scope, gated on a still-open pricing decision. **8 new backend tests, 6 new frontend tests.** See `WAVE2_COMMERCE_TO_LICENSING_LIFECYCLE_AUTOMATION_IMPLEMENTATION_REPORT.md`, ADR-037.

---

## 2. Tests

| Metric | Wave 2 start | Wave 2 end |
|---|---|---|
| Backend tests passing | 277/277 | 306/306 (+29 new) |
| Frontend tests passing | 302/302 | 308/308 (+6 new) |
| New backend migrations | — | 1 (`3f8a1c6e9b2d`, Workstream 4) |
| New ADRs | — | 5 (ADR-033 through ADR-037) |
| New backend models | — | 2 (`GovernanceRule`, `GovernanceAuditLog`) |
| New backend services | — | 2 (`governance_cascade_service.py`, `knowledge_inheritance_service.py`) |
| New backend API endpoints | — | 7 (`GET /healthz`; 4 under `/governance-rules/*`; 2 under `/internal/licence-billing-references/*`) |
| Frontend workstreams with real code changes | — | 2 of 5 (Workstream 3, Workstream 5) |

No regression occurred at any point in the wave — every workstream's full-suite run passed cleanly before moving to the next. Per-workstream breakdown: WS1 +6 backend, WS2 +3 backend, WS3 0 (frontend-only, no new automated coverage — see its own report for why), WS4 +12 backend, WS5 +8 backend / +6 frontend.

---

## 3. Risks

- **Workstream 5's service-to-service auth is a new pattern, not yet battle-tested.** `INTERNAL_SERVICE_TOKEN` is a single shared secret across one endpoint; it is blank by default (safe — the endpoint always rejects until configured) but has no rotation mechanism, no per-caller scoping, and no rate limiting distinct from the rest of the API. Low blast radius today (the endpoint can only upsert a billing reference for a licence that already exists, and only when the caller already knows a real `licenceId`), but worth revisiting before any second consumer of this pattern is added.
- **Workstream 5's webhook route handler has no direct automated test coverage** — only the library modules underneath it (`lib/zoho.js`, `lib/api/commerceLicensing.js`) are unit-tested; the route's own event-type `switch` and per-handler orchestration is validated only via `next lint`/`next build`, not exercised end-to-end against a real or simulated Stripe payload. A configuration mistake in the event-routing logic itself (as opposed to the library calls it makes) would not be caught by this wave's test suite.
- **Workstream 2's multi-worker deployment blocker remains open**, reaffirmed rather than fixed. `/healthz` makes single-process health real and correct; it does not change the fact that a distributed rate limiter is still required before `--workers >1` is safe.
- **Workstream 4's cascade engine coexists with, but does not consolidate, the ~24 pre-existing ad hoc `require_role("admin")` call sites elsewhere in the codebase.** This is an explicit, stated scope boundary, not an oversight — but it means governance enforcement in this codebase is now provided by two parallel mechanisms (the new cascade, and the old ad hoc checks), not yet one.
- **Workstream 1's semantic-search-based chat context is a behavioural change to what Worker chat actually says**, not just an internal refactor — a worker's answers will now reflect the top-K most semantically relevant permitted documents rather than the full content of every permitted document. This is the intended fix (bounded, ranked context vs. unbounded concatenation), but it is a live behaviour change a pilot user could notice.

---

## 4. Pilot readiness impact

- **Positive:** `GET /healthz` (Workstream 2) closes a real Day-0 gap — standard orchestration/uptime tooling can now check readiness without authenticating. Worker chat (Workstream 1) is now honestly and functionally "RAG-powered" on its primary daily-use surface, closing a credibility gap between how the platform was described and what it actually did. The Onboarding & Trust Surface Clarity fixes (Workstream 3) remove real, live-since-Wave-1 factual inaccuracies from customer-facing billing pages — a pilot customer reading those disclaimers today would have been told something false about the platform's own capabilities.
- **Neutral-to-positive:** Package GOV1 (Workstream 4) is new capability with no existing consumer yet exercising it in the pilot's current scope — it de-risks *future* packages (Document Lifecycle Governance, Knowledge Graph, Organisational Search) more than it changes what a pilot user sees today.
- **No change:** Commerce-to-Licensing Phase 1 (Workstream 5) fixes a bug in Teracom's Commerce ecosystem, a separate product from the SaaS platform a pilot customer uses — it has no direct effect on internal pilot readiness for the Teracom AI platform itself.
- **Unchanged blocker:** multi-worker deployment remains unavailable, same as before this wave — a pilot running on a single uvicorn process is unaffected either way.

---

## 5. Demo readiness impact

- Worker chat (Workstream 1) is now safe to demo as "RAG-powered" without qualification — it actually performs query-based retrieval today.
- `/healthz` (Workstream 2) is demoable as a real readiness endpoint to a technically-literate audience (e.g. an ops/infra stakeholder), though it has no visible UI surface of its own.
- The three corrected billing-page disclaimers (Workstream 3) mean a live demo of `/portal/admin/billing/*` no longer risks a presenter reading out a factually wrong claim about backend capability if asked a follow-up question.
- GOV1 (Workstream 4) has a real, working API but **no admin-facing UI** — it is demoable only via direct API call (e.g. `curl`/Postman) today, not through the Portal itself. Framing this correctly in any demo (a real backend capability, UI still to come) matters.
- Commerce-to-Licensing Phase 1 (Workstream 5) is backend/webhook plumbing with no new UI and is not itself a demo-facing change — its relevance to a demo is indirect (Commerce's Stripe integration is now more correct/complete, should Commerce ever be shown alongside the Teracom AI platform).

---

## 6. Remaining blockers

Named explicitly, per this wave's own consistent discipline of stating what wasn't done and why, not leaving it to be discovered later:

- **Multi-worker deployment** — blocked on replacing the in-process rate limiter with a distributed one. Unchanged by this wave; reaffirmed in `docs/operations/PRODUCTION_RUNBOOK.md`.
- **A management UI for the GOV1 cascade** — the API is real and complete; browsing/editing governance rules through the Portal itself is separate, future frontend work.
- **Consolidation of the ~24 pre-existing ad hoc admin-role checks onto the GOV1 cascade** — explicitly out of this workstream's scope; two parallel enforcement mechanisms coexist until a later pass unifies them.
- **Real SMTP credentials** — carried over from Wave 1, still outside this session's provisioning authority; the mechanism remains proven, not the credential.
- **The "contract" half of the Wave 1 tier→plan_id migration** — carried over from Wave 1, still not attempted.
- **Real Teracom SaaS tier-to-Stripe-product wiring, and any self-service upgrade/pricing flow** — explicitly gated on a still-undecided pricing question, per the amended `COMMERCIAL_READINESS_ASSESSMENT.md`. Workstream 5 fixed Commerce's own webhook blindness and laid identity-linking groundwork only; it is not that pricing decision, and does not require one to be made.
- **No storefront UI for the new `licenceId` checkout field** — server-side plumbing only; a real caller (e.g. a Portal-initiated purchase flow) is separate future work.
- **No automated dunning/notification flow for a failed Stripe payment** — logged, not acted on.
- **No direct automated test coverage for the Stripe webhook route handler's own orchestration logic** — validated via `next lint`/`next build` only, per the test-infrastructure constraint named in §3 above.

---

## 7. Commit and Push Status

| Workstream | Backend commit | Frontend commit | Push status |
|---|---|---|---|
| 1 — RAG-to-Chat Wiring | `2ce355b` | `69b8d9a` (governance docs only) | **Local only, awaiting review** |
| 2 — Deployment & Health Readiness | `7d736bc` | `ca04a70` (governance docs only) | **Local only, awaiting review** |
| 3 — Onboarding & Trust Surface Clarity | — (frontend-only) | `106e311` | **Local only, awaiting review** |
| 4 — Package GOV1 | `53cd434` | `a22707d` (governance docs only) | **Local only, awaiting review** |
| 5 — Commerce-to-Licensing Lifecycle Automation (Phase 1) | `4989f6d` | `59c73ba` | **Local only, awaiting review** |

All five workstreams are complete, tested, and committed locally in both repositories. Per instruction ("Do not push without approval"), nothing in this wave has been pushed. Holding here for review.
