import { getPortalContactSessionToken } from '@/lib/api/portalContactAuth';
import { fetchPortalContactSupportRequests } from '@/lib/api/portalContactSupportRequests';
import { errorMessage } from '@/lib/api/results';
import PortalSupportRequestList from '@/components/customer-portal/PortalSupportRequestList';

export const metadata = {
  title: 'Support | Teracom AI Customer Portal',
};

export default async function CustomerPortalSupportPage() {
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

  let requests;
  try {
    requests = await fetchPortalContactSupportRequests(token);
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
            <h1>Support &amp; incidents.</h1>
            <p className="lead">
              Submitting an incident report automatically opens a tracked operations item for our
              team — it never triggers any automatic deployment or change.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <PortalSupportRequestList requests={requests ?? []} />
        </div>
      </section>
    </main>
  );
}
