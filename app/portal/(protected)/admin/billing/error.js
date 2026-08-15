'use client';

// Shared error boundary for the whole /portal/admin/billing/** section.
export default function BillingError({ reset }) {
  return (
    <main>
      <section className="section">
        <div className="container">
          <span className="eyebrow">Billing &amp; Licensing</span>
          <h1>Something went wrong loading this page.</h1>
          <p className="lead">Please try again.</p>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Retry
          </button>
        </div>
      </section>
    </main>
  );
}
