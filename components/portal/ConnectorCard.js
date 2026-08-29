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

/**
 * Every connector this app can list is a disabled "coming soon" card —
 * deliberately, not a temporary placeholder. teracom-ai-backend's connector
 * endpoints return a hardcoded status literal (see lib/api/connectors.js);
 * `services/connectors/*.py`'s SharePointConnector/OneDriveConnector/
 * TeamsConnector classes define connect()/sync() methods that imply a real
 * OAuth flow, but are never instantiated or called by any registered route
 * (verified by grepping the whole backend — see
 * CONNECTORS_IMPLEMENTATION_REPORT.md §2). There is no reachable endpoint
 * this UI could wire a "Connect" button to, so none is offered — a disabled
 * button here would be dishonest in the other direction (implying an action
 * exists that silently does nothing), which is exactly the kind of
 * behaviour-the-backend-can't-back this app has avoided building in every
 * prior package.
 */
export default function ConnectorCard({ id, status }) {
  const meta = CONNECTOR_META[id] ?? {
    label: titleCase(id),
    description: 'Connector integration details are not yet available.',
  };

  return (
    <article className="product-card connector-card">
      <div>
        <span className="badge">Coming Soon</span>
        <h3>{meta.label}</h3>
        <p>{meta.description}</p>
        <p className="connector-status">
          Backend status: <span>{status}</span>
        </p>
      </div>
      <button type="button" className="btn btn-secondary" disabled>
        Not Yet Available
      </button>
    </article>
  );
}
