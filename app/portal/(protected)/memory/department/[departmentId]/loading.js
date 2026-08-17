export default function DepartmentMemoryLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Department Memory</span>
            <h1>Loading department memory...</h1>
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
