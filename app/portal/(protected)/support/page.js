import { getSessionToken } from '@/lib/api/auth';
import { fetchSupportRequests } from '@/lib/api/supportRequests';
import { errorMessage } from '@/lib/api/results';
import SupportRequestPanel from '@/components/portal/SupportRequestPanel';

export const metadata = {
  title: 'Support | Teracom AI Portal',
};

/**
 * The org-wide staff support inbox (Phase 0 Package O, objective #12) —
 * mirrors /portal/operations's own org-wide-workspace shape. Every
 * support request across every contact, not scoped to one department.
 */
export default async function SupportInboxPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Support</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view the support inbox.</p>
          </div>
        </section>
      </main>
    );
  }

  let requests;
  try {
    requests = await fetchSupportRequests(token);
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
            <span className="eyebrow">Support</span>
            <h1>Support inbox.</h1>
            <p className="lead">Every customer support request and incident report, across every contact.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SupportRequestPanel requests={requests ?? []} showContactColumn />
        </div>
      </section>
    </main>
  );
}
