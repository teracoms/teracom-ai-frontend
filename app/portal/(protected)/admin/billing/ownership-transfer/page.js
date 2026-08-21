import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchOrganisationSummary } from '@/lib/api/dashboard';
import OwnershipTransferWizard from '@/components/portal/OwnershipTransferWizard';

export const metadata = {
  title: 'Ownership Transfer | Teracom AI Portal',
};

export default async function OwnershipTransferPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to request an ownership transfer.</p>
          </div>
        </section>
      </main>
    );
  }

  // Belt-and-braces beyond the parent admin layout's role gate — see
  // BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md §9 for why a layout that
  // renders a different tree instead of `{children}` does not, by itself,
  // stop this page's own Server Component (and its real fetch below) from
  // executing for a non-admin request.
  if (!isAtLeastRole(decodeJwtPayload(token)?.role, 'admin')) {
    return null;
  }

  let organisation = null;
  try {
    organisation = await fetchOrganisationSummary(token);
  } catch {
    // Non-fatal — the wizard still renders; "Current Ownership" just shows
    // "Unavailable" rather than blocking the whole flow on this one read.
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Request an ownership transfer.</h1>
            <p className="lead">
              A guided flow, per docs/governance/UX_VISION.md §5 — human approval is mandatory
              here (LICENSING_MODEL_V1.md §11) regardless of natural-language feasibility.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <OwnershipTransferWizard organisation={organisation} />
        </div>
      </section>
    </main>
  );
}
