import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchOrganisationSummary } from '@/lib/api/dashboard';
import { fetchOrganisations } from '@/lib/api/organisations';
import { isForbidden, errorMessage } from '@/lib/api/results';
import OrganisationSummaryCard from '@/components/portal/OrganisationSummaryCard';
import FederationEnabledToggle from '@/components/portal/FederationEnabledToggle';
import CreateSubOrganisationForm from '@/components/portal/CreateSubOrganisationForm';

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

  let subOrganisations = [];
  if (!restricted && !loadError && organisation) {
    try {
      const all = await fetchOrganisations(token);
      subOrganisations = all.filter((org) => org.parent_organisation_id === organisation.id);
    } catch {
      // Same-request GET /organisations/ already succeeded once above via
      // fetchOrganisationSummary; a failure here just means an empty list.
    }
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Organisation</span>
            <h1>Your organisation.</h1>
            <p className="lead">
              Your organisation&apos;s profile, its federation-consultation setting, and any
              sub-organisation you&apos;ve created underneath it.
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

      {!restricted && !loadError && organisation && (
        <section className="section">
          <div className="container">
            <div className="section-heading left">
              <span className="eyebrow">Sub-organisations</span>
              <h2>Manage multiple entities under one umbrella.</h2>
              <p>For an enterprise customer running more than one named organisation.</p>
            </div>
            {subOrganisations.length === 0 ? (
              <p className="activity-meta">No sub-organisations yet.</p>
            ) : (
              <ul className="activity-list">
                {subOrganisations.map((org) => (
                  <li key={org.id}>
                    <div className="assignment-row">
                      <span className="activity-title">{org.name}</span>
                      <span className="activity-meta">{org.slug} · {org.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: '28px' }}>
              <CreateSubOrganisationForm />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
