'use client';

// Safety-net boundary. This page's content is static (no backend calls), so
// this should only ever trigger for a real bug, not an expected failure mode.
export default function DocumentationError({ reset }) {
  return (
    <main>
      <section className="section">
        <div className="container">
          <span className="eyebrow">Documentation</span>
          <h1>Something went wrong loading documentation.</h1>
          <p className="lead">Please try again.</p>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Retry
          </button>
        </div>
      </section>
    </main>
  );
}
