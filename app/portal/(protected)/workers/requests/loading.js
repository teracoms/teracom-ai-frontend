// Automatically shown by Next.js as a Suspense fallback while the async
// WorkerCreationRequestsPage Server Component resolves GET /worker-creation-requests/.
export default function WorkerCreationRequestsLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Workers</span>
            <h1>Loading worker requests...</h1>
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
