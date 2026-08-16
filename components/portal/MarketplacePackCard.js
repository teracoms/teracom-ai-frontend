import Link from 'next/link';

// Mirrors WorkerCard's .product-card/.badge shape (see that component's own
// note on reusing the store page's visual language) rather than inventing a
// new card style for the Marketplace's first screen.
//
// `rationale` (Phase 0 Package E, RECOMMENDATION_ENGINE_MVP_V1.md §2) is only
// passed when this card renders inside the Recommended Worker Packs section
// — a plain catalogue card has none, since rationale only makes sense next
// to a ranked recommendation. When present, the pack's link carries
// `?ref=recommendation` so the detail page's own read (Package E's
// GET /marketplace/packs/{slug}?source=recommendation) logs the pack-view
// signal RECOMMENDATION_ENGINE_MVP_V1.md §7 step 4 says to start capturing
// now.
export default function MarketplacePackCard({ pack, rationale }) {
  const href = rationale
    ? `/portal/marketplace/${pack.slug}?ref=recommendation`
    : `/portal/marketplace/${pack.slug}`;

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
        {rationale && rationale.length > 0 && (
          <p className="eyebrow">{rationale.join(' · ')}</p>
        )}
      </div>
      <Link className="btn btn-secondary" href={href}>
        {pack.accessible ? 'View Pack' : 'View Details'}
      </Link>
    </article>
  );
}
