'use client';

import { useState } from 'react';

import AvatarPanel from '@/components/portal/AvatarPanel';
import {
  isTextToSpeechSupported,
  isSecureContextForVoice,
  speak,
  cancelSpeech,
} from '@/lib/voice/voiceEngine';

const SAMPLE_PHRASE =
  "Hi, I'm your Technical Support worker. This is a preview of how I'll sound and look when answering a real question.";

// Mirrors OrchestratorChat.js's own real resolveEffectiveProvider() --
// a worker's own voice_id (e.g. "af_heart") is a real Kokoro voice name,
// meaningless to the browser-native engine, so self_hosted is only used
// when the organisation's own VoiceProviderConfiguration genuinely has
// both real self-hosted engines configured; otherwise this honestly
// falls back to browser-native with no voice_id applied, rather than
// silently passing a Kokoro voice name to an engine that can't use it.
function resolveEffectiveProvider(voiceId, orgVoiceProviderConfig) {
  if (!voiceId) return 'browser_native';
  const sttReady = orgVoiceProviderConfig?.stt_provider === 'faster_whisper_self_hosted';
  const ttsReady = orgVoiceProviderConfig?.tts_provider === 'kokoro_self_hosted';
  return sttReady && ttsReady ? 'self_hosted' : 'browser_native';
}

// TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- "Avatar preview and
// testing," genuinely useful for judging a configuration before
// committing, not decorative: plays SAMPLE_PHRASE through the real TTS
// engine (using this worker's own configured voice_id) and drives the
// same real AvatarPanel through its real idle -> speaking -> idle state
// transitions, exactly the loop the real Voice Assistant surface uses,
// just triggered manually instead of by a real question.
export default function AvatarPreviewTest({ providerType, avatarImageUrl, voiceId, orgVoiceProviderConfig = null }) {
  const provider = resolveEffectiveProvider(voiceId, orgVoiceProviderConfig);
  const [state, setState] = useState('idle');
  const [error, setError] = useState(null);

  const ttsSupported = isTextToSpeechSupported(provider);
  const secureContext = isSecureContextForVoice();

  function handlePreview() {
    setError(null);

    if (!ttsSupported) {
      setError('Text-to-speech is not available in this browser/context.');
      return;
    }

    setState('speaking');
    speak(provider, SAMPLE_PHRASE, {
      voice: voiceId || undefined,
      onEnd: () => setState('idle'),
      onError: (err) => {
        setState('idle');
        setError(err?.message || 'Unable to play this preview.');
      },
    });
  }

  function handleStop() {
    cancelSpeech(provider);
    setState('idle');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <AvatarPanel voiceState={state} providerType={providerType} avatarImageUrl={avatarImageUrl} />

      {!secureContext && (
        <p className="form-note" role="note">
          This connection is not a secure (HTTPS) context — speech features may be unavailable in
          this browser regardless of this preview.
        </p>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={handlePreview}
          disabled={state === 'speaking' || !ttsSupported}
        >
          {state === 'speaking' ? 'Playing preview...' : 'Play preview'}
        </button>
        {state === 'speaking' && (
          <button type="button" className="btn btn-secondary btn-small" onClick={handleStop}>
            Stop
          </button>
        )}
      </div>

      <p className="form-note" style={{ maxWidth: '260px', textAlign: 'center' }}>
        &ldquo;{SAMPLE_PHRASE}&rdquo;
      </p>
    </div>
  );
}
