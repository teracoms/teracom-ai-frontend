# Website Information Architecture V2

**Status:** Draft V2, 2026-08-16. Expands and standardises [[website-information-architecture-v1]] (Draft V1, 2026-08-15) with a first-hand review of the actual repository state, and separates **decided** (ratified via an ADR or a project-owner-approved commercial/governance document) from **proposed** (drafted in V1 or here, not yet ratified) from **built** (verifiable in the repository today, whether or not it matches either IA draft). Per [[documentation-standards]] §2, an inferred or drafted item must never read as approved — this document is stricter about that separation than V1 was.

**Relationship to V1:** V1 is not edited, superseded-banner'd, or deleted by this document — same non-destructive precedent as [[foundation-workforce-catalogue-v2]] relative to the original 11 workforce files. V1's content is carried forward and organised here; nothing in it is contradicted, only labelled more precisely against what the repository and the decision record actually show.

---

## 0. How to read this document

Three labels are used throughout, and every substantive claim below carries one:

- **BUILT** — verified first-hand against the actual `teracom-ai-frontend` repository as it exists today (file read, route confirmed, or behaviour traced through code). This is a statement of current fact, not endorsement that it's the target state.
- **DECIDED** — ratified: either an ADR in [[architecture-decisions]], or a project-owner-approved statement in a `docs/governance/*` or `docs/commercial/*` document (e.g. [[ux-vision]]'s ADR-012, [[licensing-model-v1]]'s ADR-011).
- **PROPOSED** — drafted in [[website-information-architecture-v1]] or in this document, describing a target state that has not been ratified by either mechanism above. The large majority of V1's content falls here — V1's own status line reads only "Draft V1," and no ADR, [[changelog]] entry, or [[roadmap]] line references it (confirmed by search — this is a first-hand finding of this document, not carried over from V1).

**Key finding driving this document's structure:** [[website-information-architecture-v1]] describes a target information architecture — two separate corporate sites on two separate domains, each with its own navigation — that does not match what is actually built. The live repository is a single Next.js application serving one merged site. Every section below states the BUILT reality first, then the PROPOSED target from V1, rather than presenting the target as if it already exists.

## 1. Corporate structure — PROPOSED target vs. BUILT reality

**PROPOSED (V1):** two distinct corporate properties on two distinct domains:

| Property | Domain | Purpose (per V1) |
|---|---|---|
| Teracom Solutions | `teracomsolutions.com.au` | Services, Solutions, Commerce, Customer Engagement |
| Teracom AI | `teracomai.com` | Digital Workforce Platform, AI Workers, Knowledge Platform, Licensing, Sovereign AI |

**BUILT:** this repository (`teracom-ai-frontend`, package name `teracom-commerce-platform-v3` — see [[frontend-architecture]] §A.1) is **one Next.js application**, not two. `NEXT_PUBLIC_SITE_URL` in `.env.example` is set to `https://www.teracomsolutions.com.au` — the single existing domain — and every route (`/`, `/securityos-ai`, `/store`, `/checkout/**`, `/portal/**`) is served from it. There is no second codebase, no `teracomai.com`-specific build, and no routing split by domain anywhere in the code. The "Teracom AI" product (Workers, Knowledge Platform, chat) lives at `/portal/**` inside this same application, not on a separate site.

**OPEN:** whether the two-domain split is still the intended direction, and if so, whether it means (a) a second, separate codebase/deployment, (b) a domain-based routing split of this same codebase, or (c) multi-tenancy at the DNS layer only with no code change — none of these is decided. This is the single most consequential open item in this document, since it changes the shape of any navigation or IA work that follows. Flagged to the project owner / [[project-manager-worker]], not inferred here.

## 2. Navigation — PROPOSED target vs. BUILT reality

**BUILT** (per [[frontend-architecture]] §A, verified first-hand): primary nav (`components/Header.js`) is a flat, 5-item list — `What We Do` (anchor), `SecurityOS AI`, `Expertise` (anchor), `Store`, `Portal` — plus a standalone `Open Store` CTA button. No dropdowns, no active-route highlighting, no mobile menu affordance (nav is `display:none` under `980px`, a pre-existing gap unrelated to this document).

**PROPOSED (V1)** — two separate nav sets, neither of which matches the built nav above:

| Teracom Solutions nav (proposed) | Teracom AI nav (proposed) |
|---|---|
| Home | Home |
| Services | Workers |
| Solutions | Knowledge Platform |
| Commerce Store | Licensing |
| Industries | Sovereign AI |
| About | Pricing |
| Contact | Documentation |
| Login to Teracom AI | Login |

**OPEN:** neither proposed nav has an implementation plan, a roadmap line, or an ADR. Per ADR-001 in [[architecture-decisions]], the marketing site (`Header.js`, `Footer.js`, `/`, `/securityos-ai`, `/store`, `/checkout/**`) is redesign-off-limits territory — any move toward either proposed nav is a **redesign** of exactly that off-limits surface and would need an explicit, recorded exception to ADR-001 before [[web-developer-worker]] could implement it. This document does not grant that exception; it only surfaces that one would be needed.

## 3. Services / Solutions / Industries taxonomy — PROPOSED only

V1 lists three content taxonomies with no corresponding built pages:

- **Services:** Cybersecurity, Networking, Infrastructure, Managed Services, Consulting, Audio Visual, Electronic Security, Intercoms.
- **Solutions:** Teracom AI, Cybersecurity Solutions, Managed Services Solutions, Network Solutions, Infrastructure Solutions, Audio Visual Solutions, Electronic Security Solutions, Industry Solutions.
- **Industries:** Critical Infrastructure, Small Business, Professional Services, Construction, Manufacturing, Education, Healthcare, Retail, Government.

