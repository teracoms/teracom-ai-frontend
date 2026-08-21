// Shared Suspense fallback for the whole /portal/admin/billing/** section —
// applies to every sub-page below unless a more specific loading.js is
// added in a child folder (none is, since only the Usage & Capacity page has
// a genuine async data dependency, and this generic skeleton covers it too).
export default function BillingLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Loading...</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stat-grid stat-grid-2">
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
