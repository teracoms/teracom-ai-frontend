# Licensing Model

**Superseded, 2026-08-15 — see [[licensing-model-v1]].** This document's Sovereign-as-a-separate-edition framing, and most of §3's open questions, have been replaced or resolved by Licensing Model V1 (ADR-011 in [[architecture-decisions]]). It is kept here for history, per [[documentation-standards]] §2's append-only rule for decision logs — do not treat it as current. §3's still-unresolved items (signing key custody, licence file format, clock-tampering resistance, revocation) are carried forward into [[licensing-model-v1]] §19, which is the current consolidated open-questions list.

**Status (original, now historical):** Directional decisions approved (ADR-009 in [[architecture-decisions]]); **detailed design not started.** This document separates what is decided from what is genuinely open — do not treat the open questions as answered by inference.

---

## 1. What "licensing" means for each edition

Starter and Enterprise ([[product-editions]]) don't need a distinct licensing *mechanism* beyond normal SaaS subscription management — entitlement (seat count, active/inactive) is meant to live in a billing record on the Teracom-hosted backend, kept in sync with Stripe via webhook (see [[commercial-model]] §4, [[roadmap]] Package 9). That record does not exist in the backend schema yet.

Sovereign Edition is the case that needs a genuinely new mechanism, because there is no Teracom-hosted server in the loop at request time to check anything against.

## 2. Sovereign licensing — decided so far

Per the project owner's approved decisions (2026-08-15):

- **Signed, encrypted licence file** — issued by Teracom, delivered to the customer, consumed by the customer-hosted backend at startup/runtime.
- **Hardware-bound** — the licence is tied to specific customer hardware, not freely portable to any machine.
- **Offline-capable** — the customer-hosted deployment must be able to validate its licence without a live network call back to Teracom.
- **No perpetual licences** — every licence, including Sovereign, is issued for a term and must eventually be renewed. This is explicit and firm — do not design or quote a "lifetime" or "perpetual" Sovereign licence.

## 3. Open design questions — NOT decided, do not assume answers

These require a dedicated design pass (by a Licensing & Compliance Worker, once operating, or a human) before any Sovereign build work starts:

1. **Licence file format.** Not specified — could be a signed JWT-like structure, a custom binary format, a signed JSON blob, etc. No format has been chosen.
2. **Signing key custody.** Who holds the private signing key, how is it rotated, what happens if it's compromised? Not addressed.
3. **Hardware-binding mechanism.** What hardware identifier(s) are used (MAC address, TPM-backed identity, CPU ID, a generated machine fingerprint)? Not chosen. Needs to survive reasonable hardware maintenance (e.g. a single NIC replacement) without treating it as a licence violation — not addressed.
4. **Offline validation mechanism.** If there's no phone-home, the customer-hosted backend needs an embedded public key (or equivalent) to verify the licence file's signature locally. Key distribution/rotation strategy for this embedded key is not addressed.
5. **Term length and renewal cadence.** Not specified — annual? Multi-year? Unknown.
6. **Grace period / lapse behaviour.** What happens when a Sovereign licence expires and hasn't been renewed — does the deployment degrade, lock out new sessions, or hard-stop? Not decided. Given the platform is customer-hosted and offline-capable, this matters more than for Starter/Enterprise (there's no Teracom-side kill switch).
7. **Clock-tampering resistance.** An offline-capable, time-bound licence is vulnerable to a customer simply turning back their system clock to avoid expiry, unless something addresses this (e.g. requiring periodic online check-ins even for "offline-capable," or a trusted-time mechanism). Not addressed — flagged here because it is the most obvious gap between "offline-capable" and "term-based, not perpetual" as currently stated; these two requirements are in tension and the tension hasn't been resolved.
8. **Revocation.** If a Sovereign contract is terminated early, is there any mechanism to invalidate an already-issued licence file before its stated expiry? Not addressed.
9. **Seat/worker-count enforcement inside a Sovereign deployment.** Since Sovereign isn't seat-capped by the same mechanism as Starter/Enterprise (see [[product-editions]]), it's unclear whether the licence file itself encodes a worker-count limit the customer-hosted backend enforces locally, or whether Sovereign is uncapped by design. Not addressed.

## 4. Why this matters now, not later

ADR-010 in [[architecture-decisions]] and [[roadmap]] §Billing & Licensing are explicit that this workstream has the longest lead time in the whole project and should start **now**, in parallel with the frontend product build-out — not be picked up after Package 7. A Licensing & Compliance Worker inheriting this document should treat §3 as their first work order, not treat §2 as sufficient to start implementation.

## 5. Non-goals (explicitly out of scope for this model)

- This document does not cover open-source licence compliance for third-party dependencies — that is a separate concern, see [[licensing-compliance-worker]] for the worker role that would own both this and that, but they are not the same body of work.
- This document does not specify DRM/anti-tamper measures for the application code itself, only the licence-file/entitlement mechanism.
