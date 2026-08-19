import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';
process.env.INTERNAL_SERVICE_TOKEN = 'shared-service-secret';

const { linkLicenceBillingReference } = await import('../commerceLicensing.js');

let originalFetch;

before(() => {
  originalFetch = global.fetch;
});

after(() => {
  global.fetch = originalFetch;
});

test('linkLicenceBillingReference posts to the internal endpoint with the service token header', async () => {
  let seenUrl;
  let seenInit;
  global.fetch = async (url, init) => {
    seenUrl = url.toString();
    seenInit = init;
    return new Response(
      JSON.stringify({
        id: 'ref_1',
        licence_id: 'lic_1',
        external_billing_provider: 'stripe',
        external_customer_id: 'cus_1',
        external_subscription_id: 'sub_1',
        external_invoice_reference: null,
        created_at: '2026-08-19T00:00:00Z',
        updated_at: '2026-08-19T00:00:00Z',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const result = await linkLicenceBillingReference({
    licenceId: 'lic_1',
    externalBillingProvider: 'stripe',
    externalCustomerId: 'cus_1',
    externalSubscriptionId: 'sub_1',
  });

  assert.equal(seenUrl, 'https://backend.test/internal/licence-billing-references/link');
  assert.equal(seenInit.method, 'POST');
  assert.equal(seenInit.headers['X-Internal-Service-Token'], 'shared-service-secret');
  assert.deepEqual(JSON.parse(seenInit.body), {
    licence_id: 'lic_1',
    external_billing_provider: 'stripe',
    external_customer_id: 'cus_1',
    external_subscription_id: 'sub_1',
    external_invoice_reference: null,
  });
  assert.equal(result.id, 'ref_1');
});

test('linkLicenceBillingReference rejects when the backend responds with a non-2xx status', async () => {
  global.fetch = async () =>
    new Response(JSON.stringify({ detail: 'Licence not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });

  await assert.rejects(
    linkLicenceBillingReference({
      licenceId: 'unknown',
      externalBillingProvider: 'stripe',
      externalCustomerId: 'cus_2',
    }),
    (error) => error.status === 404
  );
});
