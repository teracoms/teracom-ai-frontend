# Chat Implementation Report — Frontend Package 5

**Scope:** Package 5 — Chat only, per `FRONTEND_ARCHITECTURE_V1.md` §C.9.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance (including a real Ollama completion, not mocked) as both an admin and a non-admin (`member`) user.
**Depends on:** Package 1 (Authentication), Package 2 (Dashboard), Package 3 (Workers), Package 4 (Knowledge) — the session cookie, `getSessionToken()`, `AuthProvider`, `PortalNav`, `StatTile`, `EmptyState`, `settle`/`errorMessage`, the BFF-proxy pattern, and `lib/api/workers.js`'s `fetchWorkerList`/`fetchWorkerSummary` are all reused as-is, unchanged.
**Out of scope (unchanged, not implemented):** Memory (standalone cross-worker browser), Administration, Billing & Licensing.

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/portal/chat` | Worker picker — lists workers, each linking into a live chat |
| `/portal/chat/:workerId` | Live chat — composer + in-page thread, plus a "start a tracked session" affordance |
| `/portal/chat/:workerId/:sessionId` | Read-only session detail — messages + summary for a known session id |
| `POST /api/portal/chat` | Same-origin BFF proxy → `POST /chat/` (send a message) |
| `POST /api/portal/chat/:workerId/sessions` | Same-origin BFF proxy → `POST /chat-sessions/{workerId}` (create an empty tracked session) |

This matches the three routes §C.3 lists for Chat (`/portal/chat`, `/portal/chat/:workerId/:sessionId`, plus the send/create actions) — but see §2 for why the *content* of the session-detail route differs materially from what §C.9's prose implies a "live chat, resumable across page loads" would look like.

---

## 2. The central finding: `POST /chat/` cannot be resumed, and this reshapes the whole package

Before writing any code, the actual backend source was read directly (as it was for Package 4) rather than trusting `FRONTEND_ARCHITECTURE_V1.md` §C.9's description alone: `api/chat.py`, `api/chat_sessions.py`, `api/conversation_summary.py`, `services/chat_persistence_service.py`, `services/chat_session_service.py`, and their Pydantic schemas. This surfaced a fact §C.9 does not state and that fundamentally changes what "conversation history" and "session management" can honestly mean in this UI:

**`POST /chat/` creates a brand-new `ChatSession` on *every single call*, and its response never includes that session's id.**

- `services/chat_persistence_service.py#persist_chat()` calls `create_session(worker_id, user_id, db, title=user_message)` **unconditionally** on every message — there is no "find the existing session for this worker+user and append to it" logic anywhere in the codebase. Confirmed live: sending one message to a worker, then querying the database directly, showed a session titled with the message text itself, containing exactly the one user+assistant message pair — a fresh session every time, not a growing thread.
- `schemas/chat.py#ChatResponse` is `{response: str}` only. `ChatRequest` is `{worker_id, message}` — there is no `session_id` field on either side. The frontend cannot request a specific session be used, and cannot learn which session a given exchange landed in.
- `POST /chat-sessions/{worker_id}` (the *other* session-related endpoint) creates its own, completely independent empty session (title "New Conversation", zero messages) and returns a real id — but nothing in the backend ever writes a chat message into a session created this way, because `POST /chat/` never accepts or looks up an existing session.

§C.9's own text already flags there's "no list sessions for a worker" endpoint and treats that as the reason a full per-worker history browser isn't buildable. What it doesn't say — and what only reading the actual `chat_persistence_service.py` source revealed — is that even a *single* conversation's session id is unobtainable through the endpoint that actually talks to the LLM. This is a materially bigger gap than "can't list old conversations"; it's "can't identify *any* conversation you just had," including the one you're actively having.

**Design response, reflected directly in the code and UI copy (not hidden or worked around):**

