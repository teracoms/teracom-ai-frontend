'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import ChatThread from '@/components/portal/ChatThread';
import {
  isSpeechToTextSupported,
  isTextToSpeechSupported,
  startListening,
  speak,
  cancelSpeech,
} from '@/lib/voice/speechProvider';

let localIdCounter = 0;
function nextLocalId() {
  localIdCounter += 1;
  return `local-${localIdCounter}`;
}

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
export default function OrchestratorChat({ workerId, projectId, initialMessages = [], onProjectCreated, voiceEnabled = false }) {
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

  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState(null);
  const fileInputRef = useRef(null);

  const [creatingProject, setCreatingProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [showProjectNameField, setShowProjectNameField] = useState(false);

  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(voiceEnabled);
  const [voiceError, setVoiceError] = useState(null);
  const stopListeningRef = useRef(null);
  const speechToTextSupported = isSpeechToTextSupported();
  const textToSpeechSupported = isTextToSpeechSupported();

  useEffect(() => {
    return () => {
      stopListeningRef.current?.();
      cancelSpeech();
    };
  }, []);

  function appendMessage(role, content) {
    setMessages((current) => [...current, { id: nextLocalId(), role, content }]);
  }

  async function sendMessage(message) {
    if (!message || sending) return;

    setError(null);
    appendMessage('user', message);
    setSending(true);

    try {
      let responseText;
      if (projectId) {
        const response = await fetch(`/api/portal/orchestrator/projects/${projectId}/converse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workerId, message }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'The Orchestrator did not respond.');
        responseText = data.response;
      } else {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        const response = await fetch('/api/portal/orchestrator/converse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workerId, message, history }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'The Orchestrator did not respond.');
        responseText = data.response;
      }
      appendMessage('assistant', responseText);
      if (voiceEnabled && autoSpeak && textToSpeechSupported) {
        speak(responseText, { onError: (err) => setVoiceError(err.message) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The Orchestrator did not respond.');
    } finally {
      setSending(false);
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;
    setText('');
    await sendMessage(message);
  }

  function handleToggleListening() {
    if (listening) {
      stopListeningRef.current?.();
      setListening(false);
      return;
    }

    setVoiceError(null);
    setInterimTranscript('');
    cancelSpeech();
    setListening(true);

    stopListeningRef.current = startListening({
      onInterimResult: (interim) => setInterimTranscript(interim),
      onFinalResult: (final) => {
        setInterimTranscript('');
        if (final) sendMessage(final);
      },
      onError: (err) => {
        setVoiceError(err.message);
        setListening(false);
      },
      onEnd: () => setListening(false),
    });
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
          {sending ? 'Sending...' : 'Send'}
        </button>
        {sending && (
          <p className="chat-typing-indicator" role="status">
            Orchestrator is typing...
          </p>
        )}
      </form>

      {voiceEnabled && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {speechToTextSupported ? (
            <button
              type="button"
              className={listening ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
              onClick={handleToggleListening}
              disabled={sending}
            >
              {listening ? 'Stop Listening' : 'Speak'}
            </button>
          ) : (
            <p className="form-note">Speech-to-text isn&apos;t supported in this browser.</p>
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

          {listening && (
            <p className="form-note" role="status">
              Listening{interimTranscript ? `: "${interimTranscript}"` : '...'}
            </p>
          )}

          {voiceError && (
            <p className="form-error" role="alert">
              {voiceError}
            </p>
          )}
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
