import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { fetchGovernancePolicies } from '@/lib/api/governancePolicies';
import { errorMessage } from '@/lib/api/results';
import GovernancePolicyTable from '@/components/portal/GovernancePolicyTable';

export const metadata = {
  title: 'Governance | Teracom AI Portal',
};

/**
 * Organisation policy visibility (Phase 0 Package PQR, objective #7)
 * — lives under /portal/admin, same belt-and-braces role check every
 * other admin page here uses (BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md §9).
 */
export default async function AdminGovernancePage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Governance</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view governance policies.</p>
          </div>
        </section>
      </main>
    );
  }

  if (decodeJwtPayload(token)?.role !== 'admin') {
    return null;
  }

  let policies;
  try {
    policies = (await fetchGovernancePolicies(token)).policies;
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
            <span className="eyebrow">Governance</span>
            <h1>Policy registry.</h1>
            <p className="lead">Every action this platform gates by role, and what role it requires.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <GovernancePolicyTable policies={policies ?? []} />
        </div>
      </section>
    </main>
  );
}
