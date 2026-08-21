// Automatically shown by Next.js as a Suspense fallback while the async
// DigitalWorkforcePage Server Component resolves its backend calls.
export default function DigitalWorkforceLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Digital Workforce</span>
            <h1>Loading your workforce...</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stat-grid">
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
