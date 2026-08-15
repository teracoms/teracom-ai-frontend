export default function DocumentDetailLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Knowledge</span>
            <h1>Loading document...</h1>
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
