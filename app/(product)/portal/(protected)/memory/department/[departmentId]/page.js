import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchDepartment } from '@/lib/api/departments';
import { fetchDepartmentMemories } from '@/lib/api/departmentMemory';
import { fetchMemorySummaries } from '@/lib/api/memorySummaries';
import { settle, errorMessage } from '@/lib/api/results';
import AddDepartmentMemoryForm from '@/components/portal/AddDepartmentMemoryForm';
import DepartmentMemoryView from '@/components/portal/DepartmentMemoryView';
import MemorySummaryPanel from '@/components/portal/MemorySummaryPanel';

export const metadata = {
  title: 'Department Memory | Teracom AI Portal',
};

/**
 * Phase 0 Package H — the middle memory tier. Any member of the owning
 * organisation may view this page and its memories (no admin gate here,
 * unlike /portal/memory/organisation); only an admin can add a memory
 * (AddDepartmentMemoryForm hides itself for a non-admin, backend still the
 * real enforcement).
 */
export default async function DepartmentMemoryPage({ params }) {
  const { departmentId } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Department Memory</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view this department&apos;s memory.</p>
          </div>
        </section>
      </main>
    );
  }

  const [departmentResult, memoriesResult, summariesResult] = await Promise.allSettled([
    fetchDepartment(token, departmentId),
    fetchDepartmentMemories(token, departmentId),
    fetchMemorySummaries(token, 'department', departmentId),
  ]);

  const department = settle(departmentResult);

  if (department.error) {
    const notFound = department.error instanceof ApiError && [403, 404].includes(department.error.status);

    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Department Memory</span>
            <h1>{notFound ? 'Department not found.' : 'Unable to load this department.'}</h1>
            <p className="lead">
              {notFound
                ? "This department doesn't exist, or belongs to a different organisation."
                : errorMessage(department.error)}
            </p>
            <Link className="btn btn-secondary" href="/portal/memory">
              Back to Memory
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const memories = settle(memoriesResult);
  const summaries = settle(summariesResult);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Department Memory</span>
            <h1>{department.value.name}</h1>
            {department.value.description && <p className="lead">{department.value.description}</p>}
          </div>
          <div className="hero-actions">
            <Link className="btn btn-secondary" href="/portal/memory">
              Back to Memory
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Add</span>
            <h2>Add a department memory.</h2>
          </div>
          <AddDepartmentMemoryForm departmentId={departmentId} />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Memories</span>
            <h2>What this department remembers.</h2>
          </div>
          {memories.error ? (
            <p className="form-error" role="alert">
              {errorMessage(memories.error)}
            </p>
          ) : (
            <DepartmentMemoryView memories={memories.value ?? []} departmentId={departmentId} />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Retention</span>
            <h2>Long-term summaries.</h2>
          </div>
          {summaries.error ? (
            <p className="form-error" role="alert">
              {errorMessage(summaries.error)}
            </p>
          ) : (
            <MemorySummaryPanel scope="department" scopeId={departmentId} summaries={summaries.value ?? []} />
          )}
        </div>
      </section>
    </main>
  );
}