1. **Live chat is client-side-only, per-page-load state.** `ChatInterface`/`ChatComposer` accumulate a thread in React state as the user sends messages via `POST /chat/`, and each turn is genuinely persisted server-side (in its own, otherwise-unreachable session) — but a page refresh starts a new, empty thread, because there is nothing this app could fetch to restore it. This is stated explicitly in `lib/api/chat.js`'s and `ChatInterface.js`'s own comments, not left as a silent limitation someone has to discover.
2. **"Session management" is built as a real, working, but deliberately separate capability.** `ChatSessionStarter` calls `POST /chat-sessions/{workerId}` to obtain an actual session id and routes to `/portal/chat/:workerId/:sessionId`, which genuinely exercises `GET /chat-sessions/{sessionId}` and `GET /conversation-summary/{sessionId}` — this is real, tested, working code against real endpoints, not a stub. The in-UI copy is upfront that a session created this way starts (and, from this app, stays) empty, since nothing wires the live composer's messages into it.
3. **No dishonest bridging was attempted.** It would be possible to, e.g., call `POST /chat-sessions/{worker_id}` immediately before or after every `POST /chat/` call and *pretend* the two are linked — but they would not actually be the same database row, and displaying that connection would misrepresent real data. This was deliberately not done, in the same spirit as Package 4 not inventing a redirect target it couldn't correctly back.

Verified live (§8) that both halves work exactly as described: the live composer produces a real, correct LLM response reflecting the worker's own configured instructions; a tracked session created via the starter button is empty; and — checked directly against the database, something the app itself cannot do — the session `POST /chat/` silently created did contain the real two-message exchange, proving the mechanism is exactly as documented, not a guess.

---

## 3. Chat interface, worker selection (requirements #1, #3)

- `/portal/chat` lists every worker (`fetchWorkerList`, reused from Package 3) as `ChatWorkerCard`s — same visual shape as `WorkerCard`/`KnowledgeCard`, differing only in destination (`/portal/chat/:workerId`) and CTA copy ("Start Chatting").
- `/portal/chat/:workerId` fetches `fetchWorkerSummary` (reused from Package 3) for the worker's name/role/status and, as a nice real touch that costs nothing extra, shows how many knowledge documents and remembered facts that worker draws on (`knowledge_count`/`memory_count`, already returned by that same call) — grounding the chat in what the worker can actually see, not just its name.
- `ChatComposer` posts to `POST /api/portal/chat` and, on success, appends both the user's own message and the assistant's reply to the thread via a shared `onMessage` callback — the user's message is echoed immediately (not held back until the response arrives), consistent with `CheckoutButton.js`'s established minimal-loading-state precedent.

---

## 4. Conversation history and session management (requirements #2, #4)

Given §2, this is deliberately split:

- **Live thread** (`ChatInterface`/`ChatThread`) — the current page's accumulated messages, in-memory only.
- **Tracked session detail** (`/portal/chat/:workerId/:sessionId`) — server-rendered from `GET /chat-sessions/{sessionId}` (mapped into the same `{id, role, content}` shape `ChatThread` already expects, so one presentational component serves both the live and the read-only view) and `GET /conversation-summary/{sessionId}` (shown as a `StatTile` message count — the `summary` field itself is just the same messages newline-joined, per `services/conversation_summary_service.py`, so no separate "summary text" block was added beyond what the message list already shows more usefully).
- Both `/portal/chat/:workerId` and `/portal/chat/:workerId/:sessionId` collapse a 404/403 on their primary fetch into the same "not found" message, the same precedent every prior package's detail page established, so a cross-tenant id can't be distinguished from a nonexistent one.

---

## 5. Message streaming (requirement #5) — confirmed absent, not assumed

`services/ollama_service.py#generate_response()` calls Ollama with `"stream": False` hardcoded in the request body — read directly from source, not inferred. `POST /chat/` is therefore a single blocking HTTP request/response with no SSE, WebSocket, or chunked-transfer path anywhere in the backend. `ChatComposer` is built around this reality: the send button disables and shows "Assistant is typing..." for the duration of the request (verified live at ~12 seconds for a real completion, §8), and the reply appears in the thread all at once when the response resolves — there is no partial/progressive render to build, because the backend never produces one.

---

## 6. Loading, empty, and error states (requirements #6–#8)

| State | Mechanism |
|---|---|
| **Loading** | `loading.js` for all three routes — the same skeleton-tile Suspense-fallback convention every prior package established. |
| **Loading (in-flight message)** | `ChatComposer`'s "Assistant is typing..." indicator, the substitute for a token stream (§5). |
| **Error (send failure)** | `ChatComposer` surfaces a `.form-error` banner and leaves the user's own message in the thread (it was genuinely sent and, per §2, even persisted server-side in its own session) rather than rolling it back, since the failure is in getting *a reply*, not in whether the message itself went anywhere. |
| **Error (session-start failure)** | `ChatSessionStarter` surfaces its own `.form-error` banner independently of the composer. |
| **Error (whole-page, not-found)** | Both `/portal/chat/:workerId` and the session-detail page collapse 404/403 into one "not found" message (§4). |
| **Error (safety net)** | `error.js` for all three routes, same `reset()`-button pattern as every prior package. |
| **Empty (no workers at all)** | `EmptyState` on `/portal/chat`, prompting worker creation first. |
| **Empty (no messages yet, live chat)** | `EmptyState` inside `ChatThread` before the first message is sent. |
| **Empty (tracked session has no messages)** | `EmptyState` inside `ChatThread` on the session-detail page, with copy that explains *why* (§2) rather than presenting it as a mysteriously blank page. |

