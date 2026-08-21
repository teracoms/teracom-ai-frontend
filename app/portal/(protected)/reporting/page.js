import { getSessionToken } from '@/lib/api/auth';
import { fetchOperationsSummary } from '@/lib/api/operations';
import { fetchFinanceSummary } from '@/lib/api/finance';
import { fetchMarketingSummary } from '@/lib/api/marketing';
import { fetchPlatformHealthSummary } from '@/lib/api/platformHealth';
import { settle, errorMessage, isForbidden } from '@/lib/api/results';

export const metadata = {
  title: 'Reporting | Teracom AI Portal',
};

function CountsList({ counts }) {
  const entries = Object.entries(counts ?? {});
  if (entries.length === 0) return <p className="activity-meta">No data yet.</p>;
  return (
    <ul className="activity-list">
      {entries.map(([key, value]) => (
        <li key={key}>
          <div className="assignment-row">
            <span className="activity-title">{key.replace(/_/g, ' ')}</span>
            <span className="activity-meta">{value}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReportCard({ title, error, children }) {
  return (
    <div className="stat-tile">
      <h2>{title}</h2>
      {error ? (
        isForbidden(error) ? (
          <p className="activity-meta">You don&apos;t have access to this section.</p>
        ) : (
          <p className="form-error" role="alert">
            {errorMessage(error)}
          </p>
        )
      ) : (
        children
      )}
    </div>
  );
}

/**
 * A consolidated, cross-department Reporting surface — previously
 * Operations/Finance/Marketing each had their own real summary
 * endpoint (services/*_summary_service.py) but no single page pulled
 * them together; a human wanting an executive-style overview had to
 * visit three separate department pages. This page adds no new
 * backend data — it only aggregates what already exists and is
 * already real. Sales and Customer Success have no summary endpoint
 * of their own yet (a pre-existing gap, not something this page can
 * fix) so they are not included below.
 */
export default async function ReportingPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Reporting</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view reporting.</p>
          </div>
        </section>
      </main>
    );
  }

  const [operationsResult, financeResult, marketingResult, healthResult] = await Promise.allSettled([
    fetchOperationsSummary(token),
    fetchFinanceSummary(token),
    fetchMarketingSummary(token),
    fetchPlatformHealthSummary(token),
  ]);

  const operations = settle(operationsResult);
  const finance = settle(financeResult);
  const marketing = settle(marketingResult);
  const health = settle(healthResult);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Reporting</span>
            <h1>Every department&apos;s own real numbers, in one place.</h1>
            <p className="lead">
              Operations, Finance, Marketing, and platform health — each already tracked
              separately; this page only brings them together. Sales and Customer Success have
              no summary endpoint of their own yet, so they aren&apos;t shown here.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stat-grid-2">
          <ReportCard title="Operations" error={operations.error}>
            {operations.value && (
              <>
                <p className="activity-meta">Projects by status</p>
                <CountsList counts={operations.value.projects?.count_by_status} />
                <p className="activity-meta">
                  Tasks by status ({operations.value.tasks?.overdue_count ?? 0} overdue)
                </p>
                <CountsList counts={operations.value.tasks?.count_by_status} />
              </>
            )}
          </ReportCard>

          <ReportCard title="Finance" error={finance.error}>
            {finance.value && (
              <ul className="activity-list">
                <li>
                  <div className="assignment-row">
                    <span className="activity-title">Total estimated organisation cost</span>
                    <span className="activity-meta">
                      ${finance.value.total_estimated_organisation_cost?.toLocaleString() ?? '0'}
                    </span>
                  </div>
                </li>
                <li>
                  <div className="assignment-row">
                    <span className="activity-title">Department budgets allocated</span>
                    <span className="activity-meta">
                      ${finance.value.department_budgets?.total_allocated?.toLocaleString() ?? '0'}
                      {' · '}
                      {finance.value.department_budgets?.pending_count ?? 0} pending
                    </span>
                  </div>
                </li>
                <li>
                  <div className="assignment-row">
                    <span className="activity-title">Licence</span>
                    <span className="activity-meta">
                      {finance.value.licensing
                        ? `${finance.value.licensing.tier} · ${finance.value.licensing.status}`
                        : 'No licence issued yet'}
                    </span>
                  </div>
                </li>
              </ul>
            )}
          </ReportCard>

          <ReportCard title="Marketing" error={marketing.error}>
            {marketing.value && (
              <>
                <p className="activity-meta">Campaigns by stage</p>
                <CountsList counts={marketing.value.campaign_stage_counts} />
                <p className="activity-meta">
                  {marketing.value.pending_content_count ?? 0} content pending ·{' '}
                  {marketing.value.pending_video_count ?? 0} video pending ·{' '}
                  {marketing.value.media_published_count ?? 0} published
                </p>
              </>
            )}
          </ReportCard>

          <ReportCard title="Platform Health" error={health.error}>
            {health.value && (
              <ul className="activity-list">
                {Object.entries(health.value).map(([key, value]) => (
                  <li key={key}>
                    <div className="assignment-row">
                      <span className="activity-title">{key.replace(/_/g, ' ')}</span>
                      <span className="activity-meta">{String(value)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ReportCard>
        </div>
      </section>
    </main>
  );
}
