export default function MediaCentreLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Media Centre</span>
            <h1>Loading the Media Centre...</h1>
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
