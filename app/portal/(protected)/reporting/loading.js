// Automatically shown by Next.js as a Suspense fallback while the async
// ReportingPage Server Component resolves its backend calls.
export default function ReportingLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Reporting</span>
            <h1>Loading your reports...</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stat-grid-2">
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
