// Automatically shown by Next.js as a Suspense fallback while the async
// TasksPage Server Component resolves its backend calls.
export default function TasksLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Tasks</span>
            <h1>Loading your tasks...</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stat-grid">
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
          <div className="stat-tile skeleton" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
