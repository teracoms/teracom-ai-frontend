import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.ZOHO_ACCOUNTS_BASE_URL = 'https://accounts.zoho.test';
process.env.ZOHO_BOOKS_BASE_URL = 'https://books.zoho.test';
process.env.ZOHO_ORGANIZATION_ID = 'org_123';
process.env.ZOHO_REFRESH_TOKEN = 'refresh_token';
process.env.ZOHO_CLIENT_ID = 'client_id';
process.env.ZOHO_CLIENT_SECRET = 'client_secret';

const { findZohoContactByEmail, createZohoContact, createZohoInvoice } = await import('../zoho.js');

let originalFetch;

before(() => {
  originalFetch = global.fetch;
});

after(() => {
  global.fetch = originalFetch;
});

function mockTokenThen(handler) {
  let call = 0;
  global.fetch = async (url, init) => {
    call += 1;
    if (call === 1) {
      assert.ok(url.toString().startsWith('https://accounts.zoho.test/oauth/v2/token'));
      return new Response(JSON.stringify({ access_token: 'access-token-abc' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return handler(url, init);
  };
}

test('findZohoContactByEmail returns the first matching contact', async () => {
  mockTokenThen(async (url) => {
    assert.equal(
      url.toString(),
      'https://books.zoho.test/contacts?email=renewal%40example.com&organization_id=org_123'
    );
    return new Response(JSON.stringify({ contacts: [{ contact_id: 'contact_1' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  const contact = await findZohoContactByEmail('renewal@example.com');
  assert.deepEqual(contact, { contact_id: 'contact_1' });
});

test('findZohoContactByEmail returns null when there is no match', async () => {
  mockTokenThen(async () => new Response(JSON.stringify({ contacts: [] }), { status: 200 }));

  const contact = await findZohoContactByEmail('nobody@example.com');
  assert.equal(contact, null);
});

test('createZohoContact sends the expected payload', async () => {
  let seenBody;
  mockTokenThen(async (url, init) => {
    seenBody = JSON.parse(init.body);
    assert.equal(url.toString(), 'https://books.zoho.test/contacts?organization_id=org_123');
    return new Response(JSON.stringify({ contact: { contact_id: 'contact_2' } }), { status: 200 });
  });

  await createZohoContact({ contactName: 'Jane Doe', email: 'jane@example.com' });
  assert.deepEqual(seenBody, {
    contact_name: 'Jane Doe',
    contact_persons: [{ email: 'jane@example.com', first_name: 'Jane Doe' }],
  });
});

test('createZohoInvoice sends the expected payload', async () => {
  let seenBody;
  mockTokenThen(async (url, init) => {
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ invoice: { invoice_id: 'inv_1' } }), { status: 200 });
  });

  await createZohoInvoice({
    customerId: 'contact_2',
    referenceNumber: 'in_renewal_1',
    lineItems: [{ name: 'SecurityOS Starter — renewal', rate: 49, quantity: 1 }],
  });

  assert.deepEqual(seenBody, {
    customer_id: 'contact_2',
    reference_number: 'in_renewal_1',
    line_items: [{ name: 'SecurityOS Starter — renewal', rate: 49, quantity: 1 }],
  });
});
