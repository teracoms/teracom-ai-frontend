# Licensing Model V1

**Status:** Approved by the project owner, 2026-08-15. This is now the **source of record** for Teracom AI licensing — it supersedes the tier/hosting framing in [[licensing-model]] (the original draft) and the "Sovereign is a separate edition" framing in ADR-009. See ADR-011 in [[architecture-decisions]] and the first entry in [[licensing-changelog]] for what specifically changed. [[product-editions]] and [[commercial-model]] have been updated to match this document.

Per [[documentation-standards]] §2, this document separates **decided** from **not decided** throughout — do not treat an open item as answered by inference, and do not quote a "not decided" figure to a customer or partner.

---

## 1. What changed from the original draft

The original [[licensing-model]] treated Sovereign as a third *edition*, defined primarily by being customer-hosted. V1 restructures this into two independent axes:

- **Product tier** (§2) — Starter / Enterprise / Platinum — governs worker/user/organisation limits and billing cadence.
- **Hosting model** (§3) — Teracom Hosted / Dedicated Hosted / Customer Hosted (Sovereign) — governs *where the deployment runs*.

A customer's licence is now the combination of a tier **and** a hosting model, not a single edition name. This is a more flexible commercial shape (e.g. an Enterprise-tier customer can in principle request Dedicated Hosted), but it also means several combinations are not yet worked out — flagged in §18.

## 2. Product tiers

| Tier | Workers | Users | Organisations | Billing |
|---|---|---|---|---|
| **Starter** | 5 | 10 | 1 | Monthly or annual |
| **Enterprise** | 30 | Licensed User Count | Up to 5 | Monthly or annual |
| **Platinum** | 50 | Licensed User Count | Up to 30 | Monthly or annual |

**"Licensed User Count"** (Enterprise, Platinum): unlike Starter's fixed 10-user allocation, the user count for Enterprise and Platinum is a contractual figure agreed per customer and encoded into that customer's signed licence file (§9), not a fixed platform default. There is no stated minimum or maximum for this figure — **not decided**.

Worker, user, and organisation counts are all part of the same signed licence — see §9 and §15.

## 3. Hosting models

Three hosting models are approved:

1. **Teracom Hosted** — multi-tenant, Teracom-operated infrastructure (the model Starter/Enterprise have used to date).
2. **Dedicated Hosted** — single-tenant infrastructure, still Teracom-operated, dedicated to one customer.
3. **Customer Hosted (Sovereign)** — the backend runs on the customer's own infrastructure; Teracom has no live server in the loop at request time.

**Not decided:** which tiers a given hosting model is available under (e.g. whether Starter can be Dedicated Hosted, or whether Customer Hosted (Sovereign) requires Enterprise/Platinum). Treat every tier × hosting-model combination as open until a specific combination is confirmed. This is the single most important open item for whoever scopes a specific deal — see §18.

## 4. Worker limits

Each tier's worker count (§2), plus any [[licensing-model-v1|additional worker packs]] (§7) purchased, forms the organisation's worker ceiling.

- **Worker creation is blocked immediately when the limit is reached.** There is no soft-warning or grace period on worker count specifically — this is a hard stop enforced at creation time, not an after-the-fact reconciliation.
- This is a decided **policy**. It is not yet implemented anywhere in the product — the backend has no plan/seat data model at all today (ADR-010, [[project-state]] §5 item 1) — so today nothing actually blocks worker creation at any count. Do not describe this as "enforced" in customer-facing material until the corresponding backend work ships.

## 5. User limits

- **Starter:** fixed at 10 users, included in the tier.
- **Enterprise / Platinum:** governed by Licensed User Count (§2) — a per-customer contractual figure, not a shared platform default.

Enforcement mechanism (how a user-count overage is detected/blocked) is **not decided** — no analogous "blocked immediately" statement exists for users the way it does for workers in §4.

## 6. Organisation limits

- **Starter:** 1 organisation.
- **Enterprise:** up to 5 organisations.
- **Platinum:** up to 30 organisations.

This is new: prior documentation had no organisation-count axis at all, since the backend's `organisations` table has no plan/limit concept (ADR-010). What "organisation" means operationally for a single licence spanning multiple organisations (shared worker pool vs. per-organisation allocation) is **not decided**.

## 7. Additional worker packs

Two pack sizes are approved as add-ons to a tier's base worker allocation:

- **+5 workers**
- **+10 workers**

**Not decided:** which tiers packs are available on, whether packs are billed monthly/annually like the base tier or as a one-time/prorated charge, whether there is a maximum number of packs stackable on one licence, and whether adding a pack requires the same human-approval + re-issued-licence-file cycle as other entitlement changes (§14 assumes yes, by analogy, but this is not explicitly confirmed).

