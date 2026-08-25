import { getSessionToken } from '@/lib/api/auth';
import { fetchContacts } from '@/lib/api/crm';
import { settle, errorMessage } from '@/lib/api/results';
import ContactIntakeForm from '@/components/portal/ContactIntakeForm';
import ContactListView from '@/components/portal/ContactListView';
import MyOrganisationNav from '@/components/portal/MyOrganisationNav';

export const metadata = {
  title: 'Sales | Teracom AI Portal',
};

const VALID_STAGES = ['prospect', 'lead', 'customer'];

/**
 * The Sales Manager workspace (Phase 0 Package J): prospect intake
 * (objective #4) and lead management (objective #3), stage-filterable.
 */
export default async function SalesPage({ searchParams }) {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Sales</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view the sales workspace.</p>
          </div>
        </section>
      </main>
    );
  }

  const stage = VALID_STAGES.includes(searchParams?.stage) ? searchParams.stage : undefined;

  const [contactsSettled] = await Promise.allSettled([fetchContacts(token, stage)]);
  const contacts = settle(contactsSettled);

  return (
    <>
      <MyOrganisationNav />
      <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Sales</span>
            <h1>Prospects, leads, and your pipeline.</h1>
            <p className="lead">
              The Sales Manager workspace — intake new prospects, move them through the
              pipeline, and manage proposals, quotes, and contracts from each contact&apos;s own
              page.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Intake</span>
            <h2>Add a new prospect.</h2>
          </div>
          <ContactIntakeForm />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {contacts.error ? (
            <p className="form-error" role="alert">
              {errorMessage(contacts.error)}
            </p>
          ) : (
            <ContactListView contacts={contacts.value ?? []} activeStage={stage} basePath="/portal/sales" />
          )}
        </div>
      </section>
    </main>
    </>
  );
}
