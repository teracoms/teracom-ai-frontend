import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchCtoExecutions } from '@/lib/api/ctoOrchestration';
import { fetchMarketingSummary } from '@/lib/api/marketing';
import { fetchFederationSummary } from '@/lib/api/federation';
import { fetchFinanceSummary } from '@/lib/api/finance';
import { fetchOperationsSummary } from '@/lib/api/operations';
import { errorMessage, settle } from '@/lib/api/results';
import CtoOrchestrationPanel from '@/components/portal/CtoOrchestrationPanel';
import CtoExecutionHistory from '@/components/portal/CtoExecutionHistory';
import MarketingSummaryWidget from '@/components/portal/MarketingSummaryWidget';
import FederationSummaryWidget from '@/components/portal/FederationSummaryWidget';
import FinanceSummaryWidget from '@/components/portal/FinanceSummaryWidget';
import OperationsSummaryWidget from '@/components/portal/OperationsSummaryWidget';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'CTO | Teracom AI Portal',
};

export default async function CtoOrchestrationPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">CTO</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to use Autonomous CTO Orchestration.</p>
          </div>
        </section>
      </main>
    );
  }

  // Per-section resilience (ADR-008): the worker list, execution history,
  // marketing summary, federation summary, finance summary, and
  // operations summary are independent of each other.
  const [
    workerListSettled,
    executionsSettled,
    marketingSummarySettled,
    federationSummarySettled,
    financeSummarySettled,
    operationsSummarySettled,
  ] = await Promise.allSettled([
    fetchWorkerList(token),
    fetchCtoExecutions(token),
    fetchMarketingSummary(token),
    fetchFederationSummary(token),
    fetchFinanceSummary(token),
    fetchOperationsSummary(token),
  ]);

  const workerListResult = settle(workerListSettled);
  const activeWorkers = (workerListResult.value ?? []).filter((worker) => worker.status === 'active');

  const executionsResult = settle(executionsSettled);
  const marketingSummaryResult = settle(marketingSummarySettled);
  const federationSummaryResult = settle(federationSummarySettled);
  const financeSummaryResult = settle(financeSummarySettled);
  const operationsSummaryResult = settle(operationsSummarySettled);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Autonomous CTO</span>
            <h1>CTO Orchestration.</h1>
            <p className="lead">
              Submit a high-level objective and let a lead worker decompose it, delegate across
              your workforce in a bounded chain, and synthesise the results — you decide whether
              to review the plan first or the finished result afterward.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {workerListResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(workerListResult.error)}
            </p>
          ) : activeWorkers.length === 0 ? (
            <EmptyState
              title="No active workers yet"
              description="Create at least one active worker before running a CTO task."
            />
          ) : (
            <CtoOrchestrationPanel workers={activeWorkers} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">CTO Dashboard</span>
            <h2>Delegation & Consultation History</h2>
            <p>Every chain execution your organisation has run, most recent first.</p>
          </div>

          {executionsResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(executionsResult.error)}
            </p>
          ) : (
            <CtoExecutionHistory executions={executionsResult.value ?? []} />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {marketingSummaryResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(marketingSummaryResult.error)}
            </p>
          ) : (
            <MarketingSummaryWidget summary={marketingSummaryResult.value} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {federationSummaryResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(federationSummaryResult.error)}
            </p>
          ) : (
            <FederationSummaryWidget summary={federationSummaryResult.value} />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {financeSummaryResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(financeSummaryResult.error)}
            </p>
          ) : (
            <FinanceSummaryWidget summary={financeSummaryResult.value} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {operationsSummaryResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(operationsSummaryResult.error)}
            </p>
          ) : (
            <OperationsSummaryWidget summary={operationsSummaryResult.value} />
          )}
        </div>
      </section>
    </main>
  );
}
