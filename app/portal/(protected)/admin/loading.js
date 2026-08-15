export default function AdminLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Administration</span>
            <h1>Loading administration...</h1>
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
