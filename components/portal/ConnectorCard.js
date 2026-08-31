const CONNECTOR_META = {
  sharepoint: {
    label: 'SharePoint',
    description: 'Sync documents from a SharePoint site into your knowledge base.',
  },
  onedrive: {
    label: 'OneDrive',
    description: 'Sync files from a OneDrive account into your knowledge base.',
  },
  teams: {
    label: 'Microsoft Teams',
    description: 'Pull shared files and channel documents from Teams into your knowledge base.',
  },
  // CUSTOMER_UX_ACCEPTANCE_V1 -- "prepare architecture for... Shared
  // Drives, external repositories."
  google_drive: {
    label: 'Shared Drives (Google)',
    description: 'Sync files from a Google Shared Drive into your knowledge base.',
  },
  external_repository: {
    label: 'External Repository',
    description: 'Connect a self-hosted document store or partner system into your knowledge base.',
  },
};

function titleCase(id) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

// TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- "Audit the actual connector
// implementation before presenting connector status. Replace misleading
// 'Connectors Coming Soon' messaging with evidence-based statuses."
// teracom-ai-backend (781cfe3) now returns one of these five real values,
// read from services/connectors/*.py's own BaseConnector.status() rather
// than a hardcoded literal -- this map is presentation only, not a second
// source of truth for what the status *is*.
const STATUS_META = {
  available: { label: 'Available', badgeClass: 'badge badge-success' },
  configuration_required: { label: 'Configuration Required', badgeClass: 'badge' },
  partial: { label: 'Partial', badgeClass: 'badge' },
  planned: { label: 'Planned', badgeClass: 'badge' },
  not_implemented: { label: 'Not Implemented', badgeClass: 'badge' },
};

/**
 * A connector's action affordance is derived from its own real status, not
 * fixed to "always disabled" — but today every real status is
 * not_implemented (confirmed live), and no connect/sync endpoint is
 * reachable for any of them (CONNECTORS_IMPLEMENTATION_REPORT.md §2), so a
 * disabled button with an honest label is still what every connector
 * renders today. The moment a real backend earns "available" or
 * "configuration_required" for one connector, this component already
 * renders it as actionable rather than needing a second edit.
 */
export default function ConnectorCard({ id, status }) {
  const meta = CONNECTOR_META[id] ?? {
    label: titleCase(id),
    description: 'Connector integration details are not yet available.',
  };
  const statusMeta = STATUS_META[status] ?? { label: titleCase(status ?? 'unknown'), badgeClass: 'badge' };
  const isActionable = status === 'available' || status === 'configuration_required';

  return (
    <article className="product-card connector-card">
      <div>
        <span className={statusMeta.badgeClass}>{statusMeta.label}</span>
        <h3>{meta.label}</h3>
        <p>{meta.description}</p>
        <p className="connector-status">
          Status: <span>{statusMeta.label}</span>
        </p>
      </div>
      <button type="button" className="btn btn-secondary" disabled={!isActionable}>
        {isActionable ? 'Connect' : statusMeta.label}
      </button>
    </article>
  );
}
