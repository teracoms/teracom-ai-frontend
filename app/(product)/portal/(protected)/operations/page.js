import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchOperationsSummary } from '@/lib/api/operations';
import { settle, errorMessage } from '@/lib/api/results';
import OperationsSummaryWidget from '@/components/portal/OperationsSummaryWidget';
import MyOrganisationNav from '@/components/portal/MyOrganisationNav';

export const metadata = {
  title: 'Operations | Teracom AI Portal',
};

/**
 * The Operations & Project Delivery workspace (Phase 0 Package N):
 * Operations Manager Worker / retrofitted Project Manager Worker's
 * shared home — organisation-wide operational visibility.
 *
 * CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- this page used to also embed a full
 * ProjectPanel (create/list/expand-tasks for every project), duplicating
 * the exact same UI the new dedicated /portal/projects page now owns
 * (UX_REVIEW_CUSTOMER_PLATFORM_V1.md §H2/§M1). Operations keeps its own
 * distinct job -- the organisation-wide statistics summary -- and links
 * out to Projects for the actual project/task management workflow,
 * instead of maintaining two full copies of the same create/manage UI.
 */
export default async function OperationsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Operations</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view the Operations workspace.</p>
          </div>
        </section>
      </main>
    );
  }

  const [summarySettled] = await Promise.allSettled([fetchOperationsSummary(token)]);
  const summaryResult = settle(summarySettled);

  return (
    <>
      <MyOrganisationNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Operations</span>
              <h1>Organisation-wide delivery statistics.</h1>
              <p className="lead">
                A live rollup of every project and task across your organisation. To create a
                project, add a task, or manage one directly, see{' '}
                <Link href="/portal/projects">Projects</Link>.
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
              <OperationsSummaryWidget summary={summaryResult.value} />
            )}
            <p style={{ marginTop: '1.5rem' }}>
              <Link className="btn btn-primary" href="/portal/projects">
                Open Projects
              </Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
