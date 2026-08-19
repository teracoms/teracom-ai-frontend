import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { findProduct } from '@/lib/products';
import { createZohoContact, createZohoInvoice, findZohoContactByEmail } from '@/lib/zoho';
import { linkLicenceBillingReference } from '@/lib/api/commerceLicensing';

export const runtime = 'nodejs';

// Commerce-to-Licensing Lifecycle Automation, Phase 1 (Wave 2 Workstream 5).
// Previously only checkout.session.completed was handled at all — every
// other Stripe event this endpoint received (invoice.paid on a subscription
// renewal, a failed payment, a subscription update/cancellation) was
// silently acknowledged with `{received: true}` and then simply dropped,
// with no Zoho sync and no record anywhere. That blindness is the bug this
// workstream fixes. Scope is deliberately narrow: sync each event's real
// outcome to Zoho where there is a natural action to take, and — only when
// a commerce event carries a known Teracom licenceId in Stripe metadata —
// best-effort link it to that Licence via linkLicenceBillingReference.
// Most purchases carry no licenceId at all today (see
// app/api/checkout/route.js), which is expected, not an error.

async function resolveSubscriptionMetadata(invoice) {
  // Since the 2022-11-15 Stripe API version, invoices embed a
  // subscription_details.metadata snapshot directly — avoids a second API
  // round trip in the common case. Falls back to fetching the Subscription
  // object only if that snapshot isn't present.
  if (invoice.subscription_details?.metadata) {
    return invoice.subscription_details.metadata;
  }

  if (!invoice.subscription) return {};

  try {
    const subscriptionId =
      typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription.metadata || {};
  } catch (error) {
    console.error('Unable to retrieve subscription metadata for invoice', invoice.id, error);
    return {};
  }
}

function customerIdOf(customer) {
  return typeof customer === 'string' ? customer : customer?.id;
}

async function linkIfKnownLicence({ licenceId, customerId, subscriptionId, invoiceReference }) {
  if (!licenceId || !customerId) return;

  try {
    await linkLicenceBillingReference({
      licenceId,
      externalBillingProvider: 'stripe',
      externalCustomerId: customerId,
      externalSubscriptionId: subscriptionId,
      externalInvoiceReference: invoiceReference,
    });
  } catch (error) {
    // Best-effort: a Teracom licence link failing to write must never
    // block the Zoho sync above, and must never cause this handler to
    // throw (which would make Stripe retry the whole webhook delivery).
    console.error('Failed to link licence billing reference', error);
  }
}

async function handleCheckoutSessionCompleted(session) {
  const product = findProduct(session.metadata?.productId);
  const email = session.customer_details?.email;

  if (product && email && process.env.ZOHO_REFRESH_TOKEN) {
    try {
      const contact = await createZohoContact({ contactName: session.customer_details?.name || email, email });
      const customerId = contact?.contact?.contact_id || contact?.contact_id;

      if (customerId) {
        await createZohoInvoice({
          customerId,
          referenceNumber: session.id,
          lineItems: [
            { name: product.name, description: product.description, rate: product.priceCents / 100, quantity: 1 },
          ],
        });
      }
    } catch (error) {
      console.error('Zoho sync failed', error);
    }
  }

  await linkIfKnownLicence({
    licenceId: session.metadata?.licenceId,
    customerId: customerIdOf(session.customer),
    subscriptionId: customerIdOf(session.subscription),
    invoiceReference: session.id,
  });
}

async function handleInvoicePaid(invoice) {
  // Only the recurring-renewal case is new here — the very first invoice on
  // a subscription checkout is already synced to Zoho above via
  // checkout.session.completed; re-syncing it here would double it in Zoho.
  if (invoice.billing_reason !== 'subscription_cycle') return;

  const metadata = await resolveSubscriptionMetadata(invoice);
  const product = findProduct(metadata.productId);
  const email = invoice.customer_email;

  if (product && email && process.env.ZOHO_REFRESH_TOKEN) {
    try {
      const existingContact = await findZohoContactByEmail(email);
      const contact = existingContact || (await createZohoContact({ contactName: email, email }));
      const customerId = contact?.contact_id || contact?.contact?.contact_id;

      if (customerId) {
        await createZohoInvoice({
          customerId,
          referenceNumber: invoice.id,
          lineItems: [
            {
              name: `${product.name} — renewal`,
              description: product.description,
              rate: invoice.amount_paid / 100,
              quantity: 1,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Zoho renewal invoice sync failed', error);
    }
  }

  await linkIfKnownLicence({
    licenceId: metadata.licenceId,
    customerId: customerIdOf(invoice.customer),
    subscriptionId: customerIdOf(invoice.subscription),
    invoiceReference: invoice.id,
  });
}

async function handleInvoicePaymentFailed(invoice) {
  // No automated dunning/notification flow exists yet — out of Phase 1's
  // scope (WAVE2_IMPLEMENTATION_PLAN.md §5). Logged clearly so this event
  // is no longer silently dropped, which is the concrete blindness bug
  // this workstream exists to fix for this event type.
  console.error('Stripe invoice payment failed', {
    invoiceId: invoice.id,
    customerEmail: invoice.customer_email,
    subscriptionId: customerIdOf(invoice.subscription),
    attemptCount: invoice.attempt_count,
  });
}

async function handleSubscriptionUpdated(subscription) {
  console.info('Stripe subscription updated', {
    subscriptionId: subscription.id,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  await linkIfKnownLicence({
    licenceId: subscription.metadata?.licenceId,
    customerId: customerIdOf(subscription.customer),
    subscriptionId: subscription.id,
  });
}

async function handleSubscriptionDeleted(subscription) {
  console.info('Stripe subscription cancelled', {
    subscriptionId: subscription.id,
    customerId: customerIdOf(subscription.customer),
  });
}

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook signature or secret' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Invalid webhook' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
