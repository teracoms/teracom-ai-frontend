import Link from 'next/link';

import { WorkersIcon, StatusDot } from '@/components/portal/icons';

// Mirrors WorkerCard.js's shape (badge + title + role + action, and now
// its icon/status-dot treatment too — "Platform Review Wave 3" worker-
// visualisation pass), but links into the chat flow instead of the worker
// detail page — a chat worker picker is structurally the same card shape
// as the worker list, just a different destination.
export default function ChatWorkerCard({ worker }) {
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
      <Link className="btn btn-primary" href={`/portal/chat/${worker.id}`}>
        Start Chatting
      </Link>
    </article>
  );
}
