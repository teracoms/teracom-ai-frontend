import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchKnowledgeCatalogue } from '@/lib/api/workers';
import {
  fetchKnowledgeSummary,
  fetchKnowledgeGrowth,
  fetchKnowledgeAssignmentsSummary,
} from '@/lib/api/knowledge';
import { settle, errorMessage } from '@/lib/api/results';
import StatTile from '@/components/portal/StatTile';
import KnowledgeListView from '@/components/portal/KnowledgeListView';
import KnowledgeSearch from '@/components/portal/KnowledgeSearch';
import { KnowledgeIcon, WorkersIcon } from '@/components/portal/icons';

export const metadata = {
  title: 'Knowledge | Teracom AI Portal',
};

export default async function KnowledgePage() {
  const token = getSessionToken();

  // Defensive only: app/portal/(protected)/layout.js already guarantees a
  // valid session before this page renders — same precedent as the
  // Dashboard and Workers list pages.
  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Knowledge</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view your knowledge base.</p>
          </div>
        </section>
      </main>
    );
  }

  // Four independent backend calls, same Promise.allSettled + settle()
  // pattern the Dashboard and Workers pages already use — one endpoint
  // failing doesn't take down the others. GET /knowledge/ is reused from
  // lib/api/workers.js (fetchKnowledgeCatalogue), not re-declared here — see
  // KNOWLEDGE_IMPLEMENTATION_REPORT.md §2.
  const [documentsResult, summaryResult, growthResult, assignmentsResult] =
    await Promise.allSettled([
      fetchKnowledgeCatalogue(token),
      fetchKnowledgeSummary(token),
      fetchKnowledgeGrowth(token),
      fetchKnowledgeAssignmentsSummary(token),
    ]);

  const documents = settle(documentsResult);
  const summary = settle(summaryResult);
  const growth = settle(growthResult);
  const assignments = settle(assignmentsResult);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Knowledge</span>
            <h1>Your knowledge base.</h1>
            <p className="lead">
              Documents your AI workers draw on in chat — browse what&apos;s indexed, search it
              semantically, and upload new material.
            </p>
          </div>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/portal/knowledge/upload">
              Upload Document
            </Link>
            <Link className="btn btn-secondary" href="/portal/knowledge/connectors">
              Connectors
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stat-grid stat-grid-3">
            {summary.error ? (
              <p className="form-error" role="alert">
                {errorMessage(summary.error)}
              </p>
            ) : (
              <StatTile label="Total Documents" value={summary.value.total_documents} icon={<KnowledgeIcon />} />
            )}
            {growth.error ? (
              <p className="form-error" role="alert">
                {errorMessage(growth.error)}
              </p>
            ) : (
              <StatTile label="Knowledge Growth" value={growth.value.total_knowledge} icon={<KnowledgeIcon />} />
            )}
            {assignments.error ? (
              <p className="form-error" role="alert">
                {errorMessage(assignments.error)}
              </p>
            ) : (
              <StatTile label="Worker Assignments" value={assignments.value.total_assignments} icon={<WorkersIcon />} />
            )}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Semantic search</span>
            <h2>Ask a question across your knowledge base.</h2>
          </div>
          <KnowledgeSearch />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Documents</span>
            <h2>Browse everything indexed.</h2>
          </div>
          {documents.error ? (
            <p className="form-error" role="alert">
              {errorMessage(documents.error)}
            </p>
          ) : (
            <KnowledgeListView documents={documents.value} />
          )}
        </div>
      </section>
    </main>
  );
}
