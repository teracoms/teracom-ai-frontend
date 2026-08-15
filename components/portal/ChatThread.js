import EmptyState from '@/components/portal/EmptyState';

const ROLE_LABELS = {
  user: 'You',
  assistant: 'Assistant',
};

/**
 * Shared, presentational message list — used by both the live chat page
 * (client-side, in-memory turns from ChatComposer) and the read-only session
 * detail page (server-fetched from GET /chat-sessions/{sessionId}). Both
 * callers normalise to the same {id, role, content} shape before passing
 * messages in, so this one component covers both without needing to know
 * which source they came from.
 */
export default function ChatThread({ messages, emptyTitle, emptyDescription }) {
  if (messages.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="chat-thread">
      {messages.map((message) => (
        <li key={message.id} className={`chat-message chat-message-${message.role}`}>
          <span className="chat-message-role">{ROLE_LABELS[message.role] ?? message.role}</span>
          <p className="chat-message-content">{message.content}</p>
        </li>
      ))}
    </ul>
  );
}
