'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import ChatThread from '@/components/portal/ChatThread';

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
 */
export default function OrchestratorChat({ workerId, projectId, initialMessages = [], onProjectCreated }) {
  const router = useRouter();
  const [messages, setMessages] = useState(
    initialMessages.map((entry) => ({ id: nextLocalId(), role: entry.role, content: entry.message ?? entry.content }))
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

  function appendMessage(role, content) {
    setMessages((current) => [...current, { id: nextLocalId(), role, content }]);
  }

  async function handleSend(event) {
    event.preventDefault();
    const message = text.trim();
    if (!message || sending) return;

    setError(null);
    appendMessage('user', message);
    setText('');
    setSending(true);

    try {
      if (projectId) {
        const response = await fetch(`/api/portal/orchestrator/projects/${projectId}/converse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workerId, message }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'The Orchestrator did not respond.');
        appendMessage('assistant', data.response);
      } else {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        const response = await fetch('/api/portal/orchestrator/converse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workerId, message, history }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'The Orchestrator did not respond.');
        appendMessage('assistant', data.response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The Orchestrator did not respond.');
    } finally {
      setSending(false);
    }
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
