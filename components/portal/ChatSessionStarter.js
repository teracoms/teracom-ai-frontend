'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * POST /api/portal/chat/{workerId}/sessions → POST /chat-sessions/{workerId}.
 * Deliberately separate from the live composer above: teracom-ai-backend's
 * POST /chat/ never returns the id of the session it silently creates per
 * message (see lib/api/chat.js), so this is the only way this app can ever
 * obtain a real session id — but a session created this way starts (and
 * stays) empty, since nothing wires new chat messages into it. See
 * CHAT_IMPLEMENTATION_REPORT.md §2 for the full explanation.
 */
export default function ChatSessionStarter({ workerId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleClick() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/portal/chat/${workerId}/sessions`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to start a session.');
      }

      router.push(`/portal/chat/${workerId}/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start a session.');
      setLoading(false);
    }
  }

  return (
    <div className="chat-session-starter">
      <p className="form-note-banner" role="note">
        Every message you send above is saved as its own session automatically, but this app has
        no way to look its ID up afterward. Starting a tracked session below gives you a real
        session ID and a page to view its summary later — note it starts empty and won&apos;t
        include the messages from the live chat above.
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="btn btn-secondary" onClick={handleClick} disabled={loading}>
        {loading ? 'Starting...' : 'Start a Tracked Session'}
      </button>
    </div>
  );
}
