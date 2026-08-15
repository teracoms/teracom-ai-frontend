import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList } from '@/lib/api/workers';
import { errorMessage } from '@/lib/api/results';
import ChatWorkerCard from '@/components/portal/ChatWorkerCard';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Chat | Teracom AI Portal',
};

export default async function ChatPage() {
  const token = getSessionToken();

  // Defensive only: app/portal/(protected)/layout.js already guarantees a
  // valid session before this page renders — same precedent as every prior
  // package's list/entry page.
  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Chat</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to chat with a worker.</p>
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

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Chat</span>
            <h1>Talk to your workers.</h1>
            <p className="lead">
              Pick a worker to start a conversation — it answers using its own knowledge
              assignments and remembered context.
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
          ) : workers.length === 0 ? (
            <EmptyState
              title="No workers yet"
              description="Create a worker first, then come back here to chat with it."
            />
          ) : (
            <div className="product-grid">
              {workers.map((worker) => (
                <ChatWorkerCard key={worker.id} worker={worker} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
