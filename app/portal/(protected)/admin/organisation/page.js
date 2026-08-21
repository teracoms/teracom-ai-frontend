import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchOrganisationSummary } from '@/lib/api/dashboard';
import { isForbidden, errorMessage } from '@/lib/api/results';
import OrganisationSummaryCard from '@/components/portal/OrganisationSummaryCard';
import FederationEnabledToggle from '@/components/portal/FederationEnabledToggle';

export const metadata = {
  title: 'Organisation | Teracom AI Portal',
};

/**
 * Reuses fetchOrganisationSummary (Package 2, lib/api/dashboard.js) and
 * OrganisationSummaryCard (Package 2) as-is — this is the exact same
 * GET /organisations/ call and rendering Dashboard already built, since
 * neither the endpoint nor the data it returns (name, slug only — no other
 * organisation profile field exists backend-side) changes based on which
 * page shows it. See ADMIN_IMPLEMENTATION_REPORT.md §2 for why this page
 * still exists as a dedicated route despite the overlap: §C.11/§C.3 name it
 * explicitly, and this is the one place in the app framed as the
 * organisation's own settings/profile page rather than a dashboard widget.
 */
export default async function AdminOrganisationPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Organisation</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view your organisation.</p>
          </div>
        </section>
      </main>
    );
  }

  // Belt-and-braces beyond the parent admin layout's role gate — see
  // admin/billing/usage/page.js's own identical comment and
  // TERACOM_REVIEW_BACKLOG.md WBL-013.
  if (!isAtLeastRole(decodeJwtPayload(token)?.role, 'admin')) {
    return null;
  }

  let organisation = null;
  let loadError = null;

  try {
    organisation = await fetchOrganisationSummary(token);
  } catch (error) {
    loadError = error;
  }

  const restricted = isForbidden(loadError);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Organisation</span>
            <h1>Your organisation.</h1>
            <p className="lead">
              A read-only profile — teracom-ai-backend records only a name, slug, and (as of
              Phase 0 Package L) a federation-consultation setting per organisation today, no
              plan, seats or billing fields yet.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loadError && !restricted ? (
            <p className="form-error" role="alert">
              {errorMessage(loadError)}
            </p>
          ) : (
            <OrganisationSummaryCard organisation={organisation} restricted={restricted} />
          )}
        </div>
      </section>

      {!restricted && !loadError && organisation && (
        <section className="section alt">
          <div className="container">
            <div className="section-heading left">
              <span className="eyebrow">Governance</span>
              <h2>Federation consultation.</h2>
              <p>
                Phase 0 Package L, objective #6 — turn Federation consultation off for this
                organisation entirely, regardless of licence tier.
              </p>
            </div>
            <FederationEnabledToggle organisation={organisation} />
          </div>
        </section>
      )}
    </main>
  );
}
