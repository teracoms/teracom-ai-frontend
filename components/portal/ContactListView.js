import Link from 'next/link';

import EmptyState from '@/components/portal/EmptyState';

const STAGES = ['prospect', 'lead', 'customer'];

/**
 * Lead management (Phase 0 Package J, objective #3) — a stage-filterable
 * contact list. `basePath` lets this same component serve both
 * /portal/sales (all stages) and, if needed later, a narrower view.
 */
export default function ContactListView({ contacts, activeStage, basePath }) {
  return (
    <div>
      <div className="workers-toolbar">
        <Link
          className={!activeStage ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
          href={basePath}
        >
          All
        </Link>
        {STAGES.map((stage) => (
          <Link
            key={stage}
            className={activeStage === stage ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
            href={`${basePath}?stage=${stage}`}
          >
            {stage.charAt(0).toUpperCase() + stage.slice(1)}
          </Link>
        ))}
      </div>

      {contacts.length === 0 ? (
        <EmptyState title="No contacts yet" description="Add a prospect above to get started." />
      ) : (
        <ul className="activity-list">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">{contact.name}</p>
                  <p className="activity-meta">
                    <span className="badge">{contact.stage}</span>
                    {contact.company ? ` · ${contact.company}` : ''}
                    {contact.health_status ? ` · ${contact.health_status}` : ''}
                  </p>
                </div>
                <Link className="btn btn-secondary btn-small" href={`/portal/sales/${contact.id}`}>
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
