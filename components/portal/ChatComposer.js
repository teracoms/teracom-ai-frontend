'use client';

import { useState } from 'react';

/**
 * POST /api/portal/chat → POST /chat/, a single blocking request (no
 * streaming exists backend-side — services/ollama_service.py hardcodes
 * "stream": False, confirmed from source). The "Assistant is typing..."
 * note is the loading-state substitute for token-by-token output, the same
 * minimal loading-flag/fetch/try-catch-finally pattern used throughout this
 * codebase's client-side data-fetching components.
 */
export default function ChatComposer({ workerId, onMessage }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const message = text.trim();
    if (!message || loading) return;

    setError(null);
    onMessage('user', message);
    setText('');
    setLoading(true);

    try {
      const response = await fetch('/api/portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: workerId, message }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to send this message.');
      }

      // TECHNICAL_SUPPORT_OS_MVP_V1: sources names which Knowledge rows
      // fed this answer (schemas/chat.py#ChatResponse), so it can be
      // shown as sourced from a specific document rather than asserted
      // as grounded with no visible proof. Absent/empty on any answer
      // with no permitted knowledge context -- unchanged rendering.
      onMessage('assistant', data.response, { sources: data.sources });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send this message.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type a message..."
        disabled={loading}
        aria-label="Message"
        rows={2}
      />

      <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()}>
        {loading ? 'Sending...' : 'Send'}
      </button>

      {loading && (
        <p className="chat-typing-indicator" role="status">
          Assistant is typing...
        </p>
      )}
    </form>
  );
}
