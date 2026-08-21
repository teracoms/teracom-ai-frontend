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
app/(product)/
  layout.js                     product root layout (no marketing chrome)
  portal/                       the Teracom AI product portal
  customer-portal/              customer-facing portal
  auth/, customer-portal-auth/  auth flows
  portal-contact/               contact form
  api/                          backend proxy routes for the above
components/, lib/               shared UI/logic used by the product
```

## Shared design system

Visual styling (CSS custom properties, `.btn`/`.hero`/`.section`/etc. class
vocabulary) comes from the `@teracoms/ui` package, not a local
`globals.css`. See `../teracom-ui/README.md`. This repo expects
`teracom-ui` checked out as a sibling directory:

```text
teracom-ai/
  frontend/                    (this repo, teracom-ai-frontend)
  teracom-ui/
  teracom-solutions-website/
```

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
