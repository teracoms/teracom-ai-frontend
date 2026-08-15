import Link from 'next/link';

// Reuses the store page's .product-card/.badge visual language, same
// precedent WorkerCard.js established in Package 3 — a knowledge document
// list is structurally the same shape as a worker list (badge + title +
// preview + action).
export default function KnowledgeCard({ document }) {
  const preview = document.content.length > 160
    ? `${document.content.slice(0, 160).trim()}...`
    : document.content;

  return (
    <article className="product-card">
      <div>
        <span className="badge">{document.source}</span>
        <h3>{document.title}</h3>
        <p>{preview}</p>
      </div>
      <Link className="btn btn-secondary" href={`/portal/knowledge/${document.id}`}>
        View Document
      </Link>
    </article>
  );
}
