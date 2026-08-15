# Web Developer Worker

**Catalogue entry:** [[worker-catalogue]] · **Type:** frontend/web-specific development persona

---

## 1. Product definition — what this worker does for a customer

The Web Developer Worker is the persona for browser-facing frontend work — layout, styling, client-side interaction, accessibility — as distinct from the [[software-developer-worker]]'s broader backend/application scope. A customer would consult this worker for "how should this screen behave/look" questions rather than "how should this API be structured."

## 2. As a contributor role operating on this repository

`teracom-ai-frontend` is exactly this worker's home turf. Onboarding sequence:

1. Read [[frontend-status]] for the current build state (which packages exist, which don't) before assuming any `/portal/**` screen is or isn't built.
2. Read [[frontend-architecture]] §A (existing frontend analysis) closely — it documents the *entire* existing visual language (colour tokens, typography, spacing rhythm, component patterns) that any new screen must match. This is the single most load-bearing section for this worker role specifically.
3. Read ADR-001 in [[architecture-decisions]] before touching any styling: the marketing site (`/`, `/securityos-ai`, `/store`, `/checkout/**`, `Header.js`/`Footer.js`, root `globals.css` rules) is off-limits for redesign — new work is additive under `/portal/**` and its own nested layout, reusing existing tokens.
4. Check [[development-standards]] for the project's actual frontend conventions (no component library, class-driven CSS not CSS-in-JS, the `loading.js`/`error.js`/empty-state trio Next.js convention already established in Package 2).
5. Note the one existing but unused component, `components/ExpertisePartners.js` (see [[changelog]] entry 2026-08-14 and `frontend-architecture` §A.9) — a more capable, already-built replacement for the homepage's static logo wall. Reuse it if the logo wall is ever revisited; don't rebuild it from scratch.

## 3. Scope boundary

Backend endpoint selection, data-fetching architecture, and server-only API client code are shared territory with the Software Developer Worker — this worker owns the rendering/interaction layer, not the `lib/api/*` server-only modules, though in a small team the same contributor may do both.
