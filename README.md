# Teracom AI Frontend

The Teracom AI product application — the portal where organisations manage
AI workers, knowledge, tasks, and governance.

Per `Website_Application_Separation_Plan_V1.md` (Website/Application
Separation, Phase 4), the Teracom Solutions marketing/commerce website has
moved to its own repository, `teracom-solutions-website`. This repo now
carries only the product application.

## Included

- Portal: workers, knowledge, tasks, projects, governance, reporting,
  organisations, users
- Customer portal
- Auth (`/auth`, `/customer-portal-auth`)
- `/portal-contact`

## Repository layout

```text
app/
  globals.css                   this app's own design tokens/component classes
  (product)/
    layout.js                   product root layout (no marketing chrome)
    portal/                     the Teracom AI product portal
    customer-portal/            customer-facing portal
    auth/, customer-portal-auth/ auth flows
    portal-contact/             contact form
    api/                        backend proxy routes for the above
components/, lib/               shared UI/logic used by the product
```

## Design system

Visual styling (CSS custom properties, `.btn`/`.hero`/`.section`/`.portal-*`
etc. class vocabulary) lives entirely in this repo's own `app/globals.css`.
Per `UI_DECOUPLING_PLAN_V1.md` (2026-08-22), the former shared `@teracoms/ui`
package has been dissolved: this app no longer has any cross-repository
dependency, and can be built and deployed — including at a customer site —
without checking out any other repository. Edit `app/globals.css` directly
for any visual change; there is no longer a second file or repository to
keep in sync.

## Environment variables

See `.env.example` — `NEXT_PUBLIC_SITE_URL` and `BACKEND_API_URL`. This
app no longer needs Stripe, Zoho, or admin-import credentials; those moved
to `teracom-solutions-website` with the commerce/lead-capture routes that
used them.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```
