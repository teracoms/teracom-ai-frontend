// Automatically shown by Next.js as a Suspense fallback while the async
// WorkerPoolsPage Server Component resolves GET /worker-pools/ and
// GET /worker-list/.
export default function WorkerPoolsLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Worker Pools</span>
            <h1>Loading your worker pools...</h1>
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
