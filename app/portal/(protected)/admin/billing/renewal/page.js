import { getReferenceLicence } from '@/lib/licensing/referenceLicence';
import RenewalWizard from '@/components/portal/RenewalWizard';

export const metadata = {
  title: 'Renewal | Teracom AI Portal',
};

export default function RenewalPage() {
  const licence = getReferenceLicence();

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Request a renewal.</h1>
            <p className="lead">
              A guided flow — LICENSING_MODEL_V1.md §9 requires human approval for every renewal,
              so a wizard fits this task regardless of natural-language feasibility
              (docs/governance/UX_VISION.md §5).
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <RenewalWizard licence={licence} />
        </div>
      </section>
    </main>
  );
}
