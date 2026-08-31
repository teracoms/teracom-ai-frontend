export default function VendorSourcesLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Knowledge</span>
            <h1>Loading vendor sources...</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container product-grid">
          <div className="product-card skeleton" aria-hidden="true" />
          <div className="product-card skeleton" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
