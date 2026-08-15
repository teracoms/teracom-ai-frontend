// Shared "nothing here yet" primitive — distinct from an error banner
// (.form-error, introduced in Package 1): an empty state means the request
// succeeded and there is genuinely no data, not that something failed.
export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-description">{description}</p>}
    </div>
  );
}
