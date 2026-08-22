import Link from 'next/link';

// Presentational only — no client interactivity needed, so this stays a
// Server Component (matches FRONTEND_ARCHITECTURE_V1.md §C.2's planned
// shared "StatTile.js" list/metric primitive). `icon` is optional so
// every pre-existing caller (no icon prop) renders exactly as before —
// "Platform Review Wave 1" objective #6 additive-only visual polish.
//
// `href` is optional too (UI_IMPLEMENTATION_SPRINT_1.md item 3) — wraps
// the tile as a drill-through link to the relevant list page when the
// caller has one to link to; every existing caller without `href`
// renders exactly as before, still a plain, non-interactive tile.
export default function StatTile({ label, value, hint, icon, href }) {
  const content = (
    <>
      <div className="stat-tile-heading">
        {icon && <span className="stat-tile-icon">{icon}</span>}
        <span className="eyebrow">{label}</span>
      </div>
      <p className="stat-value">{value}</p>
      {hint && <p className="stat-hint">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="stat-tile stat-tile-link">
        {content}
      </Link>
    );
  }

  return <article className="stat-tile">{content}</article>;
}
