import { getSessionToken } from '@/lib/api/auth';
import { fetchSupportRequests } from '@/lib/api/supportRequests';
import { errorMessage } from '@/lib/api/results';
import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';
import SupportRequestPanel from '@/components/portal/SupportRequestPanel';

export const metadata = {
  title: 'Support Cases | Technical Support OS | Teracom AI Portal',
};

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- reuses the real, existing
 * SupportRequest backend (Phase 0 Package O, api/support_requests.py) and
 * the same SupportRequestPanel component /portal/support already uses,
 * rather than inventing a second "Support Case" model. Honest limitation:
 * SupportRequest carries no department/OS scope in the real schema today,
 * so this shows the same org-wide list /portal/support shows — not a
 * Technical-Support-filtered subset, since no real signal exists to filter
 * on yet.
 */
export default async function SupportCasesPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Technical Support OS</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
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
      <>
        <TechnicalSupportOSNav />
        <main>
          <section className="section">
            <div className="container">
              <p className="form-error" role="alert">
                {errorMessage(error)}
              </p>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <TechnicalSupportOSNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Technical Support OS</span>
              <h1>Support Cases</h1>
              <p className="lead">
                Every customer support request and incident report — the same real inbox
                /portal/support shows; no department-level filtering exists in the backend yet.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <SupportRequestPanel requests={requests ?? []} showContactColumn />
          </div>
        </section>
      </main>
    </>
  );
}
