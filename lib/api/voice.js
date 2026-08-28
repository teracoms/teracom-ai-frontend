// Server-only Voice Provider Configuration data access.
// VOICE_MIGRATION_V1 -- the organisation-scoped configuration behind
// self-hosted STT/TTS (voice_services/stt_service.py,
// voice_services/tts_service.py), mirroring lib/api/aiProviderConfig.js
// exactly.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/voice.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchVoiceProviderConfig(token) {
  return backendFetch('/voice-provider-config/', { token });
}

export async function setVoiceProviderConfig(token, payload) {
  return backendFetch('/voice-provider-config/', { method: 'PUT', token, body: payload });
}
