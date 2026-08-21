export default function SessionDetailLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Chat session</span>
            <h1>Loading session...</h1>
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
