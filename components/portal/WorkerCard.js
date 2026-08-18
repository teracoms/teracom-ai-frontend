import Link from 'next/link';

import { WorkersIcon, StatusDot } from '@/components/portal/icons';

// Reuses the store page's .product-card/.badge visual language (see
// app/store/page.js) rather than inventing a new card style — a worker list
// is structurally the same shape as a product list (badge + title + description
// + action), so the existing design system component fits directly. The
// icon + status dot are additive only (TERACOM_REVIEW_BACKLOG.md-style
// "Platform Review Wave 3" worker-visualisation pass) — StatusDot already
// existed in icons.js since Wave 1 but was never actually wired into any
// worker-facing view until now.
export default function WorkerCard({ worker }) {
  return (
    <article className="product-card">
      <div>
        <div className="worker-card-header">
          <span className="stat-tile-icon"><WorkersIcon /></span>
          <span className="badge">
            <StatusDot status={worker.status} />
            {worker.status}
          </span>
        </div>
        <h3>{worker.name}</h3>
        <p>{worker.role}</p>
      </div>
      <Link className="btn btn-secondary" href={`/portal/workers/${worker.id}`}>
        View Worker
      </Link>
    </article>
  );
}
