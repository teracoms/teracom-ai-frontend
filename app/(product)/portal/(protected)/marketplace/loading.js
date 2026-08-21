// Automatically shown by Next.js as a Suspense fallback while the async
// MarketplacePage Server Component resolves GET /marketplace/packs.
export default function MarketplaceLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Marketplace</span>
            <h1>Loading Worker Packs...</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container product-grid">
          <div className="product-card skeleton" aria-hidden="true" />
          <div className="product-card skeleton" aria-hidden="true" />
          <div className="product-card skeleton" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
