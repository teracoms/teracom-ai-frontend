import EmptyState from '@/components/portal/EmptyState';

const ROLE_LABELS = {
  user: 'You',
  assistant: 'Assistant',
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

// CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec6 -- a real download card for a
// message referencing a real OutputArtifact, posted automatically the
// moment services/execution_service.py#_maybe_create_output() creates
// one. Reuses the exact same download route ProjectOutputsPanel.js
// already uses (GET /api/portal/projects/{id}/outputs/{id}/download) --
// no new download mechanism, only a new place it's linked from.
function OutputReferenceCard({ content, outputReference }) {
  return (
    <div className="card" style={{ marginTop: '0.5rem' }}>
      <p className="activity-title">{content}</p>
      <p className="activity-meta">
        {outputReference.artifact_type} · {formatBytes(outputReference.size_bytes)}
      </p>
      <a
        className="btn btn-primary btn-small"
        style={{ marginTop: '0.5rem' }}
        href={`/api/portal/projects/${outputReference.project_id}/outputs/${outputReference.id}/download`}
      >
        Download {outputReference.filename}
      </a>
    </div>
  );
}

/**
 * Shared, presentational message list — used by both the live chat page
 * (client-side, in-memory turns from ChatComposer) and the read-only session
 * detail page (server-fetched from GET /chat-sessions/{sessionId}). Both
 * callers normalise to the same {id, role, content} shape before passing
 * messages in, so this one component covers both without needing to know
 * which source they came from. `kind`/`outputReference` are optional on
 * every message — absent (undefined) renders exactly as before for every
 * pre-existing caller; only `OrchestratorChat.js`'s own project-mode
 * messages ever carry a real `kind: 'output_reference'`.
 */
export default function ChatThread({ messages, emptyTitle, emptyDescription }) {
  if (messages.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="chat-thread">
      {messages.map((message) => (
        <li key={message.id} className={`chat-message chat-message-${message.role}`}>
          <span className="chat-message-role">{ROLE_LABELS[message.role] ?? message.role}</span>
          {message.kind === 'output_reference' && message.outputReference ? (
            <OutputReferenceCard content={message.content} outputReference={message.outputReference} />
          ) : (
            <p className="chat-message-content">{message.content}</p>
          )}
          {message.sources && message.sources.length > 0 && (
            <p className="form-note chat-message-sources">Sourced from: {message.sources.join(', ')}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
