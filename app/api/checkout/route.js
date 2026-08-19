import { NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { findProduct } from '@/lib/products';

const CheckoutRequest = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
  // Commerce-to-Licensing Lifecycle Automation, Phase 1 (Wave 2
  // Workstream 5) — identity-linking groundwork only, not exposed in the
  // public storefront UI yet (no real Teracom SaaS tier is wired to a
  // real Stripe product; that pricing decision is still open). When a
  // future caller does know which Teracom Licence a purchase is for,
  // passing it here lets app/api/webhooks/stripe/route.js later write a
  // real LicenceBillingReference; omitted for every ordinary storefront
  // checkout today.
  licenceId: z.string().optional(),
});

export async function POST(req) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const parsed = CheckoutRequest.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid checkout request' }, { status: 400 });
  }

  const product = findProduct(parsed.data.productId);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const isSubscription = product.type === 'subscription';

  const metadata = {
    productId: product.id,
    sku: product.sku,
    productType: product.type,
    ...(parsed.data.licenceId ? { licenceId: parsed.data.licenceId } : {}),
  };

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    line_items: [
      {
        price_data: {
          currency: 'aud',
          product_data: {
            name: product.name,
            description: product.description,
            metadata: { sku: product.sku, productType: product.type },
          },
          unit_amount: product.priceCents,
          ...(isSubscription ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: parsed.data.quantity,
      },
    ],
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
    metadata,
    // A Checkout Session's own metadata does NOT propagate onto the
    // Subscription object it creates — only subscription_data.metadata
    // does. Without this, later customer.subscription.updated/deleted
    // and invoice.paid renewal webhook events would have no way to see
    // licenceId at all (see app/api/webhooks/stripe/route.js).
    ...(isSubscription ? { subscription_data: { metadata } } : {}),
  });

  return NextResponse.json({ url: session.url });
}
