# Development Standards

**Applies to:** `teracom-ai-frontend`. Derived from the conventions actually established across the codebase and the two shipped packages — this document describes what the project already does, so new work stays consistent, not an aspirational style guide. See [[frontend-architecture]] for the design rationale and [[architecture-decisions]] for the specific ADRs these standards enforce.

---

## 1. Language and tooling

- Plain JavaScript with JSX (`.js` files, `allowJs: true`, `strict: false`). `tsconfig.json`/`typescript` exist but are unused artifacts of `next build`'s auto-management — do not start converting files to `.ts`/`.tsx` without a deliberate, recorded decision (this would be a project-wide change, not an incidental one).
- `"type": "module"` in `package.json` — all files use ESM `import`/`export`, never `require()`.
- Lint: `npm run lint` (`eslint-config-next`) must pass with zero warnings before any package is considered done.
- Test: `npm test` (`node --test`, zero additional test-framework dependencies) must pass. Tests target pure logic (validation, JWT decoding, fetch wrappers via mocked `global.fetch`) — code requiring the Next.js request runtime (e.g. `next/headers` cookie access) is validated via end-to-end smoke test instead, not mocked.
- Build: `npm run build` must succeed from a clean state (`rm -rf .next`, fresh `npm install`) before a package is done.

## 2. Styling

- One global stylesheet, `app/globals.css`, using CSS custom properties (`--bg`, `--panel`, `--text`, `--muted`, `--line`, `--red`, `--red2`, `--shadow`, etc.). No CSS-in-JS, no component library, no CSS Modules.
- New screens must reuse existing tokens and class families (`.section`, `.container`, `.btn`/`.btn-primary`/`.btn-secondary`, `.eyebrow`, card patterns, `.badge`) before introducing a new one. When Package 1 and 2 needed new classes (`.auth-card`, `.form-error`, `.stat-tile`, `.skeleton`, etc.), they were built from the existing token set, additively — that's the standard: additive, token-derived, never a parallel design system.
- The marketing site (`/`, `/securityos-ai`, `/store`, `/checkout/**`, `Header.js`/`Footer.js`) is off-limits for redesign (ADR-001). `/portal/**` gets its own nested layout/chrome.

## 3. Data fetching and the API layer

- Server-first: backend calls happen in Server Components, Route Handlers, or Server Actions — never directly from client-side `fetch` (ADR-002).
- `lib/api/client.js` is the one server-only fetch wrapper (`backendFetch`/`ApiError`); every domain module (`lib/api/{auth,dashboard,...}.js`) is a thin, purpose-built set of functions on top of it — one function per backend endpoint actually used, not a generic REST client.
- `BACKEND_API_URL` is server-only, never `NEXT_PUBLIC_`-prefixed.
- When a page makes more than one independent backend call, use `Promise.allSettled` plus `lib/api/results.js`'s `settle()`/`errorMessage()`/`isForbidden()` helpers so one failing call doesn't take down unrelated sections (ADR-008) — don't write a new bespoke try/catch pattern for this.
- Before wiring a new screen to a backend aggregate/summary endpoint, check [[architecture-decisions]] (ADR-007) for whether an equivalent is already designated canonical — don't add a second caller of the same data shape.

## 4. Page-level conventions

- Every new async Server Component page should have its own `loading.js` (Next.js Suspense convention, e.g. skeleton stat tiles) and `error.js` (safety-net boundary with `reset()`), following the pattern established in Package 2's dashboard.
- Distinguish three states explicitly, not just "loading" vs. "error": loading, error (with `ApiError.status === 0` meaning "can't reach the backend" vs. a real backend error response), and empty (the request succeeded, there's just nothing to show — use `components/portal/EmptyState.js`).

## 5. Environment variables

- Documented in `.env.example` at the repo root, following its existing comment style (a one-line purpose comment above each variable or group).
- Server-only secrets never get a `NEXT_PUBLIC_` prefix.

## 6. Dependency changes

- Version bumps and new dependencies should be justified in the relevant package's implementation report (see [[documentation-standards]] for the required report shape), especially security-motivated ones — e.g. the Next.js `14.2.15` → `14.2.35` patch was taken specifically to fix a middleware-bypass CVE relevant to newly-shipped middleware, and explicitly did *not* take the larger breaking `next@16` upgrade `npm audit fix --force` would have applied, since that's out of scope for a single package.

## 7. What "done" means for a package

Per the pattern both shipped packages established: build passes, lint passes, unit tests pass, **and** an end-to-end smoke test against a live backend instance covering the actual auth/data states involved (e.g. logged-out, logged-in, admin vs. non-admin, rate-limited) — with any test data created for the smoke test deleted afterward, not left behind. See [[qa-worker]] for who is responsible for confirming this before a package is marked complete in [[project-state]].
