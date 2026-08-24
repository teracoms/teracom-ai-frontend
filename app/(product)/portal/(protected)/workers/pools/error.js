'use client';

// Safety-net boundary for genuinely unexpected failures. Expected failure
// modes (backend unreachable, empty list) are already caught and rendered
// inline in page.js — this only triggers for a real bug during render.
export default function WorkerPoolsError({ reset }) {
  return (
    <main>
      <section className="section">
        <div className="container">
          <span className="eyebrow">Worker Pools</span>
          <h1>Something went wrong loading your worker pools.</h1>
          <p className="lead">Please try again.</p>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Retry
          </button>
        </div>
      </section>
    </main>
  );
}
