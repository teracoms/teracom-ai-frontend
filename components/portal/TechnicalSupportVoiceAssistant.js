'use client';

import { useEffect, useRef, useState } from 'react';

import ChatThread from '@/components/portal/ChatThread';
import AvatarPanel from '@/components/portal/AvatarPanel';
import {
  isSpeechToTextSupported,
  isTextToSpeechSupported,
  isSecureContextForVoice,
  startListening,
  speak,
  cancelSpeech,
} from '@/lib/voice/voiceEngine';

let localIdCounter = 0;
function nextLocalId() {
  localIdCounter += 1;
  return `ts-voice-${localIdCounter}`;
}

// Mirrors OrchestratorChat.js's own real resolveEffectiveProvider() --
// a worker's own voice_id is a real Kokoro voice name, only meaningful
// when the organisation genuinely has both real self-hosted engines
// configured; otherwise this honestly falls back to browser-native
// (still real speech-to-text/text-to-speech, just without a specific
// named voice).
function resolveEffectiveProvider(voiceId, orgVoiceProviderConfig) {
  if (!voiceId) return 'browser_native';
  const sttReady = orgVoiceProviderConfig?.stt_provider === 'faster_whisper_self_hosted';
  const ttsReady = orgVoiceProviderConfig?.tts_provider === 'kokoro_self_hosted';
  return sttReady && ttsReady ? 'self_hosted' : 'browser_native';
}

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- the real Voice Assistant
 * loop: speech-to-text (lib/voice/voiceEngine.js) -> the real, unmodified
 * POST /api/portal/chat -> POST /chat/ (grounded retrieval, real
 * citations, unaffected by any of this) -> text-to-speech of the
 * response, using this worker's own configured voice_id where the
 * organisation's real self-hosted engines support it -> the worker's
 * own avatar (AvatarPanel), its state driven by this same real
 * conversation lifecycle. Mirrors OrchestratorChat.js's own real
 * state-transition mechanism, deliberately simplified (no continuous
 * mode, barge-in, or project persistence -- a single push-to-talk turn
 * at a time, the shape this dedicated surface needs).
 *
 * Text fallback is not optional: the full transcript of every turn,
 * including its real source citations, always renders via ChatThread
 * regardless of whether voice is supported/used for that turn -- typing
 * a question works identically to speaking one.
 */
export default function TechnicalSupportVoiceAssistant({ workers, initialWorkerId, orgVoiceProviderConfig }) {
  const [workerId, setWorkerId] = useState(initialWorkerId ?? workers[0]?.id ?? '');
  const [personality, setPersonality] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [state, setState] = useState('idle'); // idle | listening | processing | speaking
  const [error, setError] = useState(null);
  const stopListeningRef = useRef(null);

  const provider = resolveEffectiveProvider(personality?.voice_id, orgVoiceProviderConfig);
  const speechToTextSupported = isSpeechToTextSupported(provider);
  const textToSpeechSupported = isTextToSpeechSupported(provider);
  const insecureContextForVoice = !isSecureContextForVoice();

  useEffect(() => {
    let cancelled = false;
    setPersonality(null);
    if (!workerId) return undefined;

    fetch(`/api/portal/workers/${workerId}/personality`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setPersonality(data);
      })
      .catch(() => {
        if (!cancelled) setPersonality(null);
      });

    return () => {
      cancelled = true;
    };
  }, [workerId]);

  useEffect(() => {
    return () => {
      stopListeningRef.current?.();
      cancelSpeech(provider);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ask(message) {
    if (!message || !workerId || state === 'processing') return;

    setError(null);
    const userId = nextLocalId();
    setMessages((current) => [...current, { id: userId, role: 'user', content: message }]);
    setState('processing');

    try {
      const response = await fetch('/api/portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, message }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'The worker did not respond.');
      }

      setMessages((current) => [
        ...current,
        { id: nextLocalId(), role: 'assistant', content: data.response, sources: data.sources ?? [] },
      ]);

      if (textToSpeechSupported) {
        setState('speaking');
        speak(provider, data.response, {
          voice: provider === 'self_hosted' ? personality?.voice_id : undefined,
          onEnd: () => setState('idle'),
          onError: (err) => {
            setState('idle');
            setError(err?.message || 'Unable to play this response aloud.');
          },
        });
      } else {
        setState('idle');
      }
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : 'Unable to reach this worker.');
    }
  }

  function beginListening() {
    if (!speechToTextSupported) return;
    setError(null);
    cancelSpeech(provider);
    setState('listening');

    // Real, established shape (mirrors OrchestratorChat.js's own
    // beginListening()): accumulate final chunks in a plain closure
    // variable while listening; onEnd fires exactly once, whether the
    // recognizer stopped itself (e.g. a silence timeout) or was
    // stopped manually via stopListening() below -- either way, that
    // is the one real place a completed utterance is actually sent.
    let finalTranscript = '';
    stopListeningRef.current = startListening(provider, {
      continuousMode: false,
      onInterimResult: () => {},
      onFinalResult: (finalChunk) => {
        finalTranscript = `${finalTranscript} ${finalChunk}`.trim();
      },
      onError: (err) => {
        setError(err?.message || 'Speech recognition failed.');
      },
      onEnd: () => {
        setState((current) => (current === 'listening' ? 'idle' : current));
        if (finalTranscript) ask(finalTranscript);
      },
    });
  }

  function stopListening() {
    stopListeningRef.current?.();
  }

  function handleTextSubmit(event) {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;
    setText('');
    ask(message);
  }

  const selectedWorker = workers.find((w) => w.id === workerId);

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <AvatarPanel
          voiceState={state}
          providerType={personality?.avatar_type ?? 'placeholder'}
          avatarImageUrl={
            personality?.has_avatar_image ? `/api/portal/workers/${workerId}/personality/avatar-image` : null
          }
        />
        {selectedWorker && <strong>{selectedWorker.name}</strong>}
      </div>

      <div style={{ flex: '1 1 400px' }}>
        <label className="form-note" htmlFor="ts-voice-worker">
          Worker
        </label>
        <select
          id="ts-voice-worker"
          value={workerId}
          onChange={(event) => setWorkerId(event.target.value)}
          disabled={state !== 'idle'}
        >
          {workers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.name}
            </option>
          ))}
        </select>

        {insecureContextForVoice && (
          <p className="form-note" role="note">
            This connection is not a secure (HTTPS) context, so speech-to-text may be unavailable —
            typing still works.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', margin: '0.75rem 0' }}>
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={state === 'listening' ? stopListening : beginListening}
            disabled={!speechToTextSupported || state === 'processing' || state === 'speaking'}
          >
            {state === 'listening' ? 'Stop Listening' : 'Speak a question'}
          </button>
          {state === 'speaking' && (
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                cancelSpeech(provider);
                setState('idle');
              }}
            >
              Stop Speaking
            </button>
          )}
        </div>

        {/* Text fallback -- always rendered, never gated behind voice support. */}
        <form onSubmit={handleTextSubmit} className="contact-form" style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Or type your question"
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={state === 'processing'}
            aria-label="Type your question"
          />
          <button className="btn btn-secondary btn-small" type="submit" disabled={state === 'processing'}>
            Send
          </button>
        </form>

        <ChatThread
          messages={messages}
          emptyTitle="Ask a technical question"
          emptyDescription="Speak or type a question — the answer is grounded in this worker's ingested vendor documentation, with sources always shown."
        />
      </div>
    </div>
  );
}
