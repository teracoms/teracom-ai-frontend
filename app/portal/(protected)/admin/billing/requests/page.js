import Link from 'next/link';

import { getExampleRequestHistory } from '@/lib/licensing/referenceLicence';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Requests & History | Teracom AI Portal',
};

/**
 * docs/governance/BILLING_AND_LICENSING_UX.md's Navigation section lists
 * "Requests" and "Approval History" as two separate sections; they are
 * combined into one page here — entry points to the two request wizards,
 * plus a history table below — a deliberate consolidation for this package's
 * scope, not a missing feature. There is nowhere real for a submitted
 * wizard request to land (see WizardShell.js), so the table below shows
 * static, clearly-labelled example rows rather than fabricating a session
 * that reflects whatever was just submitted, which would misrepresent
 * persistence that doesn't exist.
 */
export default function BillingRequestsPage() {
  const history = getExampleRequestHistory();

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Requests &amp; approval history.</h1>
            <p className="lead">
              Start a new request, or review what&apos;s happened on this licence so far.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container feature-grid">
          <article>
            <h3>Worker Pack</h3>
            <p>Request additional worker capacity for your organisation.</p>
            <Link className="btn btn-secondary card-action" href="/portal/admin/billing/worker-pack">
              Start Request
            </Link>
          </article>
          <article>
            <h3>Renewal</h3>
            <p>Request a renewal up to 90 days before your licence expires.</p>
            <Link className="btn btn-secondary card-action" href="/portal/admin/billing/renewal">
              Start Request
            </Link>
          </article>
          <article>
            <h3>Ownership Transfer</h3>
            <p>Request a transfer of this licence to new ownership.</p>
            <Link
              className="btn btn-secondary card-action"
              href="/portal/admin/billing/ownership-transfer"
            >
              Start Request
            </Link>
          </article>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Approval history</span>
            <h2>What&apos;s happened so far.</h2>
          </div>

          {history.length === 0 ? (
            <EmptyState
              title="No requests yet"
              description="Requests you submit above will appear here once a backend workflow exists to track them."
            />
          ) : (
            <ul className="activity-list">
              {history.map((item) => (
                <li key={item.id}>
                  <p className="activity-title">
                    {item.type} — {item.status}
                  </p>
                  <p className="activity-meta">
                    {item.date} · {item.note}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="illustrative-data-banner" role="note">
            <strong>Illustrative data</strong>
            This approval history is illustrative example data, not a real API response. The real
            licensing-request lifecycle (submit, review, approve/reject) already exists and works
            — this specific page has not yet been wired to call it.
          </p>
        </div>
      </section>
    </main>
  );
}