**BUILT:** none of these exist as routes or page sections today. The current homepage (`/`) is a single-page flow — hero → intro statement → "what we do" 3-item list → SecurityOS AI showcase → partner logo wall → consulting showcase → store showcase → about → contact form (per [[frontend-architecture]] §A) — with no dedicated `/services`, `/solutions`, or `/industries` routes or sub-navigation.

**OPEN:** whether these three lists are meant to become dedicated routes, expand the existing homepage sections, or serve only as future [[content-production-worker]] categorisation tags. Not decided; flagged to [[marketing-manager-worker]] rather than assumed.

## 4. Commerce Store information architecture

V1's "Commerce Store" section lists six product categories (Security: CCTV, Access Control, Intrusion Detection, Intercoms, Facial Recognition; Networking; Infrastructure; Audio Visual; Automation; Software) and a six-stage "Commerce Store Model" pipeline (Supplier Feed → Import → Category Mapping → 20% Markup → AI Product Enrichment → Publish).

Per [[documentation-standards]] §6 (don't duplicate; link instead), the full first-hand architecture of what's actually built for the store — the real product catalogue, the Stripe/Zoho integration, the supplier-feed importer, and exactly which of the six pipeline stages exist vs. are entirely unbuilt — is documented in **[[commerce-store-architecture-v1]]**, not repeated here. The one-line summary: the six-category taxonomy above is **PROPOSED only** (today's `/store` page is a flat, uncategorised product grid — see [[commerce-store-architecture-v1]] §2), and of the six pipeline stages, only "Supplier Feed" (parsing) and a non-persisting "Import" endpoint are **BUILT**; Category Mapping, the 20% Markup rule, AI Product Enrichment, and Publish are **PROPOSED**, with zero corresponding code.

## 5. Public AI Assistants — PROPOSED only

V1 states "all public-facing assistants must be powered by the Teracom AI platform" and lists five planned assistants: General, Cybersecurity, Networking, Infrastructure, Commerce.

**BUILT:** no public (unauthenticated) assistant/chat surface exists anywhere in the repository. The only chat surface is `/portal/chat`, which is authenticated, per-organisation, and per-worker (a customer's own configured Worker persona, per [[worker-catalogue]]) — not a small fixed set of public, topic-named assistants. There is no backend concept of a "public assistant" distinct from an organisation-scoped Worker.

**OPEN:** whether these five public assistants are meant to be a distinct product surface from the authenticated Worker-chat product, or a curated, unauthenticated front door onto specific pre-configured Workers. Not decided; this materially affects backend scope (would a public assistant need its own non-organisation-scoped chat endpoint?) and should be raised with [[cto-worker]] before any implementation is scheduled.

## 6. Homepage hero and guiding statement

**PROPOSED (V1), not yet reconciled against the built homepage:** hero headline "Build Your Digital Workforce," sub-copy "Create, deploy and manage intelligent AI workers powered by organisational knowledge, memory and business processes," and the standalone guiding statement "Build Your Digital Workforce." four "Key Concepts" callouts (What Is An AI Worker?, What Is The Knowledge Platform?, What Is Sovereign AI?, Enterprise Control).

**BUILT:** the current homepage hero copy is whatever ships today in `app/page.js` (per [[frontend-architecture]] §A's described flow) — this document does not restate it verbatim to avoid drifting out of sync with the actual file (per [[documentation-standards]] §6); [[web-developer-worker]] or [[content-production-worker]] should diff the two directly before treating V1's proposed hero copy as a copy brief.

**OPEN/PROPOSED handoff:** if the proposed hero copy above is adopted, it is a **copy change to the existing homepage**, not a structural redesign — in scope for [[content-production-worker]] to draft and [[web-developer-worker]] to place, without requiring an ADR-001 exception (ADR-001 restricts layout/styling redesign, not text content, per [[content-production-worker]]'s own scope in [[foundation-workforce-catalogue-v2]]).

## 7. Open questions log (consolidated)

| # | Question | Status | Owner |
|---|---|---|---|
| 1 | Is the Teracom Solutions / Teracom AI split a separate codebase, a domain-routed split of this codebase, or DNS-only? | Not decided | Project owner / [[cto-worker]] |
| 2 | Do Services / Solutions / Industries become routes, homepage sections, or content tags only? | Not decided | [[marketing-manager-worker]] |
| 3 | Does the proposed Teracom Solutions/Teracom AI navigation require an ADR-001 exception, and if granted, in what scope? | Not decided | [[cto-worker]] / project owner |
| 4 | Are the five "Public AI Assistants" a new unauthenticated product surface or a curated view onto existing Worker chat? | Not decided | [[cto-worker]] |
| 5 | Is the proposed homepage hero/guiding-statement copy adopted as-is, or does it need [[content-production-worker]] revision first? | Not decided | [[marketing-manager-worker]] / [[content-production-worker]] |
| 6 | Should this document (or V1) be ratified via ADR once the above are resolved, so future workers don't have to re-derive its status? | Not decided | [[project-manager-worker]] |

## 8. Cross-references

- Full commerce store architecture: [[commerce-store-architecture-v1]].
- Existing built-state reference for the whole marketing/commerce site: [[frontend-architecture]] §A.
- Redesign boundary for the marketing site: ADR-001 in [[architecture-decisions]].
- UX evaluation order for any new screen (natural language → wizard → form): [[ux-vision]], ADR-012.
