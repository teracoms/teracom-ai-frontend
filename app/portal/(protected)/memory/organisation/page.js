import Link from 'next/link';

import { getSessionToken, fetchCurrentUser } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { fetchOrganisationMemories } from '@/lib/api/organisationMemory';
import { fetchMemorySummaries } from '@/lib/api/memorySummaries';
import { settle, errorMessage } from '@/lib/api/results';
import AddOrganisationMemoryForm from '@/components/portal/AddOrganisationMemoryForm';
import OrganisationMemoryView from '@/components/portal/OrganisationMemoryView';
import MemorySummaryPanel from '@/components/portal/MemorySummaryPanel';

export const metadata = {
  title: 'Organisation Memory | Teracom AI Portal',
};

/**
 * Phase 0 Package H — the broadest memory tier: admin-only to read or
 * write (services/entitlement_service.py's "memory_enrichment" capability
 * additionally gates every call below at Enterprise+). Not nested under
 * /portal/admin, so this page carries its own restricted-message gate
 * (same shape as admin/layout.js's) rather than inheriting one, and checks
 * the role itself before fetching anything — the same belt-and-braces
 * precedent Package 9's billing pages established.
 */
export default async function OrganisationMemoryPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Organisation Memory</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view organisation memory.</p>
          </div>
        </section>
      </main>
    );
  }

  if (decodeJwtPayload(token)?.role !== 'admin') {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Organisation Memory</span>
            <h1>This area requires admin access.</h1>
            <p className="lead">
              Organisation-wide memory is the broadest memory tier, visible to organisation
              admins only. Ask an organisation admin for access.
            </p>
            <Link className="btn btn-secondary" href="/portal/memory">
              Back to Memory
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const currentUser = await fetchCurrentUser(token);

  const [memoriesResult, summariesResult] = await Promise.allSettled([
    fetchOrganisationMemories(token),
    fetchMemorySummaries(token, 'organisation', currentUser.organisation_id),
  ]);

  const memories = settle(memoriesResult);
  const summaries = settle(summariesResult);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Organisation Memory</span>
            <h1>What your whole organisation remembers.</h1>
            <p className="lead">
              The broadest memory tier — above department and worker memory — visible to admins
              only. Requires the Memory Enrichment capability (Enterprise tier or above).
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Add</span>
            <h2>Add an organisation memory.</h2>
          </div>
          <AddOrganisationMemoryForm />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Memories</span>
            <h2>Organisation-wide memories.</h2>
          </div>
          {memories.error ? (
            <p className="form-error" role="alert">
              {errorMessage(memories.error)}
            </p>
          ) : (
            <OrganisationMemoryView memories={memories.value ?? []} />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Retention</span>
            <h2>Long-term summaries.</h2>
            <p>Condense every organisation, department, and worker memory into one reusable summary.</p>
          </div>
          {summaries.error ? (
            <p className="form-error" role="alert">
              {errorMessage(summaries.error)}
            </p>
          ) : (
            <MemorySummaryPanel
              scope="organisation"
              scopeId={currentUser.organisation_id}
              summaries={summaries.value ?? []}
            />
          )}
        </div>
      </section>
    </main>
  );
}
