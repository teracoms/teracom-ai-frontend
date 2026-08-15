import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  sendChatMessage,
  createChatSession,
  fetchSessionMessages,
  fetchConversationSummary,
} = await import('../chat.js');

let originalFetch;

before(() => {
  originalFetch = global.fetch;
});

after(() => {
  global.fetch = originalFetch;
});

function mockFetch(handler) {
  global.fetch = async (url, init) => handler(url, init);
}

test('sendChatMessage POSTs {worker_id, message} to /chat/ and returns the response text', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ response: 'Hello, how can I help?' }), { status: 200 });
  });

  const data = await sendChatMessage('tok', 'w1', 'Hi there');

  assert.equal(seenUrl, 'https://backend.test/chat/');
  assert.equal(seenMethod, 'POST');
  assert.deepEqual(seenBody, { worker_id: 'w1', message: 'Hi there' });
  assert.deepEqual(data, { response: 'Hello, how can I help?' });
});

test('createChatSession POSTs /chat-sessions/{workerId} with no body', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = init.body;
    return new Response(
      JSON.stringify({ id: 's1', worker_id: 'w1', user_id: 'u1', title: 'New Conversation' }),
      { status: 200 }
    );
  });

  const data = await createChatSession('tok', 'w1');

  assert.equal(seenUrl, 'https://backend.test/chat-sessions/w1');
  assert.equal(seenMethod, 'POST');
  assert.equal(seenBody, undefined);
  assert.deepEqual(data, { id: 's1', worker_id: 'w1', user_id: 'u1', title: 'New Conversation' });
});

test('fetchSessionMessages calls GET /chat-sessions/{sessionId}', async () => {
  let seenUrl;
  let seenHeaders;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenHeaders = init.headers;
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchSessionMessages('tok', 's1');

  assert.equal(seenUrl, 'https://backend.test/chat-sessions/s1');
  assert.equal(seenHeaders.Authorization, 'Bearer tok');
});

test('fetchConversationSummary calls GET /conversation-summary/{sessionId}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(
      JSON.stringify({ session_id: 's1', message_count: 0, summary: '' }),
      { status: 200 }
    );
  });

  const data = await fetchConversationSummary('tok', 's1');

  assert.equal(seenUrl, 'https://backend.test/conversation-summary/s1');
  assert.deepEqual(data, { session_id: 's1', message_count: 0, summary: '' });
});