## 8. Licensing model (general principles)

All tiers and hosting models share the same underlying licensing principles:

- **Subscription only.** Every tier bills on a recurring cadence (§2).
- **No perpetual licensing.** No tier or hosting model — including Customer Hosted (Sovereign) — is ever sold as a one-time, non-expiring licence. This carries forward ADR-009's original "no perpetual licences" decision unchanged.
- **Human approval required.** See §9.
- **Hardware bound.** See §10.
- **Offline capable.** The licensing mechanism must be validatable without a live call back to Teracom. This matters most for Customer Hosted (Sovereign), where there is no Teracom-operated server in the loop at all, but the requirement is stated generally, not scoped to one hosting model — **whether/how it applies to Teracom Hosted and Dedicated Hosted deployments is not decided**, since Teracom controls that infrastructure directly and a live check would be trivial there.
- **Signed licence file.** The licence is a signed artefact issued by Teracom (§15), not a database row a customer can edit. Exact file format, signing algorithm, and key custody remain **not decided** — carried forward from the original [[licensing-model]] §3, unresolved by this update.

## 9. Human approval workflow

No licensing action that changes what a customer is entitled to is fully automated end-to-end — a human must approve before a new or updated signed licence file is issued. This is stated explicitly for ownership transfer (§11) and generally for the licensing model as a whole (§8); by extension it is treated here as applying to:

- Initial licence issuance for a new customer.
- Any entitlement change (tier upgrade, hosting-model change, worker pack addition) — see §14.
- Renewal (§12) and ownership transfer (§11).

**Decided:** the approval step exists and is required. **Not decided:** who performs it (a specific role — [[licensing-compliance-worker]] is the most directly-named candidate, but this has not been confirmed as an approved workflow assignment), what SLA applies, and whether routine renewals with no entitlement change require the same level of review as a substantive change. Tier 1 support (§16) is explicitly **not** the approver — Tier 1 is an AI worker persona, not a human, and human approval is the whole point of this control.

## 10. Hardware-bound licensing

Licences are bound to specific customer hardware rather than being freely portable to any machine.

### Hardware fingerprint

The fingerprint is composed from:

- **VM UUID**
- **Disk UUID**
- **TPM**, where available

"Where available" signals that TPM is not assumed to be present on every deployment (e.g. some cloud VMs lack a virtual TPM) — the fingerprint degrades gracefully to VM UUID + Disk UUID when no TPM is present. **Not decided:** the exact algorithm for combining these into a single fingerprint value, how the fingerprint tolerates routine hardware maintenance (e.g. a single disk replacement) without registering as a licence violation, and — most importantly, carried forward unresolved from the original [[licensing-model]] §3 — whether hardware binding is meaningfully applicable to Teracom Hosted deployments at all, since Teracom itself controls that hardware.

## 11. Ownership transfer workflow

- **Allowed.** A licence can be transferred to new ownership (e.g. an acquisition, a customer moving to new hardware, an MSP handoff — see §17).
- **Human approval required**, same principle as §9.

**Not decided:** how a transfer is initiated (a self-service request vs. a support ticket), what information the new owner must provide, whether a transfer resets the renewal/grace-period clock (§12–13), and whether a transfer requires re-establishing the hardware fingerprint (§10) as a matter of course (a change of ownership very plausibly means a change of hardware, but the two are not explicitly linked in the approved decisions).

## 12. Renewal process

- Renewal may be requested **up to 90 days before expiry.**

**Not decided:** whether there is a minimum renewal window (i.e. the latest a renewal can still be requested before expiry, short of just letting it lapse into the grace period), and whether renewal is ever automatic (e.g. auto-renew unless cancelled) or must always be an explicit, human-approved request per §9. Read literally, the approved decision describes a request window, not an auto-renewal mechanism — treat renewal as request-driven until stated otherwise.

## 13. Grace period process

If a licence expires without a completed renewal, a **30-day grace period** begins.

**During the grace period, the following remain allowed:**

- Login
- Data export
- Uploading a replacement licence
- Requesting renewal

This is a deliberate design: a lapsed licence does not immediately cut a customer off from their own data or from the ability to fix the lapse.

## 14. Locked mode process

**After the grace period ends** without a valid licence:

- The deployment enters **Locked Mode.**
- A valid licence is required to exit Locked Mode.
- **Only licence management functions remain available** — everything else (chat, worker management, knowledge, admin, etc.) is inaccessible until a valid licence is uploaded and accepted.

This is the terminal state of the renewal lifecycle: request (§12, up to 90 days early) → grace period (§13, 30 days, still functional with defined exceptions) → Locked Mode (this section, functionally frozen except for licence recovery).