---

## 7. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, 29 routes (including /portal/chat,
                     /portal/chat/[workerId], /portal/chat/[workerId]/[sessionId],
                     and the two new /api/portal/chat* proxy routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 66, pass 66, fail 0
```

### Unit tests (66 total; 7 new for this package)

New this package: `lib/api/chat.js` (4 functions — `sendChatMessage`, `createChatSession`, `fetchSessionMessages`, `fetchConversationSummary`) and `lib/api/validation.js#parseChatMessage`, all in the same mocked-`global.fetch` style as every prior package's lib tests. All 59 tests from Packages 1–4 pass unchanged. No changes were needed to `lib/api/client.js` this package — Chat's request/response shapes are plain JSON, simpler than Knowledge's multipart upload.

### End-to-end smoke test (real backend, real Ollama — not mocked)

`teracom-ai-backend` was started locally against the existing Postgres instance, with the already-running local Ollama service (models `llama3`/`llama3.1` present, matching the backend's configured default). A temporary organisation, two temporary users (`admin`, `member`), and one temporary worker were created for this test and fully deleted again afterward, along with every chat session/message the test itself generated.

| Check | Result |
|---|---|
| `GET /portal/chat`, `/:workerId`, `/:workerId/:sessionId` with no session | `307` → `/portal/login?next=...`, preserved for all three including the two-level-deep route |
| Admin → `GET /portal/chat` | `200`; worker picker shows the created worker with a working "Start Chatting" link |
| Admin → `GET /portal/chat/:workerId` | `200`; worker name/role/status header, "drawing on 0 knowledge documents and 0 remembered facts," empty-thread state, composer, and the tracked-session starter all render |
| Admin → `POST /api/portal/chat` (real message, via curl — same shape `ChatComposer` sends) | `200` after ~12s; a real, coherent Ollama completion that correctly reflected the worker's own configured instructions ("I'll also provide pricing insights..." — the worker's instructions literally said to mention pricing when relevant) |
| Admin → `POST /api/portal/chat/:workerId/sessions` | `200`; `{"session": {"id": ..., "title": "New Conversation", ...}}` |
| Admin → `GET /portal/chat/:workerId/:trackedSessionId` | `200`; "No messages in this session yet," with the explanatory copy from §2 |
| **Verified directly against Postgres** (something this app itself cannot do) | Two independent `chat_sessions` rows existed for the one worker: the tracked one (0 messages) and a second, auto-created one titled with the literal message text, containing exactly 2 messages (user + assistant) — proving §2's mechanism precisely, not just asserting it |
| Admin → `GET /portal/chat/:workerId/:realSessionIdFromTheDatabase` | `200`; both the user and assistant messages rendered correctly with the right role styling — proving the session-detail page works correctly for a *populated* session, not only the empty path |
| `GET /portal/chat/:bogus-worker-uuid` | `200`; "Worker not found," not a crash |
| `GET /portal/chat/:workerId/:bogus-session-uuid` | `200`; "Session not found," not a crash |
| Member (non-admin) → `GET /portal/chat/:workerId` | `200`; identical experience to admin — `POST /chat/` and `POST /chat-sessions/{id}` carry no role check at all (only `get_current_user` + ownership), so this page is correctly not gated |
| `POST /api/portal/chat` with a blank/whitespace-only message | `400 {"error": "A worker and a message are both required."}` — rejected before reaching the backend |

---

## 8. Files changed

### New files

```
lib/api/chat.js                                           sendChatMessage / createChatSession /
                                                           fetchSessionMessages / fetchConversationSummary
lib/api/__tests__/chat.test.js                            unit tests (mocks global.fetch)

app/api/portal/chat/route.js                              POST → sendChatMessage() BFF proxy
app/api/portal/chat/[workerId]/sessions/route.js           POST → createChatSession() BFF proxy

app/portal/(protected)/chat/page.js                        worker picker (Server Component)
app/portal/(protected)/chat/loading.js                      Suspense fallback
app/portal/(protected)/chat/error.js                        error boundary safety net
app/portal/(protected)/chat/[workerId]/page.js               live chat page (Server Component wrapper)
app/portal/(protected)/chat/[workerId]/loading.js             Suspense fallback
app/portal/(protected)/chat/[workerId]/error.js               error boundary safety net
app/portal/(protected)/chat/[workerId]/[sessionId]/page.js     session detail (Server Component)
app/portal/(protected)/chat/[workerId]/[sessionId]/loading.js  Suspense fallback
app/portal/(protected)/chat/[workerId]/[sessionId]/error.js    error boundary safety net

components/portal/ChatWorkerCard.js                        worker picker card (mirrors WorkerCard.js)
components/portal/ChatThread.js                             shared presentational message list (live + read-only)
components/portal/ChatComposer.js                           send-message form + loading/typing state
components/portal/ChatSessionStarter.js                     "start a tracked session" button
components/portal/ChatInterface.js                           client wrapper owning the live thread state

docs/frontend/IMPLEMENTATION_REPORTS/CHAT_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/validation.js` | Added `parseChatMessage` | Rejects a blank message/worker_id before it reaches the backend, same dependency-free/testable style as `parseSearchQuery`/`parseWorkerPayload` |
| `components/portal/PortalNav.js` | Added a "Chat" link; comment updated to note Chat is the third section (after Workers, Knowledge) with nested routes | Requirement #9 |
| `app/portal/(protected)/page.js` | Chat placeholder card now links to `/portal/chat`; hero copy updated to say Chat is ready, not "being rolled out" | Requirement #9, same treatment every prior package gave its own card |
| `app/globals.css` | +13 lines, additive only | New `.chat-thread`, `.chat-message{,-user,-assistant,-role,-content}`, `.chat-composer`, `.chat-typing-indicator`, `.chat-session-starter` classes, all built from the existing token set (message "bubbles" differentiated by alignment and a subtle red tint for the user's own messages, not a new colour). No existing rule was changed. |

No file from Packages 1–4 was changed in behaviour — `lib/api/auth.js`, `lib/api/client.js`, `middleware.js`, `app/portal/(protected)/layout.js`, `AuthProvider`, `StatTile`, `EmptyState`, `lib/api/results.js`, `lib/api/workers.js`, and every Workers/Knowledge component are all reused exactly as they were.

---

## 9. Remaining risks / follow-ups

1. **The core finding from §2 is a backend gap, not a frontend one, but it's the largest limitation in this package.** For Chat to genuinely support "send a message, come back later, see the same conversation," `POST /chat/` would need to accept an optional `session_id` and reuse it instead of always calling `create_session()`, and `ChatResponse` would need to return that session's id. Until then, this frontend's honest ceiling is: live, working chat within one page view, plus a separately-working (but disconnected) session-detail viewer. This should be raised with whoever owns the backend repo as the single highest-value fix for this package's user experience.
2. **No streaming exists backend-side** (§5) — acceptable for V1 UX (a loading indicator, ~12s observed for a real completion), consistent with §D's standing note that this is worth a backend roadmap item once response times or user volume make blocking waits noticeable.
3. **`process_memory_capture` runs silently on every `POST /chat/` call** (keyword-triggered auto-memory) — per §C.9, this frontend does not attempt to reflect or toast this, since doing so reliably would need a backend response-shape addition that doesn't exist. Out of scope for Package 5 regardless (Memory is Package 6).
4. **No pagination on `GET /chat-sessions/{sessionId}`** — same standing §B.5.7 gap every prior package has carried; not a concern yet since a session created via `POST /chat/` only ever holds exactly two messages.
5. **All risks carried over from Packages 1–4 remain unchanged** (no CORS middleware on the backend, no refresh token, the `DELETE /documents/{id}` FK-violation bug from Package 4, no worker-update endpoint, etc.) — see the Authentication, Dashboard, Workers, and Knowledge reports. None are specific to or worsened by this package.

None of the above block Package 6 (Memory) from starting — `ChatThread`'s `{id, role, content}` normalisation is a reusable pattern if Memory ever needs to render a similar list shape, and the "verify the real backend source before trusting the architecture doc's prose" discipline this package and Package 4 both applied is worth carrying into Memory too, given `services/auto_memory_service.py`'s keyword-triggered capture logic hasn't been read in detail by any package yet.
