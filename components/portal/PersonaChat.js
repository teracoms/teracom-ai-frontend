'use client';

import { useState } from 'react';

import ChatThread from '@/components/portal/ChatThread';

let localIdCounter = 0;
function nextLocalId() {
  localIdCounter += 1;
  return `local-${localIdCounter}`;
}

/**
 * AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- People Experience
 * (focus area 3). A real, persisted conversation with one executive
 * persona (CTO, CFO, Cybersecurity Director, etc.), mirroring
 * OrchestratorChat.js's own in-project persisted mode but against
 * POST /api/portal/people/{persona_key}/converse -- deliberately a
 * separate component rather than a third mode bolted onto
 * OrchestratorChat, since personas have no file-upload or
 * create-project affordance and are scoped per-user, not per-project.
 */
export default function PersonaChat({ personaKey, initialMessages = [] }) {
  const [messages, setMessages] = useState(
    initialMessages.map((entry) => ({ id: nextLocalId(), role: entry.role, content: entry.message ?? entry.content }))
  );
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

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
      const response = await fetch(`/api/portal/people/${personaKey}/converse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'This executive did not respond.');
      appendMessage('assistant', data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This executive did not respond.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <ChatThread
        messages={messages}
        emptyTitle="No messages yet"
        emptyDescription="Ask a question and continue the conversation any time — it picks up where you left off."
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
            Typing...
          </p>
        )}
      </form>
    </div>
  );
}
