import Link from 'next/link';

import AccountSummary from '@/components/portal/AccountSummary';

export const metadata = {
  title: 'Portal | Teracom AI',
};

export default function PortalHome() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Teracom AI Portal</span>
            <h1>Welcome to your workspace.</h1>
            <p className="lead">
              You&apos;re signed in. Dashboard, Workers, Knowledge, Chat, Memory and Administration
              are ready below — Billing is being rolled out in an upcoming release.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <AccountSummary />
        </div>
      </section>

      <section className="section section-spacious alt">
        <div className="container feature-grid">
          <article>
            <h3>Dashboard</h3>
            <p>Organisation-wide workers, knowledge, memory and chat activity at a glance.</p>
            <Link className="btn btn-secondary card-action" href="/portal/dashboard">
              Open Dashboard
            </Link>
          </article>
          <article>
            <h3>Workers</h3>
            <p>Create and manage AI worker agents and their assigned knowledge.</p>
            <Link className="btn btn-secondary card-action" href="/portal/workers">
              Open Workers
            </Link>
          </article>
          <article>
            <h3>Knowledge</h3>
            <p>Upload, browse and search documents indexed for your workers.</p>
            <Link className="btn btn-secondary card-action" href="/portal/knowledge">
              Open Knowledge
            </Link>
          </article>
          <article>
            <h3>Chat</h3>
            <p>Converse with a worker using your organisation&apos;s knowledge and memory.</p>
            <Link className="btn btn-secondary card-action" href="/portal/chat">
              Open Chat
            </Link>
          </article>
          <article>
            <h3>Memory</h3>
            <p>Review facts your workers have remembered across conversations.</p>
            <Link className="btn btn-secondary card-action" href="/portal/memory">
              Open Memory
            </Link>
          </article>
          <article>
            <h3>Administration</h3>
            <p>Manage organisation users, review your organisation profile, and audit knowledge permissions.</p>
            <Link className="btn btn-secondary card-action" href="/portal/admin">
              Open Administration
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
