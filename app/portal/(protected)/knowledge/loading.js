// Automatically shown by Next.js as a Suspense fallback while the async
// KnowledgePage Server Component resolves its backend calls.
export default function KnowledgeLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Knowledge</span>
            <h1>Loading your knowledge base...</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stat-grid stat-grid-3">
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
