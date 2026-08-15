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
          <p className="form-note-banner" role="note">
            This is illustrative example data, not a real, signed, or backend-verified licence
            record — teracom-ai-backend has no licence data model today. See{' '}
            BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md for the backend work this would need.
          </p>
        </div>
      </section>
    </main>
  );
}
