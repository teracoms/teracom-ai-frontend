import Link from 'next/link';

import { getReferenceLicence, TIER_ALLOCATIONS } from '@/lib/licensing/referenceLicence';

export const metadata = {
  title: 'Licence Details | Teracom AI Portal',
};

/**
 * Requirement #2 — a read-only view of every entitlement and licence
 * metadata field the reference data model has. Per
 * LICENSING_MODEL_V1.md §8, a real licence is "a signed artefact issued by
 * Teracom, not a database row a customer can edit" — this page is
 * accordingly display-only with no edit affordance, matching that decided
 * principle even though the underlying data here is illustrative.
 */
export default function LicenceDetailsPage() {
  const licence = getReferenceLicence();
  const allocation = TIER_ALLOCATIONS[licence.tier];

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Licence details.</h1>
            <p className="lead">
              Every entitlement and licence metadata field, read-only — a licence is a signed
              artefact issued by Teracom, not something edited here.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="wizard-step-body">
            <dl>
              <dt>Product tier</dt>
              <dd>{licence.tier}</dd>
              <dt>Hosting model</dt>
              <dd>{licence.hostingModel}</dd>
              <dt>Status</dt>
              <dd>{licence.status}</dd>
              <dt>Issued</dt>
              <dd>{licence.issuedDate}</dd>
              <dt>Expires</dt>
              <dd>{licence.expiryDate}</dd>
              <dt>Worker allocation</dt>
              <dd>{allocation.workers}</dd>
              <dt>User allocation</dt>
              <dd>{licence.userAllocationLabel}</dd>
              <dt>Organisation allocation</dt>
              <dd>{allocation.organisations}</dd>
              <dt>Billing cadence</dt>
              <dd>Monthly or annual</dd>
            </dl>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <p className="illustrative-data-banner" role="note">
            <strong>Illustrative data</strong>
            This page still renders illustrative example licence data, not a real API response.
            teracom-ai-backend now has real <code>Licence</code>/<code>Entitlement</code>/<code>Plan</code> models
            (live-verified elsewhere — see the real Licensing summary on{' '}
            <Link href="/portal/finance">/portal/finance</Link>) — this specific page has not yet
            been wired to call them. See BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md for the
            remaining frontend work.
          </p>
        </div>
      </section>
    </main>
  );
}
