'use client';

// Safety-net boundary for genuinely unexpected failures. Expected failure
// modes (backend unreachable, 403, empty data) are already caught and
// rendered inline per-section in page.js — this only triggers for a real
// bug (e.g. an unhandled exception during render).
export default function CtoOrchestrationError({ reset }) {
  return (
    <main>
      <section className="section">
        <div className="container">
          <span className="eyebrow">Orchestration</span>
          <h1>Something went wrong loading orchestration.</h1>
          <p className="lead">Please try again.</p>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Retry
          </button>
        </div>
      </section>
    </main>
  );
}
