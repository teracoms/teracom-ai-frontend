import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { fetchOrganisationCommunications } from '@/lib/api/communications';
import { errorMessage } from '@/lib/api/results';
import CommunicationsPanel from '@/components/portal/CommunicationsPanel';

export const metadata = {
  title: 'Communications | Teracom AI Portal',
};

/**
 * "Package EMAIL1" objective #12 (Communication timeline integration)
 * — an organisation admin's own view of every notification sent
 * about their organisation (welcome, trial lifecycle, onboarding),
 * with its real delivery outcome. Same belt-and-braces role check
 * every other admin page here uses.
 */
export default async function AdminCommunicationsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Communications</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view communications.</p>
          </div>
        </section>
      </main>
    );
  }

  if (decodeJwtPayload(token)?.role !== 'admin') {
    return null;
  }

  let communications = [];
  let loadError = null;
  try {
    communications = await fetchOrganisationCommunications(token);
  } catch (error) {
    loadError = error;
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Communications</span>
            <h1>Everything sent to your organisation.</h1>
            <p className="lead">
              Welcome emails, trial lifecycle notices, and onboarding milestones — with their real
              delivery outcome (sent, failed, or logged when no email provider is configured).
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loadError ? (
            <p className="form-error" role="alert">
              {errorMessage(loadError)}
            </p>
          ) : (
            <CommunicationsPanel
              entries={communications}
              emptyDescription="Nothing has been sent to your organisation yet."
            />
          )}
        </div>
      </section>
    </main>
  );
}
