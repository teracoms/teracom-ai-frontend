// Automatically shown by Next.js as a Suspense fallback while the async
// DashboardPage Server Component resolves its backend calls.
export default function DashboardLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Dashboard</span>
            <h1>Loading your organisation overview...</h1>
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
