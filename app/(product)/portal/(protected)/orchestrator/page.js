import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchMyChatSessions, fetchSessionMessages } from '@/lib/api/chat';
import { errorMessage } from '@/lib/api/results';
import { pickDefaultWorker } from '@/lib/portalInitiative';
import OrchestratorChat from '@/components/portal/OrchestratorChat';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Chat with Orchestrator | Teracom AI Portal',
};

// ORCHESTRATOR_CHAT_IMPLEMENTATION_V1 -- replaces the plain ChatInterface
// reuse (CUSTOMER_EXPERIENCE_REDESIGN_V1's first pass) with OrchestratorChat,
// a real, working multi-turn conversation against
// services/orchestrator_service.py's own clarification-seeking prompt
// (POST /orchestrator/converse) -- not the knowledge-QA POST /chat/, which
// live Sandbox validation found effectively non-responsive for a brand-new
// organisation with no knowledge base yet (it is correctly designed to
// decline rather than probe, which is right for a knowledge worker and
// wrong for an orchestrator). There is still no single "Orchestrator"
// worker entity in the data model -- this page picks a sensible default
// worker (pickDefaultWorker(), the same heuristic the Initiative flow
// uses) and presents that conversation under the "Orchestrator" framing.
export default async function OrchestratorPage({ searchParams }) {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Orchestrator</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  let workers = [];
  let loadError = null;
  try {
    workers = await fetchWorkerList(token);
  } catch (error) {
    loadError = error;
  }

  // PROJ001 -- "Resume Conversation." ?session=<id> resumes a real,
  // previously-persisted draft rather than always starting fresh --
  // real messages loaded from the same source of truth
  // resolve_and_generate()'s own history-loading already uses
  // server-side, never trusting a client-supplied replacement. Loads
  // best-effort: a resume that fails to find/load falls through to a
  // brand new conversation rather than blocking the page.
  let initialMessages = [];
  let initialSessionId = null;
  let resumeWorkerId = null;
  const requestedSessionId = searchParams?.session;

  if (requestedSessionId && !loadError) {
    try {
      const mySessions = await fetchMyChatSessions(token);
      const match = mySessions.find((s) => s.id === requestedSessionId && s.kind === 'orchestrator_draft');
      if (match) {
        initialMessages = await fetchSessionMessages(token, requestedSessionId);
        initialSessionId = requestedSessionId;
        resumeWorkerId = match.worker_id;
      }
    } catch {
      // Best-effort -- falls through to a brand new conversation below.
    }
  }

  const orchestratorWorker = resumeWorkerId
    ? workers.find((w) => w.id === resumeWorkerId) ?? pickDefaultWorker(workers, '')
    : pickDefaultWorker(workers, '');

  return (
    <main>
      <section className="hero hero-product hero-compact">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">
              <Link href="/portal/dashboard">&larr; Dashboard</Link>
            </span>
            <h1>Chat with Orchestrator</h1>
            <p className="lead">
              Ask for anything — it can bring in a colleague worker automatically when a question
              needs one.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loadError ? (
            <p className="form-error" role="alert">
              {errorMessage(loadError)}
            </p>
          ) : !orchestratorWorker ? (
            <EmptyState
              title="No workers yet"
              description="Create a worker first, then come back here to chat."
            />
          ) : (
            <OrchestratorChat
              workerId={orchestratorWorker.id}
              initialMessages={initialMessages}
              initialSessionId={initialSessionId}
            />
          )}
        </div>
      </section>
    </main>
  );
}
