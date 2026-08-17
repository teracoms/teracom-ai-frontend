import Link from 'next/link';

import EmptyState from '@/components/portal/EmptyState';
import DepartmentHeadConsultationPanel from '@/components/portal/DepartmentHeadConsultationPanel';
import PipelineSummaryWidget from '@/components/portal/PipelineSummaryWidget';
import CustomerHealthWidget from '@/components/portal/CustomerHealthWidget';
import MarketingSummaryWidget from '@/components/portal/MarketingSummaryWidget';

/**
 * The Department Head dashboard's presentational body (Phase 0 Package I).
 * Server component — DepartmentHeadConsultationPanel below is the one
 * client island, only rendered when this department currently has a head.
 */
export default function DepartmentDashboard({
  department,
  head,
  workers,
  workersError,
  otherHeads,
  headWorkerId,
  consultations,
  pipelineSummary,
  pipelineSummaryError,
  marketingSummary,
  marketingSummaryError,
}) {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Department</span>
            <h1>{department.name}</h1>
            {department.description && <p className="lead">{department.description}</p>}
            <p className="activity-meta">
              {head ? (
                <>
                  Head: <strong>{head.name}</strong> ({head.role})
                </>
              ) : (
                'No head assigned yet — an admin can assign one from Admin → Departments.'
              )}
            </p>
          </div>
        </div>
      </section>

      {(department.function === 'sales' || department.function === 'customer_success') && (
        <section className="section">
          <div className="container">
            {pipelineSummaryError ? (
              <p className="form-error" role="alert">
                Unable to load pipeline data.
              </p>
            ) : department.function === 'sales' ? (
              <PipelineSummaryWidget summary={pipelineSummary} />
            ) : (
              <CustomerHealthWidget summary={pipelineSummary} />
            )}
          </div>
        </section>
      )}

      {department.function === 'marketing' && (
        <section className="section">
          <div className="container">
            {marketingSummaryError ? (
              <p className="form-error" role="alert">
                Unable to load marketing data.
              </p>
            ) : (
              <MarketingSummaryWidget summary={marketingSummary} />
            )}
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Workers</span>
            <h2>This department&apos;s workers.</h2>
          </div>
          {workersError ? (
            <p className="form-error" role="alert">
              Unable to load this department&apos;s workers.
            </p>
          ) : workers.length === 0 ? (
            <EmptyState
              title="No workers in this department yet"
              description="An admin can assign existing workers from Admin → Departments."
            />
          ) : (
            <ul className="activity-list">
              {workers.map((worker) => (
                <li key={worker.id}>
                  <div className="assignment-row">
                    <div>
                      <p className="activity-title">
                        {worker.name}
                        {worker.id === department.head_worker_id ? ' (Head)' : ''}
                      </p>
                      <p className="activity-meta">{worker.role}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p>
            <Link className="btn btn-secondary btn-small" href={`/portal/memory/department/${department.id}`}>
              View Department Memory
            </Link>
          </p>
        </div>
      </section>

      {head && (
        <section className="section alt">
          <div className="container">
            <div className="section-heading left">
              <span className="eyebrow">Direct Communication</span>
              <h2>Consult another Department Head.</h2>
              <p>
                Human-triggered, direct communication between {head.name} and any other
                department&apos;s current head — reuses the same consult-then-synthesise mechanism
                as general Orchestration Intelligence, restricted to department heads.
              </p>
            </div>

            {otherHeads.length === 0 ? (
              <EmptyState
                title="No other department heads yet"
                description="Assign a head to another department to enable direct communication."
              />
            ) : (
              <DepartmentHeadConsultationPanel
                primaryHeadWorkerId={headWorkerId}
                primaryHeadName={head.name}
                otherHeads={otherHeads}
              />
            )}

            {consultations.length > 0 && (
              <div>
                <h3>Recent consultations</h3>
                <ul className="activity-list">
                  {consultations.map((consultation) => (
                    <li key={consultation.id}>
                      <p className="activity-title">{consultation.original_message}</p>
                      <p className="activity-meta">{new Date(consultation.created_at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
