import { getPortalContactSessionToken } from '@/lib/api/portalContactAuth';
import { fetchPortalContactDashboard } from '@/lib/api/portalContactDashboard';
import { errorMessage } from '@/lib/api/results';
import PortalDashboardWidget from '@/components/customer-portal/PortalDashboardWidget';

export const metadata = {
  title: 'Dashboard | Teracom AI Customer Portal',
};

export default async function CustomerPortalDashboardPage() {
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

  let summary;
  try {
    summary = await fetchPortalContactDashboard(token);
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
            <h1>Your dashboard.</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <PortalDashboardWidget summary={summary} />
        </div>
      </section>
    </main>
  );
}
