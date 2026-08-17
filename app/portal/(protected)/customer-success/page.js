import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchContacts } from '@/lib/api/crm';
import { settle, errorMessage } from '@/lib/api/results';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Customer Success | Teracom AI Portal',
};

const VALID_HEALTH_STATUSES = ['healthy', 'at_risk', 'churned'];

/**
 * The Customer Success Manager workspace (Phase 0 Package J):
 * customers only (stage === "customer"), filterable by health status —
 * customer lifecycle tracking (objective #7). Links into the same
 * contact detail page /portal/sales builds, rather than a duplicate
 * detail route, for onboarding-task management.
 */
export default async function CustomerSuccessPage({ searchParams }) {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Customer Success</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view the customer success workspace.</p>
          </div>
        </section>
      </main>
    );
  }

  const healthFilter = VALID_HEALTH_STATUSES.includes(searchParams?.health) ? searchParams.health : undefined;

  const [contactsSettled] = await Promise.allSettled([fetchContacts(token, 'customer')]);
  const contactsResult = settle(contactsSettled);

  const customers = (contactsResult.value ?? []).filter(
    (contact) => !healthFilter || contact.health_status === healthFilter
  );

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Customer Success</span>
            <h1>Your customers and their health.</h1>
            <p className="lead">
              The Customer Success Manager workspace — every contact who has become a customer,
              filterable by health, with onboarding checklists managed from each customer&apos;s
              own page.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="workers-toolbar">
            <Link
              className={!healthFilter ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
              href="/portal/customer-success"
            >
              All
            </Link>
            {VALID_HEALTH_STATUSES.map((status) => (
              <Link
                key={status}
                className={healthFilter === status ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
                href={`/portal/customer-success?health=${status}`}
              >
                {status.replace('_', ' ')}
              </Link>
            ))}
          </div>

          {contactsResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(contactsResult.error)}
            </p>
          ) : customers.length === 0 ? (
            <EmptyState
              title="No customers yet"
              description="Customers appear here once a contact's stage is set to 'customer' from the sales workspace."
            />
          ) : (
            <ul className="activity-list">
              {customers.map((customer) => (
                <li key={customer.id}>
                  <div className="assignment-row">
                    <div>
                      <p className="activity-title">{customer.name}</p>
                      <p className="activity-meta">
                        <span className="badge">{customer.health_status || 'unset'}</span>
                        {customer.company ? ` · ${customer.company}` : ''}
                      </p>
                    </div>
                    <Link className="btn btn-secondary btn-small" href={`/portal/sales/${customer.id}`}>
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