## 15. Upgrade entitlements

**Not decided as a specific mechanism** — no approved decisions were supplied for this heading beyond what can be inferred from §8–9. The reasonable inference, consistent with "signed licence file" (§8) and "human approval required" (§9), is that any upgrade — a tier change (Starter → Enterprise → Platinum), a hosting-model change, or an additional worker pack (§7) — is delivered as a **re-issued signed licence file**, gated by the same human-approval step used for renewal and ownership transfer.

**Explicitly open:** proration/billing treatment of a mid-term upgrade, whether downgrades are supported at all (and if so, on what notice), whether an upgrade takes effect immediately on approval or at the next billing cycle, and whether worker packs can be removed once added or only added. Do not present any of this as decided in customer-facing material.

## 16. Appliance deployment model

**Teracom AI is delivered as an appliance, not a collection of files.** A customer does not receive source code, raw deployment scripts, or ad hoc file access to assemble themselves. Instead, a customer receives exactly four things:

1. **Compiled application** — a packaged, ready-to-run build, not source.
2. **Signed licence** — the artefact described in §8–10.
3. **Upgrade packages** — versioned, Teracom-issued update bundles; a customer does not `git pull` or self-build an upgrade.
4. **Configuration** — customer-specific settings, layered on top of the compiled application; configuration is data, not code.

This framing is consistent with, and reinforces, the hardware-bound/offline-capable/signed-licence model in §8–10: Teracom controls the software supply chain end-to-end (what runs, what version, under what licence), even for Customer Hosted (Sovereign) deployments where Teracom does not control the underlying hardware. **Not decided:** the exact packaging/delivery mechanism for the compiled application and upgrade packages (container image, signed installer, etc.) and how upgrade packages interact with the hardware-bound licence (does an upgrade require a new licence file, or does the existing one remain valid across upgrades?).

## 17. Support model

Two support tiers are approved:

- **Tier 1 — Teracom Support Worker.** First-line support is handled by a dedicated Teracom-side AI worker persona.
- **Tier 2 — Human escalation.** Issues Tier 1 cannot resolve escalate to a human.

**Not decided:** whether the Teracom Support Worker is a customer-facing worker drawn from the same catalogue as an organisation's own workers ([[worker-catalogue]]) and counted against that organisation's worker limit (§4), or a separate, platform-level fixture outside any tier's allocation. Treat this as an open question before assuming either answer — it materially affects whether "Tier 1 support" consumes a customer's worker seat.

## 18. Partner/MSP model

**Not decided.** No approved decisions were supplied for this heading — it is documented here as a required section with no content yet, per [[documentation-standards]] §2's rule against letting a placeholder read as an approved answer. Open questions a future pass must answer include: whether an MSP/partner can hold licences on behalf of multiple end customers, how ownership transfer (§11) interacts with a partner-managed licence, and whether a partner tier or discount structure exists at all. This should be raised with the project owner before any partner-facing collateral is produced.

## 19. Consolidated open-questions list

Carried forward from the original [[licensing-model]] §3 and this document, for a single place to check before starting build work:

| # | Question | Status |
|---|---|---|
| 1 | Licence file format (JWT-like, custom binary, signed JSON, etc.) | Still open |
| 2 | Signing key custody and rotation | Still open |
| 3 | Exact hardware-fingerprint combination algorithm and tolerance for routine hardware changes | Still open (§10) |
| 4 | Embedded public-key distribution/rotation for offline validation | Still open |
| 5 | Term length / renewal cadence | **Resolved** — renewal window is up to 90 days before expiry (§12); auto-renewal specifically still open |
| 6 | Grace period / lapse behaviour | **Resolved** — 30-day grace period, then Locked Mode (§13–14) |
| 7 | Clock-tampering resistance | Still open — unaddressed by this update; the tension between "offline-capable" and "term-based" flagged in the original draft remains unresolved |
| 8 | Revocation of an already-issued licence before expiry | Still open |
| 9 | Worker-count enforcement mechanism inside Customer Hosted (Sovereign) specifically | Partially resolved — §4's "blocked immediately" policy is now general across all hosting models, but Sovereign-specific local enforcement (no phone-home) is still unaddressed |
| 10 | Tier × hosting-model availability combinations | New, open (§3) |
| 11 | Upgrade/downgrade mechanics, proration, and reversibility | New, open (§15) |
| 12 | Partner/MSP model | New, open (§18) |
| 13 | Whether Tier 1 support consumes a worker seat | New, open (§17) |

A Licensing & Compliance Worker or human picking up this workstream should treat this table, not §3 of the original [[licensing-model]] alone, as the current authoritative open-questions list.
