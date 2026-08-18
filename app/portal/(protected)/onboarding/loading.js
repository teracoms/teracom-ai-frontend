// Automatically shown by Next.js as a Suspense fallback while
// OnboardingPage resolves GET /organisation-onboarding-tasks/.
export default function OnboardingLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Onboarding</span>
            <h1>Loading your checklist...</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="skeleton" aria-hidden="true" style={{ height: '2rem', marginBottom: '0.75rem' }} />
          <div className="skeleton" aria-hidden="true" style={{ height: '2rem', marginBottom: '0.75rem' }} />
          <div className="skeleton" aria-hidden="true" style={{ height: '2rem' }} />
        </div>
      </section>
    </main>
  );
}
