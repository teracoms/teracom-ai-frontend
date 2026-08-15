'use client';

import { useState } from 'react';

import ChatThread from '@/components/portal/ChatThread';
import ChatComposer from '@/components/portal/ChatComposer';
import ChatSessionStarter from '@/components/portal/ChatSessionStarter';

/**
 * Owns the live, in-page conversation thread for one worker. This thread is
 * client-side state only — teracom-ai-backend's POST /chat/ never returns
 * the id of the session it creates per message (see lib/api/chat.js), so
 * there is nothing this app could fetch to restore the thread on a refresh.
 * Reloading this page starts a new, empty thread; each message already sent
 * is still safely persisted server-side in its own (currently unreachable)
 * session row.
 */
export default function ChatInterface({ workerId }) {
  const [messages, setMessages] = useState([]);

  function appendMessage(role, content) {
    setMessages((current) => [...current, { id: `local-${current.length}`, role, content }]);
  }

  return (
    <div>
      <ChatThread
        messages={messages}
        emptyTitle="No messages yet"
        emptyDescription="Send a message below to start talking with this worker."
      />

      <ChatComposer workerId={workerId} onMessage={appendMessage} />

      <ChatSessionStarter workerId={workerId} />
    </div>
  );
}
