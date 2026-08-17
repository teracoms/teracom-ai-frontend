import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchContact } from '@/lib/api/crm';
import { fetchProposals, fetchQuotes, fetchContracts } from '@/lib/api/dealDocuments';
import { fetchOnboardingTasks } from '@/lib/api/onboardingTasks';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchPortalAccountForContact } from '@/lib/api/portalContactAccounts';
import { fetchSupportRequests } from '@/lib/api/supportRequests';
import { settle, errorMessage } from '@/lib/api/results';
import ContactDetail from '@/components/portal/ContactDetail';
import DealDocumentPanel from '@/components/portal/DealDocumentPanel';
import OnboardingChecklist from '@/components/portal/OnboardingChecklist';
import PortalAccountPanel from '@/components/portal/PortalAccountPanel';
import SupportRequestPanel from '@/components/portal/SupportRequestPanel';

export const metadata = {
  title: 'Contact | Teracom AI Portal',
};

/**
 * Contact detail (Phase 0 Package J): stage/health controls, proposal/
 * quote/contract management (each requiring human approval — governance),
 * and an onboarding checklist once the contact is a customer (objective
 * #6). Reused by both the Sales and Customer Success workspaces.
 */
export default async function ContactDetailPage({ params }) {
  const { contactId } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Contact</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view this contact.</p>
          </div>
        </section>
      </main>
    );
  }

  const [
    contactResult,
    proposalsResult,
    quotesResult,
    contractsResult,
    tasksResult,
    workersResult,
    portalAccountResult,
    supportRequestsResult,
  ] = await Promise.allSettled([
    fetchContact(token, contactId),
    fetchProposals(token, contactId),
    fetchQuotes(token, contactId),
    fetchContracts(token, contactId),
    fetchOnboardingTasks(token, contactId),
    fetchWorkerList(token),
    fetchPortalAccountForContact(token, contactId),
    fetchSupportRequests(token, { crm_contact_id: contactId }),
  ]);

  const contact = settle(contactResult);

  if (contact.error) {
    const notFound = contact.error instanceof ApiError && [403, 404].includes(contact.error.status);

    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Contact</span>
            <h1>{notFound ? 'Contact not found.' : 'Unable to load this contact.'}</h1>
            <p className="lead">
              {notFound
                ? "This contact doesn't exist, or belongs to a different organisation."
                : errorMessage(contact.error)}
            </p>
            <Link className="btn btn-secondary" href="/portal/sales">
              Back to Sales
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const proposals = settle(proposalsResult);
  const quotes = settle(quotesResult);
  const contracts = settle(contractsResult);
  const tasks = settle(tasksResult);
  const workers = settle(workersResult);
  const activeWorkers = (workers.value ?? []).filter((worker) => worker.status === 'active');
  const portalAccount = settle(portalAccountResult);
  const supportRequests = settle(supportRequestsResult);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Contact</span>
            <h1>{contact.value.name}</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ContactDetail contact={contact.value} />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {proposals.error ? (
            <p className="form-error" role="alert">
              {errorMessage(proposals.error)}
            </p>
          ) : (
            <DealDocumentPanel
              kind="proposal"
              contactId={contactId}
              documents={proposals.value ?? []}
              workers={activeWorkers}
            />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {quotes.error ? (
            <p className="form-error" role="alert">
              {errorMessage(quotes.error)}
            </p>
          ) : (
            <DealDocumentPanel kind="quote" contactId={contactId} documents={quotes.value ?? []} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {contracts.error ? (
            <p className="form-error" role="alert">
              {errorMessage(contracts.error)}
            </p>
          ) : (
            <DealDocumentPanel kind="contract" contactId={contactId} documents={contracts.value ?? []} />
          )}
        </div>
      </section>

      {contact.value.stage === 'customer' && (
        <section className="section">
          <div className="container">
            {tasks.error ? (
              <p className="form-error" role="alert">
                {errorMessage(tasks.error)}
              </p>
            ) : (
              <OnboardingChecklist contactId={contactId} tasks={tasks.value ?? []} />
            )}
          </div>
        </section>
      )}

      <section className="section alt">
        <div className="container">
          {portalAccount.error ? (
            <p className="form-error" role="alert">
              {errorMessage(portalAccount.error)}
            </p>
          ) : (
            <PortalAccountPanel contactId={contactId} portalAccount={portalAccount.value} />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Support</span>
            <h2>Support requests.</h2>
          </div>
          {supportRequests.error ? (
            <p className="form-error" role="alert">
              {errorMessage(supportRequests.error)}
            </p>
          ) : (
            <SupportRequestPanel requests={supportRequests.value ?? []} />
          )}
        </div>
      </section>
    </main>
  );
}
