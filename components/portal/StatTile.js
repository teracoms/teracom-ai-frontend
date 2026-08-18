// Presentational only — no client interactivity needed, so this stays a
// Server Component (matches FRONTEND_ARCHITECTURE_V1.md §C.2's planned
// shared "StatTile.js" list/metric primitive). `icon` is optional so
// every pre-existing caller (no icon prop) renders exactly as before —
// "Platform Review Wave 1" objective #6 additive-only visual polish.
export default function StatTile({ label, value, hint, icon }) {
  return (
    <article className="stat-tile">
      <div className="stat-tile-heading">
        {icon && <span className="stat-tile-icon">{icon}</span>}
        <span className="eyebrow">{label}</span>
      </div>
      <p className="stat-value">{value}</p>
      {hint && <p className="stat-hint">{hint}</p>}
    </article>
  );
}
