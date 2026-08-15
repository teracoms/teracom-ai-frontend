import Link from 'next/link';

// Reuses the store page's .product-card/.badge visual language (see
// app/store/page.js) rather than inventing a new card style — a worker list
// is structurally the same shape as a product list (badge + title + description
// + action), so the existing design system component fits directly.
export default function WorkerCard({ worker }) {
  return (
    <article className="product-card">
      <div>
        <span className="badge">{worker.status}</span>
        <h3>{worker.name}</h3>
        <p>{worker.role}</p>
      </div>
      <Link className="btn btn-secondary" href={`/portal/workers/${worker.id}`}>
        View Worker
      </Link>
    </article>
  );
}
