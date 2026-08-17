'use client';

export default function OperationsError({ reset }) {
  return (
    <main>
      <section className="section">
        <div className="container">
          <span className="eyebrow">Operations</span>
          <h1>Something went wrong loading the Operations workspace.</h1>
          <p className="lead">Please try again.</p>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Retry
          </button>
        </div>
      </section>
    </main>
  );
}
