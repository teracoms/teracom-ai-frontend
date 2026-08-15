# Licensing Changelog

**Format:** newest entry first. Append-only, per [[documentation-standards]] §2 — never rewrite a past entry to reflect new understanding; add a new entry that supersedes it and leave the old one for history. This log is scoped specifically to licensing/commercial-model decisions (tiers, hosting models, entitlement mechanics, the licensing lifecycle) — for general product/engineering history see [[changelog]].

---

## 2026-08-15 — Licensing Model V1 approved

The project owner approved a full restructuring of the licensing model, recorded in the new [[licensing-model-v1]] and ADR-011 in [[architecture-decisions]]. [[commercial-model]] and [[product-editions]] were updated in place to match; the original [[licensing-model]] draft is marked superseded rather than rewritten.

**What changed structurally:** the prior model (Starter / Enterprise / Sovereign) named three *editions*, with hosting location baked into "Sovereign." V1 splits this into two independent axes:

- **Product tier:** Starter (5 workers / 10 users / 1 organisation), Enterprise (30 workers / Licensed User Count / up to 5 organisations), Platinum (50 workers / Licensed User Count / up to 30 organisations) — all monthly or annual billing. Platinum is new; it did not exist in the prior model.
- **Hosting model:** Teracom Hosted, Dedicated Hosted, Customer Hosted (Sovereign) — selected independently of tier. "Sovereign" is now a hosting model name, not an edition name.

**Newly decided in this pass** (previously either unaddressed or listed as an open question):

| Area | Decision |
|---|---|
| Additional worker packs | +5 and +10 packs, on top of a tier's base allocation |
| Worker-limit enforcement policy | Worker creation blocked immediately when the limit is reached |
| Hardware fingerprint | VM UUID + Disk UUID + TPM (where available) |
| Human approval | Required for licensing actions generally, and explicitly for ownership transfer |
| Ownership transfer | Allowed, with mandatory human approval |
| Renewal window | Up to 90 days before expiry |
| Grace period | 30 days; login, data export, licence upload, and renewal request all remain allowed during it |
| Locked Mode | Terminal state after the grace period — only licence management functions remain available |
| Appliance delivery model | Customers receive a compiled application, signed licence, upgrade packages, and configuration — never source or ad hoc file access |
| Support model | Tier 1 (Teracom Support Worker) → Tier 2 (human escalation) |

**Still open** (carried forward or newly introduced by this restructuring — see [[licensing-model-v1]] §19 for the full table): licence file format, signing key custody, clock-tampering resistance, revocation of an issued licence, which tier × hosting-model combinations are actually offered, upgrade/downgrade mechanics and proration, the Partner/MSP model (no decisions supplied for this at all), and whether Tier 1 support consumes a worker seat.

**Why it mattered:** this is the first time the licensing lifecycle (renewal → grace period → lock) has concrete, decided timings and behaviour, giving the backend billing-schema conversation (ADR-010, [[roadmap]] §9) real requirements to design against instead of an open-ended question list. It also corrects a structural ambiguity in the original model, where "Sovereign" conflated a commercial tier with a hosting/deployment choice — a distinction that matters once a customer might reasonably want, say, Enterprise-tier limits on Dedicated Hosted infrastructure.

**Not addressed by this pass:** pricing figures (still placeholder-only, see [[pricing-model]]), and the fact that [[pricing-model]]'s existing seat table still reflects the pre-V1 Starter/Enterprise/Sovereign structure and needs a follow-up update before it's used for anything customer-facing.
