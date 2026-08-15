import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchSessionMessages, fetchConversationSummary } from '@/lib/api/chat';
import { settle, errorMessage } from '@/lib/api/results';
import { ApiError } from '@/lib/api/client';
import ChatThread from '@/components/portal/ChatThread';
import StatTile from '@/components/portal/StatTile';

export const metadata = {
  title: 'Session | Teracom AI Portal',
};

/**
 * Read-only. GET /chat-sessions/{sessionId} is the only way to see a
 * session's messages, but nothing in this app can ever populate one created
 * via ChatSessionStarter — see lib/api/chat.js and
 * CHAT_IMPLEMENTATION_REPORT.md §2. This page is honest about that rather
 * than implying a "continue this conversation" affordance that doesn't work.
 */
export default async function SessionDetailPage({ params }) {
  const { workerId, sessionId } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Chat</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view this session.</p>
          </div>
        </section>
      </main>
    );
  }

  const [messagesResult, summaryResult] = await Promise.allSettled([
    fetchSessionMessages(token, sessionId),
    fetchConversationSummary(token, sessionId),
  ]);

  const messages = settle(messagesResult);
  const summary = settle(summaryResult);

  // GET /chat-sessions/{id} is ownership-checked backend-side
  // (auth/organisation.get_owned_session, itself delegating to
  // get_owned_worker) — 404/403 both collapse to the same "not found"
  // message, same precedent as every other detail page in this app.
  if (messages.error) {
    const notFound = messages.error instanceof ApiError && [403, 404].includes(messages.error.status);

    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Chat</span>
            <h1>{notFound ? 'Session not found.' : 'Unable to load this session.'}</h1>
            <p className="lead">
              {notFound
                ? "This session doesn't exist, or belongs to a different organisation."
                : errorMessage(messages.error)}
            </p>
            <Link className="btn btn-secondary" href={`/portal/chat/${workerId}`}>
              Back to Chat
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const thread = messages.value.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.message,
  }));

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Chat session</span>
            <h1>Session detail.</h1>
            <p className="lead">
              A tracked session started from this worker&apos;s chat page. See{' '}
              <Link href={`/portal/chat/${workerId}`}>the live chat</Link> for an actual
              conversation.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {summary.error ? (
            <p className="form-error" role="alert">
              {errorMessage(summary.error)}
            </p>
          ) : (
            <StatTile label="Messages" value={summary.value.message_count} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Messages</span>
            <h2>What was said.</h2>
          </div>
          <ChatThread
            messages={thread}
            emptyTitle="No messages in this session yet"
            emptyDescription="Tracked sessions start empty — the live chat composer doesn't write into a specific session id (see this app's Chat implementation report for why)."
          />
        </div>
      </section>
    </main>
  );
}
