'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import ChatThread from '@/components/portal/ChatThread';
import AvatarPanel from '@/components/portal/AvatarPanel';
import {
  isSpeechToTextSupported,
  isTextToSpeechSupported,
  startListening,
  speak,
  cancelSpeech,
  watchForInterruption,
} from '@/lib/voice/voiceEngine';

let localIdCounter = 0;
function nextLocalId() {
  localIdCounter += 1;
  return `local-${localIdCounter}`;
}

// PROJECT_LIFECYCLE_AND_VOICE_REMEDIATION_V1 VOICE007 -- one real,
// unambiguous label per voice state, not left for a customer to infer
// from which bits of surrounding text happen to be visible.
const VOICE_STATE_LABEL = {
  listening: '🎤 Listening',
  processing: '⏳ Processing',
  speaking: '🔊 Speaking',
  idle: '⚪ Idle',
};
const VOICE_STATE_TONE = {
  listening: 'badge-warn',
  processing: 'badge-warn',
  speaking: 'badge-ok',
  idle: 'badge-muted',
};

/**
 * ORCHESTRATOR_CHAT_IMPLEMENTATION_V1 -- a real, working Orchestrator
 * conversation. Two modes, one component:
 *
 * - Pre-project (`projectId` omitted): history lives in this component's
 *   own state only, sent to POST /api/portal/orchestrator/converse each
 *   turn -- the same honest "not persisted until a project exists" shape
 *   ChatInterface.js already established for POST /chat/. A
 *   "Create Project from this Conversation" action appears once at least
 *   one exchange has happened.
 * - In-project (`projectId` given): `initialMessages` is the real,
 *   persisted history (fetched server-side from
 *   GET /orchestrator/projects/{id}/conversation); each new turn goes
 *   through POST /api/portal/orchestrator/projects/{id}/converse, which
 *   persists both sides server-side. Reloading this page shows the same
 *   conversation again -- this is the real fix for "conversation persists
 *   within the project workspace," not client-side state pretending to.
 *
 * File upload reuses the existing Knowledge upload pipeline exactly
 * (POST /api/portal/knowledge/upload, worker_id + file) -- no new backend
 * mechanism for this, per "reuse existing backend... where available."
 *
 * `voiceEnabled` (AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 focus area
 * 4, Voice Experience Foundation) layers a real browser-native
 * speech-to-text/text-to-speech mode on top of the exact same send/receive
 * flow -- a spoken turn becomes the same `message` a typed turn would,
 * and the text transcript (ChatThread below) always renders every turn
 * regardless of how it was entered, so voice and text are shown
 * simultaneously rather than voice replacing text.
 */
// TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 1 -- resolves the user's
// own stored preference (Settings & Security V1 preferences.voice,
// extended this workstream) against the organisation's real ceiling
// (VoiceProviderConfiguration, admin-gated, VOICE_MIGRATION_V1): a
// user may *prefer* self_hosted, but this backend route only actually
// serves it once the organisation's own admin has enabled both the
// self-hosted STT and TTS providers -- falling back to the always-real
// browser_native default otherwise, never a broken voice experience
// because of a mismatched preference.
function resolveEffectiveProvider(voicePreferences, orgVoiceProviderConfig) {
  const preferred = voicePreferences?.provider ?? 'browser_native';
  if (preferred !== 'self_hosted') return 'browser_native';

  const sttReady = orgVoiceProviderConfig?.stt_provider === 'faster_whisper_self_hosted';
  const ttsReady = orgVoiceProviderConfig?.tts_provider === 'kokoro_self_hosted';
  return sttReady && ttsReady ? 'self_hosted' : 'browser_native';
}

