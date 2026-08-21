// Automatically shown by Next.js as a Suspense fallback for NewWorkerPage —
// present for consistency with sibling routes, though this page's own render
// is synchronous (no backend call precedes the admin-gate check) so this
// rarely, if ever, actually appears.
export default function NewWorkerLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Workers</span>
            <h1>Loading...</h1>
          </div>
        </div>
      </section>
    </main>
  );
}
