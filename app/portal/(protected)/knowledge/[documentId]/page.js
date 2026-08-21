import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchDocument, fetchKnowledgeMetadata } from '@/lib/api/knowledge';
import { fetchWorkerList, fetchWorkerKnowledge } from '@/lib/api/workers';
import { settle, errorMessage } from '@/lib/api/results';
import { ApiError } from '@/lib/api/client';
import KnowledgeAssignedWorkers from '@/components/portal/KnowledgeAssignedWorkers';
import DocumentActions from '@/components/portal/DocumentActions';
import KnowledgeMetadataForm from '@/components/portal/KnowledgeMetadataForm';

export const metadata = {
  title: 'Document | Teracom AI Portal',
};

/**
 * teracom-ai-backend has no "which workers is this document assigned to"
 * endpoint — only the reverse, GET /worker-knowledge/{worker_id} (already
 * used by Package 3's worker detail page). This computes the same
 * relationship from the worker side: fetch the org's worker list, then each
 * worker's assigned-knowledge list, and keep the workers whose list contains
 * this document. Bounded by worker count (small per organisation today,
 * §B.5.7) — see KNOWLEDGE_IMPLEMENTATION_REPORT.md §5 for the scale caveat.
 */
async function fetchAssignedWorkers(token, documentId) {
  const workers = await fetchWorkerList(token);

  const perWorkerKnowledge = await Promise.all(
    workers.map((worker) =>
      fetchWorkerKnowledge(token, worker.id).catch(() => [])
    )
  );

  return workers.filter((worker, index) =>
    (perWorkerKnowledge[index] ?? []).some((item) => item.id === documentId)
  );
}

export default async function DocumentDetailPage({ params }) {
  const { documentId } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Knowledge</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view this document.</p>
          </div>
        </section>
      </main>
    );
  }

  const isAdmin = isAtLeastRole(decodeJwtPayload(token)?.role, 'admin');

  const [documentResult, assignedResult, metadataResult] = await Promise.allSettled([
    fetchDocument(token, documentId),
    fetchAssignedWorkers(token, documentId),
    fetchKnowledgeMetadata(token, documentId),
  ]);

  const document = settle(documentResult);
  const assigned = settle(assignedResult);
  const metadata = settle(metadataResult);

  // GET /documents/{id} is ownership-checked backend-side
  // (auth/organisation.get_owned_knowledge) — a document that doesn't exist
  // or belongs to another organisation returns 404 or 403. Both collapse to
  // the same "not found" message, same precedent as the Workers detail page,
  // so a cross-tenant ID can't be distinguished from a nonexistent one.
  if (document.error) {
    const notFound =
      document.error instanceof ApiError && [403, 404].includes(document.error.status);

    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Knowledge</span>
            <h1>{notFound ? 'Document not found.' : 'Unable to load this document.'}</h1>
            <p className="lead">
              {notFound
                ? "This document doesn't exist, or belongs to a different organisation."
                : errorMessage(document.error)}
            </p>
            <Link className="btn btn-secondary" href="/portal/knowledge">
              Back to Knowledge
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const doc = document.value;

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Knowledge</span>
            <h1>{doc.title}</h1>
            <p className="lead">
              <span className="badge">{doc.source}</span>
            </p>
          </div>
          <div className="hero-actions">
            <Link className="btn btn-secondary" href="/portal/knowledge">
              Back to Knowledge
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Content</span>
            <h2>What&apos;s indexed.</h2>
          </div>
          <div className="document-content">{doc.content}</div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Assignments</span>
            <h2>Assigned workers.</h2>
          </div>
          {assigned.error ? (
            <p className="form-error" role="alert">
              {errorMessage(assigned.error)}
            </p>
          ) : (
            <KnowledgeAssignedWorkers workers={assigned.value} />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Classification</span>
            <h2>Document type, sensitivity, and tags.</h2>
            <p>
              Tags matter beyond labelling — a department&apos;s own{' '}
              <code>knowledge_assignment</code> governance rule automatically grants every worker
              in it access to knowledge tagged with one of its resolved tags. See{' '}
              <Link href="/portal/admin/governance">Governance</Link>.
            </p>
          </div>
          {metadata.error ? (
            <p className="form-error" role="alert">
              {errorMessage(metadata.error)}
            </p>
          ) : (
            <KnowledgeMetadataForm documentId={documentId} metadata={metadata.value} canEdit={isAdmin} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Actions</span>
            <h2>Manage this document.</h2>
          </div>
          <DocumentActions documentId={documentId} canDelete={isAdmin} />
        </div>
      </section>
    </main>
  );
}
