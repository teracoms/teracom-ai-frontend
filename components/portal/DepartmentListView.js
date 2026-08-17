import Link from 'next/link';

import EmptyState from '@/components/portal/EmptyState';
import AssignWorkerDepartmentControl from '@/components/portal/AssignWorkerDepartmentControl';
import AssignDepartmentHeadControl from '@/components/portal/AssignDepartmentHeadControl';

/**
 * Admin-only management surface for Phase 0 Package H: lists every
 * department, and lets an admin assign each worker to one (or clear the
 * assignment). Worker->department membership is what
 * DepartmentMemoryView/OrganisationMemoryView and CTO orchestration's
 * memory hierarchy are built on top of.
 */
export default function DepartmentListView({ departments, workers }) {
  return (
    <div className="department-list-view">
      <div className="section-heading left">
        <span className="eyebrow">Departments</span>
        <h2>{departments.length} department{departments.length === 1 ? '' : 's'}</h2>
      </div>

      {departments.length === 0 ? (
        <EmptyState
          title="No departments yet"
          description="Create one above, then assign workers to it below."
        />
      ) : (
        <ul className="activity-list">
          {departments.map((department) => (
            <li key={department.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">{department.name}</p>
                  {department.description && <p className="activity-meta">{department.description}</p>}
                </div>
                <AssignDepartmentHeadControl department={department} workers={workers} />
                <Link className="btn btn-secondary btn-small" href={`/portal/departments/${department.id}`}>
                  Dashboard
                </Link>
                <Link className="btn btn-secondary btn-small" href={`/portal/memory/department/${department.id}`}>
                  View Memory
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="section-heading left">
        <span className="eyebrow">Assign Workers</span>
        <h2>Worker department assignments</h2>
      </div>

      {workers.length === 0 ? (
        <EmptyState title="No workers yet" description="Create a worker before assigning it to a department." />
      ) : (
        <ul className="activity-list">
          {workers.map((worker) => (
            <li key={worker.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">{worker.name}</p>
                  <p className="activity-meta">{worker.role}</p>
                </div>
                <AssignWorkerDepartmentControl worker={worker} departments={departments} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
