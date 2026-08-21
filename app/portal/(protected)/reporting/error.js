'use client';

// Safety-net boundary for genuinely unexpected failures. Expected failure
// modes are already caught and rendered inline per-card in page.js — this
// only triggers for a real bug (e.g. an unhandled exception during render).
export default function ReportingError({ reset }) {
  return (
    <main>
      <section className="section">
        <div className="container">
          <span className="eyebrow">Reporting</span>
          <h1>Something went wrong loading your reports.</h1>
          <p className="lead">Please try again.</p>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Retry
          </button>
        </div>
      </section>
    </main>
  );
}
