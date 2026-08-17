'use client';

export default function MediaCentreError({ reset }) {
  return (
    <main>
      <section className="section">
        <div className="container">
          <span className="eyebrow">Media Centre</span>
          <h1>Something went wrong loading the Media Centre.</h1>
          <p className="lead">Please try again.</p>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Retry
          </button>
        </div>
      </section>
    </main>
  );
}
