// Server-only Orchestrator conversation access, per
// ORCHESTRATOR_CHAT_IMPLEMENTATION_V1 -- wraps teracom-ai-backend's
// api/orchestrator.py (a real, working conversational engine, distinct
// from POST /chat/'s existing knowledge-QA endpoint).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/orchestrator.js must only be used on the server.');
}

import { backendFetch } from './client.js';

// Pre-project, ephemeral -- caller supplies the running history each call.
// `isVoice` (VOICE_AND_FEDERATION_REMEDIATION_V1) marks a turn that
// originated as a transcribed voice utterance rather than typed text --
// forwarded as-is to the backend's own is_voice field.
export async function converseWithOrchestrator(token, { workerId, message, history, sessionId, isVoice }) {
  return backendFetch('/orchestrator/converse', {
    method: 'POST',
    token,
    body: { worker_id: workerId, message, history, session_id: sessionId, is_voice: !!isVoice },
  });
}

// Turns a conversation into a real project, persisting the prior history.
export async function createProjectFromConversation(token, { workerId, name, description, departmentId, history }) {
  return backendFetch('/orchestrator/projects', {
    method: 'POST',
    token,
    body: {
      worker_id: workerId,
      name,
      description,
      department_id: departmentId,
      history,
    },
  });
}

// Real, persisted history for a project's own conversation.
export async function fetchProjectConversation(token, projectId) {
  return backendFetch(`/orchestrator/projects/${projectId}/conversation`, { token });
}

// Persisted continuation -- history is read server-side, not sent here.
export async function converseInProject(token, projectId, { workerId, message, isVoice }) {
  return backendFetch(`/orchestrator/projects/${projectId}/converse`, {
    method: 'POST',
    token,
    body: { worker_id: workerId, message, is_voice: !!isVoice },
  });
}
