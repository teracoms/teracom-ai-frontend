export default function CustomerSuccessLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Customer Success</span>
            <h1>Loading customer success workspace...</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stat-tile skeleton" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
