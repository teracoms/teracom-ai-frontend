'use client';

export default function AdminPermissionsError({ reset }) {
  return (
    <main>
      <section className="section">
        <div className="container">
          <span className="eyebrow">Permissions</span>
          <h1>Something went wrong loading permissions.</h1>
          <p className="lead">Please try again.</p>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Retry
          </button>
        </div>
      </section>
    </main>
  );
}
