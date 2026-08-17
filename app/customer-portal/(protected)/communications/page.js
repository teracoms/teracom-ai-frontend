import { getPortalContactSessionToken } from '@/lib/api/portalContactAuth';
import { fetchPortalContactCommunications } from '@/lib/api/portalContactCommunications';
import { errorMessage } from '@/lib/api/results';
import PortalCommunicationsTimeline from '@/components/customer-portal/PortalCommunicationsTimeline';

export const metadata = {
  title: 'Communications | Customer Portal',
};

export default async function CustomerPortalCommunicationsPage() {
  const token = getPortalContactSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Customer Portal</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  let entries;
  try {
    entries = await fetchPortalContactCommunications(token);
  } catch (error) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <p className="form-error" role="alert">
              {errorMessage(error)}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Customer Portal</span>
            <h1>Communications.</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <PortalCommunicationsTimeline entries={entries ?? []} />
        </div>
      </section>
    </main>
  );
}
