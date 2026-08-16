import Link from 'next/link';

// Mirrors WorkerCard's .product-card/.badge shape (see that component's own
// note on reusing the store page's visual language) rather than inventing a
// new card style for the Marketplace's first screen.
export default function MarketplacePackCard({ pack }) {
  return (
    <article className="product-card">
      <div>
        <span className="badge">{pack.industry}</span>
        {pack.featured && <span className="badge">Featured</span>}
        {!pack.accessible && pack.min_tier && (
          <span className="badge">{pack.min_tier} tier required</span>
        )}
        <h3>{pack.name}</h3>
        <p>{pack.description}</p>
      </div>
      <Link className="btn btn-secondary" href={`/portal/marketplace/${pack.slug}`}>
        {pack.accessible ? 'View Pack' : 'View Details'}
      </Link>
    </article>
  );
}
