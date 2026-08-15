import Link from 'next/link';

// Mirrors WorkerCard.js's shape (badge + title + role + action), but links
// into the chat flow instead of the worker detail page — a chat worker
// picker is structurally the same card shape as the worker list, just a
// different destination.
export default function ChatWorkerCard({ worker }) {
  return (
    <article className="product-card">
      <div>
        <span className="badge">{worker.status}</span>
        <h3>{worker.name}</h3>
        <p>{worker.role}</p>
      </div>
      <Link className="btn btn-primary" href={`/portal/chat/${worker.id}`}>
        Start Chatting
      </Link>
    </article>
  );
}
