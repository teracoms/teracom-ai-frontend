export default function UploadKnowledgeLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Knowledge</span>
            <h1>Loading upload form...</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container worker-detail-columns">
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
