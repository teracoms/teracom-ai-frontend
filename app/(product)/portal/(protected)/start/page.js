import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import InitiativeForm from '@/components/portal/InitiativeForm';

export const metadata = {
  title: 'Start an Initiative | Teracom AI Portal',
};

// CUSTOMER_EXPERIENCE_REDESIGN_V1 -- the Initiative flow (objective item 2).
// Customers think in outcomes ("build a website"), not mechanisms ("create
// task, assign worker") -- this page asks for exactly one thing, a plain
// description of what they want, and hands the rest to
// POST /api/portal/initiative.
export default async function StartInitiativePage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Start an Initiative</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="hero hero-product hero-compact">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">
              <Link href="/portal/dashboard">&larr; Dashboard</Link>
            </span>
            <h1>What would you like Teracom AI to do?</h1>
            <p className="lead">
              Describe the outcome you want. Teracom AI will start a project for it right away.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <InitiativeForm />
        </div>
      </section>
    </main>
  );
}
