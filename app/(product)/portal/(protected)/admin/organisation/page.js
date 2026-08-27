import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchOrganisationSummary } from '@/lib/api/dashboard';
import { fetchOrganisations } from '@/lib/api/organisations';
import { fetchUsers } from '@/lib/api/admin';
import { fetchAIProviderConfig } from '@/lib/api/aiProviderConfig';
import { isForbidden, errorMessage } from '@/lib/api/results';
import OrganisationSummaryCard from '@/components/portal/OrganisationSummaryCard';
import FederationEnabledToggle from '@/components/portal/FederationEnabledToggle';
import CreateSubOrganisationForm from '@/components/portal/CreateSubOrganisationForm';
import Link from 'next/link';

export const metadata = {
  title: 'Organisation Profile | Teracom AI Portal',
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

  // UI_IMPLEMENTATION_SPRINT_1.md item 9 -- "business owner visibility."
  // The 5-tier role hierarchy has a real "owner" tier above "admin", but
  // self-service signup deliberately still defaults to "admin" (no
  // owner-only action exists yet to justify it as a default -- see
  // TERACOM_AI_HANDOVER_V3.md), so most organisations genuinely have no
  // owner set. Shown honestly either way, not assumed.
  let owners = [];
  if (!restricted && !loadError && organisation) {
    try {
      const users = await fetchUsers(token);
      owners = users.filter((orgUser) => orgUser.role === 'owner');
    } catch {
      // Best-effort -- the organisation profile above still renders without this.
    }
  }

  // MULTI_ORGANISATION_PLATFORM_V1 -- read-open backend-side; a
  // failure here shouldn't block the rest of this page, same
  // per-section resilience already applied to owners above.
  let aiProviderConfig = null;
  if (!restricted && !loadError && organisation) {
    try {
      aiProviderConfig = await fetchAIProviderConfig(token);
    } catch {
      // Best-effort -- the organisation profile above still renders without this.
    }
  }

  return (
    <main>
      <section className="hero hero-product hero-org-setup">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Organisation</span>
            <h1>Organisation profile.</h1>
            <p className="lead">
              The full profile behind the Dashboard&apos;s own Organisation summary card: federation
              consultation, AI provider configuration, business owner, and any sub-organisation
              you&apos;ve created underneath this one.
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
        <section className="section">
          <div className="container">
            <div className="section-heading left">
              <span className="eyebrow">Ownership</span>
              <h2>Business owner.</h2>
            </div>
            {owners.length === 0 ? (
              <p className="activity-meta">
                No user holds the &quot;owner&quot; tier for this organisation yet — every
                self-service signup starts at &quot;admin&quot;, one tier below it. Promote a user
                to owner from Admin → Users if your organisation wants one on record.
              </p>
            ) : (
              <ul className="activity-list">
                {owners.map((owner) => (
                  <li key={owner.id}>
                    <p className="activity-title">
                      {owner.first_name} {owner.last_name}
                    </p>
                    <p className="activity-meta">{owner.email}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {!restricted && !loadError && organisation && (
        <section className="section alt">
          <div className="container">
            <div className="section-heading left">
              <span className="eyebrow">Governance</span>
              <h2>Federation consultation.</h2>
              <p>
                Turn Federation consultation off for this organisation entirely, regardless of
                your licence tier.
              </p>
            </div>
            <FederationEnabledToggle organisation={organisation} />
          </div>
        </section>
      )}

      {!restricted && !loadError && organisation && aiProviderConfig && (
        <section className="section">
          <div className="container">
            <div className="section-heading left">
              <span className="eyebrow">AI Provider</span>
              <h2>AI provider routing.</h2>
              <p>
                Which model actually backs every worker&apos;s own turn in this organisation — a
                Worker is an organisational role, never a specific AI model. Currently:{' '}
                <span className="badge">{aiProviderConfig.routing_mode}</span>
              </p>
            </div>
            <Link href="/portal/admin/ai-providers" className="btn btn-secondary btn-small">
              Manage AI Providers
            </Link>
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
