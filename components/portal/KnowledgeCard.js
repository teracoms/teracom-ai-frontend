import Link from 'next/link';

import { KnowledgeIcon } from '@/components/portal/icons';

// CUSTOMER_UX_ACCEPTANCE_V1 -- "replace large document cards with
// compact rows... optimise for large knowledge libraries." Same
// compact console-row pattern WorkerCard.js now uses (app/globals.css)
// instead of the marketing-store .product-card this used before --
// a knowledge library with hundreds/thousands of real documents needs
// a dense list, not a 3-per-row card grid.
export default function KnowledgeCard({ document }) {
  const preview = document.content.length > 140
    ? `${document.content.slice(0, 140).trim()}...`
    : document.content;

  return (
    <div className="console-row">
      <span className="console-row-icon">
        <KnowledgeIcon />
      </span>
      <div className="console-row-main">
        <span className="console-row-title">
          {document.title}
          <span className="badge" style={{ marginBottom: 0 }}>{document.source}</span>
        </span>
        <span className="console-row-meta">{preview}</span>
      </div>
      <div className="console-row-actions">
        <Link className="btn btn-secondary btn-small" href={`/portal/knowledge/${document.id}`}>
          View
        </Link>
      </div>
    </div>
  );
}
