/**
 * Objectives #3-#5: read-only proposal/quote/contract visibility.
 * No customer-facing write capability exists on any of these — financial
 * and contract approvals remain human-controlled (governance), unchanged
 * from Package J's staff-only decide routes.
 */
function DocumentList({ title, documents }) {
  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">{title}</span>
      </div>
      {documents.length === 0 ? (
        <p className="activity-meta">None yet.</p>
      ) : (
        <ul className="activity-list">
          {documents.map((document) => (
            <li key={document.id}>
              <p className="activity-title">
                {document.title} <span className="badge">{document.status}</span>
              </p>
              <p className="activity-meta">
                {document.amount != null ? `$${document.amount}` : 'No amount recorded'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PortalDealsView({ proposals, quotes, contracts }) {
  return (
    <div>
      <DocumentList title="Proposals" documents={proposals} />
      <DocumentList title="Quotes" documents={quotes} />
      <DocumentList title="Contracts" documents={contracts} />
    </div>
  );
}
