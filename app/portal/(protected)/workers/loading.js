// Automatically shown by Next.js as a Suspense fallback while the async
// WorkersPage Server Component resolves GET /worker-list/.
export default function WorkersLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Workers</span>
            <h1>Loading your AI workforce...</h1>
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
