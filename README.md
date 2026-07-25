# Teracom Commerce Platform V3

This is the premium Teracom Solutions website rebuilt as a Vercel-ready Next.js application with the business engine underneath it.

## Included

- Premium Teracom homepage design
- SecurityOS AI product page
- Teracom Store page with products and plans
- Customer Portal placeholder
- Stripe Checkout API route
- Stripe webhook route
- Zoho Books helper integration foundation
- Supplier CSV / JSON / XML feed parser
- Admin feed import API route
- Lead capture API route
- Sitemap and robots routes

## Deploy

Vercel root directory should remain:

```text
teracom-commerce-platform
```

## Environment variables to add later

```text
NEXT_PUBLIC_SITE_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ZOHO_CLIENT_ID
ZOHO_CLIENT_SECRET
ZOHO_REFRESH_TOKEN
ZOHO_ORGANIZATION_ID
ADMIN_IMPORT_TOKEN
```

## Notes

Stripe and Zoho routes are built but require live credentials before taking real payments or creating invoices.
