export default function MemoryDetailLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Memory</span>
            <h1>Loading memory...</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="document-content skeleton" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
