import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchUploadHistory, fetchUploadMetrics } from '@/lib/api/knowledge';
import { settle, errorMessage } from '@/lib/api/results';
import UploadKnowledgeForm from '@/components/portal/UploadKnowledgeForm';
import StatTile from '@/components/portal/StatTile';
import EmptyState from '@/components/portal/EmptyState';
import { KnowledgeIcon } from '@/components/portal/icons';

export const metadata = {
  title: 'Upload Document | Teracom AI Portal',
};

export default async function UploadKnowledgePage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Knowledge</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to upload a document.</p>
          </div>
        </section>
      </main>
    );
  }

  // POST /upload/ is not admin-gated backend-side — only ownership of the
  // target worker's organisation is checked (get_owned_worker) — so this
  // page is open to every authenticated org member, unlike worker creation
  // in Package 3. See KNOWLEDGE_IMPLEMENTATION_REPORT.md §4.
  const [workersResult, historyResult, metricsResult] = await Promise.allSettled([
    fetchWorkerList(token),
    fetchUploadHistory(token),
    fetchUploadMetrics(token),
  ]);

  const workers = settle(workersResult);
  const history = settle(historyResult);
  const metrics = settle(metricsResult);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Knowledge</span>
            <h1>Upload a document.</h1>
            <p className="lead">
              teracom-ai-backend extracts the text, creates the knowledge record, assigns it to
              the worker you choose, and indexes it for chat — all in one step.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container worker-detail-columns">
          <div>
            {workers.error ? (
              <p className="form-error" role="alert">
                {errorMessage(workers.error)}
              </p>
            ) : (
              <UploadKnowledgeForm workers={workers.value} />
            )}
          </div>

          <div>
            <div className="section-heading left">
              <span className="eyebrow">Upload activity</span>
              <h2>Recent uploads.</h2>
            </div>

            {metrics.error ? (
              <p className="form-error" role="alert">
                {errorMessage(metrics.error)}
              </p>
            ) : (
              <StatTile label="Documents uploaded" value={metrics.value.uploaded_documents} icon={<KnowledgeIcon />} />
            )}

            {history.error ? (
              <p className="form-error" role="alert">
                {errorMessage(history.error)}
              </p>
            ) : history.value.length === 0 ? (
              <EmptyState
                title="No uploads yet"
                description="Documents uploaded through this page will be listed here."
              />
            ) : (
              <ul className="activity-list">
                {history.value.map((document) => (
                  <li key={document.id}>
                    <p className="activity-title">{document.title}</p>
                    <p className="activity-meta">Source: {document.source}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