export default function OrchestratorChat({
  workerId,
  projectId,
  initialMessages = [],
  initialSessionId = null,
  onProjectCreated,
  voiceEnabled = false,
  voicePreferences = null,
  orgVoiceProviderConfig = null,
}) {
  const prefs = {
    provider: 'browser_native',
    voice_selection: 'af_heart',
    speech_speed: 1.25,
    continuous_mode: true,
    push_to_talk: false,
    auto_send: true,
    voice_enabled: true,
    ...voicePreferences,
  };
  const effectiveProvider = resolveEffectiveProvider(prefs, orgVoiceProviderConfig);
  const usingFallbackProvider = prefs.provider === 'self_hosted' && effectiveProvider === 'browser_native';
  const voiceActuallyEnabled = voiceEnabled && prefs.voice_enabled;
  const router = useRouter();
  const [messages, setMessages] = useState(
    initialMessages.map((entry) => ({
      id: nextLocalId(),
      role: entry.role,
      content: entry.message ?? entry.content,
      // CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec6 -- a real Output, posted
      // automatically into this same conversation the moment it was
      // created (services/execution_service.py#_maybe_create_output()).
      // Only ever present on messages loaded from the server (this
      // component never creates one locally) -- surfaced on the next
      // page load/refresh, which is this design's own explicit,
      // sufficient "real-time" behaviour, not a live push.
      kind: entry.message_kind ?? 'text',
      outputReference: entry.output_reference ?? null,
    }))
  );
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  // PROJ001 -- real conversation persistence for the pre-project
  // Orchestrator (projectId is null). Once known (either passed in to
  // resume a real draft, or returned from the first sendMessage() call
  // of a brand new one), every subsequent turn includes it so the
  // backend keeps appending to the same real, resumable session
  // instead of starting a new draft each time.
  const [sessionId, setSessionId] = useState(initialSessionId);

  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState(null);
  const fileInputRef = useRef(null);

  const [creatingProject, setCreatingProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [showProjectNameField, setShowProjectNameField] = useState(false);

  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  // Mirrors accumulatedTranscriptRef purely for display -- the ref stays
  // the source of truth sendMessage() actually reads from, this just
  // lets the customer see their own growing transcript across pauses
  // instead of it silently vanishing between sentences (see beginListening()).
  const [accumulatedDisplay, setAccumulatedDisplay] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(voiceActuallyEnabled);
  const [voiceError, setVoiceError] = useState(null);
  // UX_DEFECT_REMEDIATION_V1 VOICE002 -- real gap: cancelSpeech() already
  // existed and was already called on unmount/before listening again,
  // but nothing tracked whether speech was actually in progress, so
  // there was no way to render a visible "Stop Speaking" button.
  const [speaking, setSpeaking] = useState(false);
  const stopListeningRef = useRef(null);
  const stopInterruptionWatchRef = useRef(null);
  // PROJECT_LIFECYCLE_AND_VOICE_REMEDIATION_V1 VOICE002/VOICE003 --
  // startListening() now runs continuous (see lib/voice/speechProvider.js's
  // own note), so a turn can contain several separate "final" chunks as
  // the customer pauses between sentences. Accumulated in a ref (not
  // state) so appending doesn't itself trigger a re-render on every
  // chunk -- only the actual send, on manual stop, needs to happen.
  const accumulatedTranscriptRef = useRef('');
  const speechToTextSupported = isSpeechToTextSupported(effectiveProvider);
  const textToSpeechSupported = isTextToSpeechSupported(effectiveProvider);
  // VOICE007 -- one real, always-current voice state, not three
  // separately-inferred booleans a customer has to piece together
  // themselves from which bits of text happen to be visible.
  const voiceState = listening ? 'listening' : sending ? 'processing' : speaking ? 'speaking' : 'idle';

  useEffect(() => {
    return () => {
      stopListeningRef.current?.();
      stopInterruptionWatchRef.current?.();
      cancelSpeech(effectiveProvider);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 2 -- real interim
  // barge-in (lib/voice/selfHostedSpeechProvider.js#watchForInterruption):
  // while the assistant is speaking in continuous, self-hosted mode,
  // watch for the customer starting to talk over it and, if so, stop
  // the reply immediately and start real listening -- a genuine
  // improvement over "wait for the reply to finish" for the one
  // provider that can support it today (see voiceEngine.js's own
  // supportsInterruption()).
  useEffect(() => {
    if (!speaking || !voiceActuallyEnabled || effectiveProvider !== 'self_hosted' || !prefs.continuous_mode) {
      return undefined;
    }

    stopInterruptionWatchRef.current = watchForInterruption(effectiveProvider, {
      onInterruptDetected: () => {
        cancelSpeech(effectiveProvider);
        setSpeaking(false);
        beginListening();
      },
    });

    return () => {
      stopInterruptionWatchRef.current?.();
      stopInterruptionWatchRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speaking]);

  function appendMessage(role, content) {
    const id = nextLocalId();
    setMessages((current) => [...current, { id, role, content }]);
    return id;
  }

  function removeMessage(id) {
    setMessages((current) => current.filter((m) => m.id !== id));
  }

  // VOICE_CONVERSATION_FAILED_FETCH_V1 -- root cause of the raw, dead-end
  // "Failed to fetch" a customer could hit here: this function's own
  // fetch() call had no client-side timeout at all (a real risk on a
  // shared, concurrently-used local Ollama instance -- the backend's own
  // per-candidate timeout, services/ollama_service.py, is 60s, and a
  // routing_mode with more than one candidate can legitimately take
  // longer still), and on ANY failure -- including the browser's own
  // generic network-layer TypeError, whose .message is literally the
  // string "Failed to fetch" in Chrome -- that raw, unhelpful browser
  // string was shown to the customer verbatim, with no guidance and no
  // way to retry without retyping the entire message (handleSend below
  // already cleared the input before this ever ran). Neither half of
  // that is a network/proxy/auth defect this session could reproduce
  // via direct, repeated testing of the real endpoint (confirmed
  // working, both warm and cold-started, with the exact reported
  // message, with and without prior conversation history) -- it is a
  // real, fixable gap in how this function itself handles the failure
  // once it happens, regardless of the underlying trigger.
  async function sendMessage(message) {
    if (!message || sending) return false;

    setError(null);
    const userMessageId = appendMessage('user', message);
    setSending(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      let responseText;
      if (projectId) {
        const response = await fetch(`/api/portal/orchestrator/projects/${projectId}/converse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workerId, message }),
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'The Orchestrator did not respond.');
        responseText = data.response;
      } else {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        const response = await fetch('/api/portal/orchestrator/converse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workerId, message, history, sessionId }),
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'The Orchestrator did not respond.');
        responseText = data.response;
        // PROJ001 -- the backend always returns a real session_id, now
        // that this conversation is genuinely persisted from its first
        // turn; remember it so every later turn resumes the same
        // session instead of each one silently starting a new draft.
        if (data.session_id) setSessionId(data.session_id);
      }
      appendMessage('assistant', responseText);
      if (voiceActuallyEnabled && autoSpeak && textToSpeechSupported) {
        setSpeaking(true);
        speak(effectiveProvider, responseText, {
          rate: prefs.speech_speed,
          voice: prefs.voice_selection,
          // VOICE004 -- real gap: no conversational back-and-forth flow,
          // every turn needed a manual "Speak" click even in voice mode.
          // The moment the Orchestrator's spoken reply finishes (whether
          // it played out naturally or was cut short by "Stop Speaking"
          // -- both now correctly reach onEnd, see speechProvider.js's
          // own VOICE006 fix), reopen the microphone automatically so
          // the customer can just keep talking, the way a real
          // conversation works. Only in continuous mode, and never for
          // push-to-talk -- that mode's whole point is the customer
          // decides each turn by holding the button themselves.
          onEnd: () => {
            setSpeaking(false);
            if (
              voiceActuallyEnabled && autoSpeak && speechToTextSupported &&
              !listening && prefs.continuous_mode && !prefs.push_to_talk
            ) {
              beginListening();
            }
          },
          onError: (err) => {
            setSpeaking(false);
            setVoiceError(err.message);
          },
        });
      }
      return true;
    } catch (err) {
      // Roll the optimistic user message back out of the thread on
      // failure -- it was never actually accepted, so leaving it
      // visible (while also leaving the same text back in the input
      // box for retry, below) looked like a confusing half-sent state.
      removeMessage(userMessageId);
      if (err?.name === 'AbortError') {
        setError('The Orchestrator is taking longer than expected to respond. Please try again in a moment.');
      } else if (err instanceof TypeError) {
        // The browser's own generic fetch-layer failure (Chrome's own
        // wording for this is literally "Failed to fetch") -- a real
        // network interruption, not something this app can diagnose
        // further from here, but a customer deserves an actionable
        // message, not the raw browser string.
        setError('Unable to reach the Orchestrator right now. Please check your connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'The Orchestrator did not respond.');
      }
      return false;
    } finally {
      clearTimeout(timeoutId);
      setSending(false);
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;
    // VOICE_CONVERSATION_FAILED_FETCH_V1 -- real gap: the input used to
    // clear immediately, before the request even started, so a failed
    // send (for any reason) forced the customer to retype their entire
    // message from scratch with no way to recover it. Now only clears
    // once sendMessage() actually confirms success.
    const sent = await sendMessage(message);
    if (sent) setText('');
  }

  function handleStopSpeaking() {
    cancelSpeech(effectiveProvider);
    setSpeaking(false);
  }

  // TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 1 -- what happens to a
  // finished utterance now depends on the user's own auto_send
  // preference: the established default (true) sends immediately,
  // exactly today's real behaviour; false instead drops the
  // transcript into the text box for the customer to review/edit
  // before pressing Send themselves -- a real, working alternative,
  // not a placeholder.
  function deliverTranscript(finalMessage) {
    if (!finalMessage) return;
    if (prefs.auto_send) {
      sendMessage(finalMessage);
    } else {
      setText((current) => (current ? `${current} ${finalMessage}`.trim() : finalMessage));
    }
  }

  // PROJECT_LIFECYCLE_AND_VOICE_REMEDIATION_V1 VOICE002/VOICE003 -- now
  // that startListening() runs continuous (speechProvider.js), a turn
  // is no longer "send on the first final chunk" -- that would still
  // cut a customer off after their first sentence, just later than
  // before. Instead: keep accumulating final chunks in a ref as the
  // customer talks across as many sentences/pauses as they like, and
  // only actually send the whole thing once listening stops -- either
  // the customer clicking "Stop Listening" themselves, or the
  // recognizer ending on its own (e.g. a real prolonged silence
  // timeout, still handled gracefully rather than losing what was
  // already said). For the self-hosted engine specifically, "continuous"
  // is a real, client-side silence detector rather than the browser's
  // own internal one (lib/voice/selfHostedSpeechProvider.js) -- one
  // recorded utterance per listening session, not multiple accumulated
  // chunks, but the same accumulation logic here handles either shape
  // without caring which engine is behind it.
  function beginListening() {
    setVoiceError(null);
    setInterimTranscript('');
    setAccumulatedDisplay('');
    accumulatedTranscriptRef.current = '';
    cancelSpeech(effectiveProvider);
    setSpeaking(false);
    setListening(true);

    stopListeningRef.current = startListening(effectiveProvider, {
      continuousMode: prefs.push_to_talk ? false : prefs.continuous_mode,
      onInterimResult: (interim) => setInterimTranscript(interim),
      onFinalResult: (final) => {
        accumulatedTranscriptRef.current = `${accumulatedTranscriptRef.current} ${final}`.trim();
        setAccumulatedDisplay(accumulatedTranscriptRef.current);
        setInterimTranscript('');
      },
      onError: (err) => {
        setListening(false);
        const finalMessage = accumulatedTranscriptRef.current.trim();
        accumulatedTranscriptRef.current = '';
        setAccumulatedDisplay('');
        // A genuine failure still deserves the message shown, but if the
        // customer had already said something real before the error
        // (e.g. a prolonged-silence timeout after a real sentence), that
        // real speech is sent rather than silently discarded.
        setVoiceError(err.message);
        deliverTranscript(finalMessage);
      },
      onEnd: () => {
        setListening(false);
        setInterimTranscript('');
        setAccumulatedDisplay('');
        const finalMessage = accumulatedTranscriptRef.current.trim();
        accumulatedTranscriptRef.current = '';
        deliverTranscript(finalMessage);
      },
    });
  }

  function handleToggleListening() {
    if (listening) {
      stopListeningRef.current?.();
      return;
    }
    beginListening();
  }

  // TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 1 -- push-to-talk is a
  // real, distinct interaction mode, not the toggle button relabelled:
  // recording runs only while the button is actually held, mirroring a
  // real walkie-talkie/radio interaction rather than a start/stop pair
  // of clicks. Mouse and touch both wired (a customer on a phone/tablet
  // gets the same real behaviour).
  function handlePushToTalkStart(event) {
    event.preventDefault();
    if (!listening) beginListening();
  }

  function handlePushToTalkEnd(event) {
    event.preventDefault();
    if (listening) stopListeningRef.current?.();
  }

  async function handleUpload(event) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || uploading) return;

    setUploadNote(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.set('worker_id', workerId);
      formData.set('file', file);

      const response = await fetch('/api/portal/knowledge/upload', { method: 'POST', body: formData });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error || 'Unable to upload this file.');

      setUploadNote(`Uploaded "${data.filename}" — added to the shared knowledge library.`);
      appendMessage('user', `[Uploaded file: ${data.filename}]`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadNote(err instanceof Error ? err.message : 'Unable to upload this file.');
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateProject(event) {
    event.preventDefault();
    const name = projectName.trim();
    if (!name || creatingProject) return;

    setError(null);
    setCreatingProject(true);

    try {
      const firstUserMessage = messages.find((m) => m.role === 'user')?.content ?? name;
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/portal/orchestrator/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, name, description: firstUserMessage, history }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error || 'Unable to create a project from this conversation.');

      if (onProjectCreated) {
        onProjectCreated(data.project);
      } else {
        router.push(`/portal/workspace/${data.project.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create a project from this conversation.');
      setCreatingProject(false);
    }
  }

  const hasExchange = messages.some((m) => m.role === 'user');

  return (
    <div>
      <ChatThread
        messages={messages}
        emptyTitle="No messages yet"
        emptyDescription="Tell the Orchestrator what you'd like to achieve."
      />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="chat-composer" onSubmit={handleSend}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          aria-label="Message"
          rows={2}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
          {sending && <span className="btn-spinner" aria-hidden="true" />}
          {sending ? 'Sending...' : 'Send'}
        </button>
        {sending && (
          <p className="chat-typing-indicator" role="status">
            Orchestrator is typing...
          </p>
        )}
      </form>

      {voiceActuallyEnabled && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <AvatarPanel voiceState={voiceState} />

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            {!speechToTextSupported ? (
              <p className="form-note">Speech-to-text isn&apos;t supported in this browser.</p>
            ) : prefs.push_to_talk ? (
              <button
                type="button"
                className={listening ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
                onMouseDown={handlePushToTalkStart}
                onMouseUp={handlePushToTalkEnd}
                onMouseLeave={handlePushToTalkEnd}
                onTouchStart={handlePushToTalkStart}
                onTouchEnd={handlePushToTalkEnd}
                disabled={sending}
              >
                {listening ? 'Listening... (release to send)' : 'Hold to Talk'}
              </button>
            ) : (
              <button
                type="button"
                className={listening ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
                onClick={handleToggleListening}
                disabled={sending}
              >
                {listening ? 'Stop Listening' : 'Speak'}
              </button>
            )}

            {textToSpeechSupported && (
              <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(event) => setAutoSpeak(event.target.checked)}
                />
                Read replies aloud
              </label>
            )}

            {speaking && (
              <button type="button" className="btn btn-secondary btn-small" onClick={handleStopSpeaking}>
                Stop Speaking
              </button>
            )}

            {/* VOICE007 -- real gap: a customer had no way to tell whether
                the app was Listening, Processing, Speaking, or just
                Finished/idle -- state that already existed (listening,
                sending, speaking) simply had no single, unambiguous,
                always-visible signal drawing all three together. */}
            <span className={`badge ${VOICE_STATE_TONE[voiceState]}`} style={{ marginBottom: 0 }} role="status">
              {VOICE_STATE_LABEL[voiceState]}
            </span>

            {usingFallbackProvider && (
              <p className="form-note">
                Your self-hosted voice preference isn&apos;t available for this organisation yet — using
                your browser&apos;s own voice instead.{' '}
                <a href="/portal/settings/voice">Voice Settings</a>
              </p>
            )}

            {listening && (
              <p className="form-note" role="status">
                {(accumulatedDisplay || interimTranscript)
                  ? `"${[accumulatedDisplay, interimTranscript].filter(Boolean).join(' ')}"`
                  : prefs.push_to_talk
                    ? 'Hold the button and speak, then release to send.'
                    : 'Say as much as you like, then press Stop Listening when you\'re done.'}
              </p>
            )}

            {voiceError && (
              <p className="form-error" role="alert">
                {voiceError}
              </p>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <form onSubmit={handleUpload} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx" disabled={uploading} aria-label="Upload a file into this conversation" />
          <button type="submit" className="btn btn-secondary btn-small" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>

        {!projectId && hasExchange && (
          <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {showProjectNameField ? (
              <>
                <input
                  type="text"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Project name"
                  disabled={creatingProject}
                  aria-label="Project name"
                  autoFocus
                />
                <button type="submit" className="btn btn-primary btn-small" disabled={creatingProject || !projectName.trim()}>
                  {creatingProject ? 'Creating...' : 'Create Project'}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => {
                  setProjectName(messages.find((m) => m.role === 'user')?.content.slice(0, 60) ?? '');
                  setShowProjectNameField(true);
                }}
              >
                Create Project from this Conversation
              </button>
            )}
          </form>
        )}
      </div>

      {uploadNote && (
        <p className="form-note" role="status" style={{ marginTop: '0.5rem' }}>
          {uploadNote}
        </p>
      )}
    </div>
  );
}
