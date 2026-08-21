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
              A guided flow — every renewal requires human approval, so a wizard fits this task
              regardless of how the request is phrased.
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
