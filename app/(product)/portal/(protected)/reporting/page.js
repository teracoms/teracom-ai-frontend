import { getSessionToken } from '@/lib/api/auth';
import { fetchOperationsSummary } from '@/lib/api/operations';
import { fetchFinanceSummary } from '@/lib/api/finance';
import { fetchMarketingSummary } from '@/lib/api/marketing';
import { fetchPlatformHealthSummary } from '@/lib/api/platformHealth';
import { fetchPipelineSummary } from '@/lib/api/crm';
import { fetchOrganisationHealthSummary } from '@/lib/api/organisationHealth';
import { fetchExecutiveDashboardSummary } from '@/lib/api/executiveDashboard';
import { fetchOrganisationalIntelligenceSummary } from '@/lib/api/organisationalIntelligence';
import { settle, errorMessage, isForbidden } from '@/lib/api/results';
import PlatformSectionNav from '@/components/portal/PlatformSectionNav';

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
 * Operations/Finance/Marketing/Sales/Customer Success each had their
 * own real summary endpoint (services/*_summary_service.py,
 * services/crm_pipeline_service.py) but no single page pulled them
 * together; a human wanting an executive-style overview had to visit
 * five separate department pages.
 *
 * DIGITAL_ORGANISATION_OPERATIONS_V1 adds the Organisation Health and
 * Executive Summary cards -- the Organisation Health Dashboard and
 * Executive Dashboard this workstream's own objective named
 * (services/organisation_health_service.py,
 * services/executive_dashboard_service.py).
 *
 * AUTONOMOUS_OPERATIONS_V1 adds the Organisational Intelligence card
 * -- the Executive Work Queue, Worker Capacity Management,
 * Organisational Intelligence, and Executive Decision Support
 * objectives, all backed by one real, deterministic computation
 * (services/organisational_intelligence_service.py) reusing this same
 * organisation's own Project/Task/Worker Pool data, never an
 * LLM-generated summary. Everything else on this page still adds no
 * new backend data of its own — it only aggregates what already
 * exists and is already real.
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

  const [
    operationsResult,
    financeResult,
    marketingResult,
    healthResult,
    pipelineResult,
    organisationHealthResult,
    executiveResult,
    intelligenceResult,
  ] = await Promise.allSettled([
    fetchOperationsSummary(token),
    fetchFinanceSummary(token),
    fetchMarketingSummary(token),
    fetchPlatformHealthSummary(token),
    fetchPipelineSummary(token),
    fetchOrganisationHealthSummary(token),
    fetchExecutiveDashboardSummary(token),
    fetchOrganisationalIntelligenceSummary(token),
  ]);

  const operations = settle(operationsResult);
  const finance = settle(financeResult);
  const marketing = settle(marketingResult);
  const health = settle(healthResult);
  const pipeline = settle(pipelineResult);
  const organisationHealth = settle(organisationHealthResult);
  const executive = settle(executiveResult);
  const intelligence = settle(intelligenceResult);

  return (
    <>
      <PlatformSectionNav />
      <main>
      <section className="hero hero-product hero-reporting">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Reporting</span>
            <h1>Every department&apos;s own real numbers, in one place.</h1>
            <p className="lead">
              Operations, Finance, Marketing, Sales &amp; Customer Success, platform health,
              organisation health, and an executive summary — each already tracked separately;
              this page only brings them together.
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

          <ReportCard title="Sales & Customer Success" error={pipeline.error}>
            {pipeline.value && (
              <>
                <p className="activity-meta">Contacts by stage</p>
                <CountsList counts={pipeline.value.stage_counts} />
                <p className="activity-meta">Contacts by health</p>
                <CountsList counts={pipeline.value.health_counts} />
                <ul className="activity-list">
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Pending proposals / quotes / contracts</span>
                      <span className="activity-meta">
                        {pipeline.value.pending_proposals} / {pipeline.value.pending_quotes} /{' '}
                        {pipeline.value.pending_contracts}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Portal accounts / open support requests</span>
                      <span className="activity-meta">
                        {pipeline.value.portal_accounts_count} / {pipeline.value.open_support_requests_count}
                      </span>
                    </div>
                  </li>
                </ul>
              </>
            )}
          </ReportCard>

          <ReportCard title="Platform Health" error={health.error}>
            {health.value && (
              <>
                <ul className="activity-list">
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Status</span>
                      <span className="activity-meta">{health.value.status}</span>
                    </div>
                  </li>
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Pending deployments</span>
                      <span className="activity-meta">{health.value.pending_deployments_count ?? 0}</span>
                    </div>
                  </li>
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Last deployment</span>
                      <span className="activity-meta">
                        {health.value.last_deployment
                          ? `${health.value.last_deployment.version_label} · ${new Date(health.value.last_deployment.deployed_at).toLocaleString()}`
                          : 'No deployment recorded yet'}
                      </span>
                    </div>
                  </li>
                </ul>
                <p className="activity-meta">Open incidents by severity</p>
                <CountsList counts={health.value.open_incidents_by_severity} />
              </>
            )}
          </ReportCard>

          <ReportCard title="Organisation Health" error={organisationHealth.error}>
            {organisationHealth.value && (
              <>
                <ul className="activity-list">
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Workers</span>
                      <span className="activity-meta">
                        {organisationHealth.value.workers.total} total ·{' '}
                        {organisationHealth.value.workers.active} active
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Worker pool utilisation</span>
                      <span className="activity-meta">
                        {organisationHealth.value.worker_pools.total_members} /{' '}
                        {organisationHealth.value.worker_pools.total_capacity} (
                        {organisationHealth.value.worker_pools.utilisation_percent}%)
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Scheduler</span>
                      <span className="activity-meta">
                        {organisationHealth.value.scheduler.has_run
                          ? `Last activity: ${new Date(organisationHealth.value.scheduler.last_occurred_at).toLocaleString()}`
                          : 'No scheduler activity yet'}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Memory</span>
                      <span className="activity-meta">
                        {organisationHealth.value.memory.worker_memory_count} worker ·{' '}
                        {organisationHealth.value.memory.organisation_memory_count} organisation
                      </span>
                    </div>
                  </li>
                </ul>
                {organisationHealth.value.worker_pools.pools.length > 0 && (
                  <>
                    <p className="activity-meta">Pools</p>
                    <ul className="activity-list">
                      {organisationHealth.value.worker_pools.pools.map((pool) => (
                        <li key={pool.id}>
                          <div className="assignment-row">
                            <span className="activity-title">{pool.name}</span>
                            <span className="activity-meta">
                              {pool.member_count} / {pool.capacity}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </ReportCard>

          <ReportCard title="Executive Summary" error={executive.error}>
            {executive.value && (
              <>
                <ul className="activity-list">
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Organisation</span>
                      <span className="activity-meta">
                        {executive.value.organisation.name} · {executive.value.organisation.status}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Chat sessions / memories</span>
                      <span className="activity-meta">
                        {executive.value.worker_activity.chat_session_count} /{' '}
                        {executive.value.worker_activity.memory_count}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Task executions (succeeded / failed)</span>
                      <span className="activity-meta">
                        {executive.value.worker_activity.task_executions_succeeded} /{' '}
                        {executive.value.worker_activity.task_executions_failed}
                      </span>
                    </div>
                  </li>
                </ul>
                {executive.value.departments.length > 0 && (
                  <>
                    <p className="activity-meta">Departments (workers / projects)</p>
                    <ul className="activity-list">
                      {executive.value.departments.map((department) => (
                        <li key={department.id}>
                          <div className="assignment-row">
                            <span className="activity-title">{department.name}</span>
                            <span className="activity-meta">
                              {department.worker_count} / {department.project_count}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </ReportCard>

          <ReportCard title="Organisational Intelligence" error={intelligence.error}>
            {intelligence.value && (
              <>
                <ul className="activity-list">
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Blocked projects / escalations</span>
                      <span className="activity-meta">
                        {intelligence.value.work_queue.blocked_projects.length} /{' '}
                        {intelligence.value.work_queue.escalations.length}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Stalled tasks / unresolved failures</span>
                      <span className="activity-meta">
                        {intelligence.value.intelligence.stalled_task_count} /{' '}
                        {intelligence.value.intelligence.unresolved_verification_failure_count}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="assignment-row">
                      <span className="activity-title">Inactive projects / overloaded pools</span>
                      <span className="activity-meta">
                        {intelligence.value.intelligence.inactive_projects.length} /{' '}
                        {intelligence.value.intelligence.overloaded_pools.length}
                      </span>
                    </div>
                  </li>
                </ul>
                {intelligence.value.decision_support.recommended_actions.length === 0 ? (
                  <p className="activity-meta">No recommended actions right now.</p>
                ) : (
                  <>
                    <p className="activity-meta">Recommended actions</p>
                    <ul className="activity-list">
                      {intelligence.value.decision_support.recommended_actions.slice(0, 8).map((action, index) => (
                        // eslint-disable-next-line react/no-array-index-key -- these are
                        // freshly-generated recommendation strings with no stable id of
                        // their own, recomputed on every request.
                        <li key={index}>
                          <p className="activity-meta">{action}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </ReportCard>
        </div>
      </section>
    </main>
    </>
  );
}
