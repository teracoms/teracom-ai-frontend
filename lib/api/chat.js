// Server-only chat data access, per FRONTEND_ARCHITECTURE_V1.md §C.9.
//
// IMPORTANT — verified directly against teracom-ai-backend source
// (api/chat.py, services/chat_persistence_service.py,
// services/chat_session_service.py), not assumed from the architecture doc:
// POST /chat/ creates a BRAND NEW ChatSession on every single call
// (services/chat_persistence_service.py#persist_chat calls create_session()
// unconditionally) and its response (schemas/chat.py#ChatResponse) is
// `{response: str}` only — it never returns that new session's id. There is
// no way to send a second message into a specific existing session; the
// `session_id` created by POST /chat-sessions/{worker_id} is entirely
// separate from whatever session POST /chat/ silently creates for a given
// exchange. See CHAT_IMPLEMENTATION_REPORT.md §2 for the full implications
// this has for what "conversation history" and "session management" can
// honestly mean in this UI.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/chat.js must only be used on the server.');
}

import { backendFetch } from './client.js';

/**
 * Single blocking request/response — services/ollama_service.py hardcodes
 * `"stream": False` in its call to Ollama, so there is no token-by-token
 * streaming to consume here (confirmed from source, not assumed). Callers
 * show a loading/typing indicator for the duration of this call, not a
 * progressive render.
 */
export async function sendChatMessage(token, workerId, message) {
  return backendFetch('/chat/', {
    method: 'POST',
    token,
    body: { worker_id: workerId, message },
  });
}

// Creates a new, empty ChatSession (title "New Conversation") and returns it
// with a real id — the only way this app can obtain a session id at all,
// since sendChatMessage() above never surfaces the id of the session it
// creates internally.
export async function createChatSession(token, workerId) {
  return backendFetch(`/chat-sessions/${workerId}`, { method: 'POST', token });
}

export async function fetchSessionMessages(token, sessionId) {
  return backendFetch(`/chat-sessions/${sessionId}`, { token });
}

// PROJ001 -- the real listing endpoint that never existed before this
// workstream: every draft/project/persona conversation the calling
// user can resume, most-recently-active first.
export async function fetchMyChatSessions(token) {
  return backendFetch('/chat-sessions/mine', { token });
}

export async function fetchConversationSummary(token, sessionId) {
  return backendFetch(`/conversation-summary/${sessionId}`, { token });
}
