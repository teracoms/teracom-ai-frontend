import Link from 'next/link';

import { WorkersIcon, StatusDot } from '@/components/portal/icons';

// CUSTOMER_UX_ACCEPTANCE_V1 -- real customer walkthrough feedback:
// "investigate and fix current rendering issue" (Workers). Root cause,
// confirmed directly: this component rendered as a `.product-card` --
// a 360px-tall, 3-per-row marketing-store card design (its own prior
// comment said so explicitly: "Reuses the store page's .product-card
// visual language") -- for what needs to be a dense operational list.
// An organisation with hundreds/thousands of workers made that
// literally unusable, not just "decorative". Replaced with the shared
// compact console-row pattern (app/globals.css) every large list view
// now uses: one line per worker, real status/name/role/department,
// one action -- not removed, not renamed, every field this component
// already showed is still shown.
export default function WorkerCard({ worker, departmentName }) {
  return (
    <div className="console-row">
      <span className="console-row-icon">
        <WorkersIcon />
      </span>
      <div className="console-row-main">
        <span className="console-row-title">
          {worker.name}
          <span className="badge" style={{ marginBottom: 0 }}>
            <StatusDot status={worker.status} />
            {worker.status}
          </span>
        </span>
        <span className="console-row-meta">
          {worker.role} · {departmentName ? `Department: ${departmentName}` : 'Unassigned to a department'}
        </span>
      </div>
      <div className="console-row-actions">
        <Link className="btn btn-secondary btn-small" href={`/portal/workers/${worker.id}`}>
          View
        </Link>
      </div>
    </div>
  );
}
