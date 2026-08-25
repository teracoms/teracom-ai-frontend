import { getSessionToken } from '@/lib/api/auth';
import { fetchFinanceSummary } from '@/lib/api/finance';
import { fetchDepartmentBudgets } from '@/lib/api/departmentBudgets';
import { fetchDepartments } from '@/lib/api/departments';
import { settle, errorMessage } from '@/lib/api/results';
import FinanceSummaryWidget from '@/components/portal/FinanceSummaryWidget';
import DepartmentBudgetPanel from '@/components/portal/DepartmentBudgetPanel';
import LicensingSummaryCard from '@/components/portal/LicensingSummaryCard';
import EmptyState from '@/components/portal/EmptyState';
import { BillingIcon } from '@/components/portal/icons';
import MyOrganisationNav from '@/components/portal/MyOrganisationNav';

export const metadata = {
  title: 'Finance | Teracom AI Portal',
};

/**
 * The Finance workspace (Phase 0 Package M): Finance Manager/Cost
 * Analyst/Licensing Analyst's shared home — org-wide budget tracking
 * (objective #5), organisation cost visibility (objective #7), and
 * licensing tracking (objective #10).
 */
export default async function FinancePage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Finance</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view the Finance workspace.</p>
          </div>
        </section>
      </main>
    );
  }

  // Per-section resilience (ADR-008): the summary, org-wide budget
  // list, and department list are independent of each other.
  const [summarySettled, budgetsSettled, departmentsSettled] = await Promise.allSettled([
    fetchFinanceSummary(token),
    fetchDepartmentBudgets(token),
    fetchDepartments(token),
  ]);

  const summaryResult = settle(summarySettled);
  const budgetsResult = settle(budgetsSettled);
  const departmentsResult = settle(departmentsSettled);

  return (
    <>
      <MyOrganisationNav />
      <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Finance</span>
            <h1>Budgets, costs &amp; licensing.</h1>
            <p className="lead">
              The Finance workspace — track department budgets, review organisation-wide cost
              visibility, and see this organisation&apos;s real licensing and entitlement data.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {summaryResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(summaryResult.error)}
            </p>
          ) : (
            <FinanceSummaryWidget summary={summaryResult.value} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {budgetsResult.error || departmentsResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(budgetsResult.error ?? departmentsResult.error)}
            </p>
          ) : (departmentsResult.value ?? []).length === 0 ? (
            <EmptyState
              title="No departments yet"
              description="Create a department before submitting a budget."
            />
          ) : (
            <DepartmentBudgetPanel departments={departmentsResult.value} budgets={budgetsResult.value ?? []} />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <div className="eyebrow-icon-row">
              <span className="stat-tile-icon"><BillingIcon /></span>
              <span className="eyebrow">Licensing</span>
            </div>
            <h2>Current licence &amp; entitlement.</h2>
          </div>
          {summaryResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(summaryResult.error)}
            </p>
          ) : (
            <LicensingSummaryCard licensing={summaryResult.value.licensing} />
          )}
        </div>
      </section>
    </main>
    </>
  );
}
