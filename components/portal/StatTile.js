// Presentational only — no client interactivity needed, so this stays a
// Server Component (matches FRONTEND_ARCHITECTURE_V1.md §C.2's planned
// shared "StatTile.js" list/metric primitive).
export default function StatTile({ label, value, hint }) {
  return (
    <article className="stat-tile">
      <span className="eyebrow">{label}</span>
      <p className="stat-value">{value}</p>
      {hint && <p className="stat-hint">{hint}</p>}
    </article>
  );
}
