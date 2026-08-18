/**
 * "Platform Review Wave 1" objective #8 (visual refresh) — a small,
 * self-authored set of inline SVG glyphs, deliberately not a new npm
 * icon-library dependency (this codebase has none today). Every glyph
 * uses `currentColor` only, so it inherits whichever colour token its
 * container already sets — no new colours are introduced.
 */

const BASE_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function WorkersIcon(props) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M3 20c0-3 2.5-5 5-5s5 2 5 5" />
      <path d="M14 20c0-2.4 1.8-4 4-4s4 1.6 4 4" />
    </svg>
  );
}

export function KnowledgeIcon(props) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5z" />
    </svg>
  );
}

export function MemoryIcon(props) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <path d="M9 9h6v6H9z" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

export function ChatIcon(props) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-5 4z" />
    </svg>
  );
}

export function OrchestrationIcon(props) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="5" cy="19" r="2.2" />
      <circle cx="19" cy="19" r="2.2" />
      <path d="M12 7.2V12M12 12 6.5 17M12 12l5.5 5" />
    </svg>
  );
}

export function OrganisationIcon(props) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <path d="M4 21V6.5A2.5 2.5 0 0 1 6.5 4H14v17" />
      <path d="M14 9h4.5A2.5 2.5 0 0 1 21 11.5V21" />
      <path d="M8 8h2M8 12h2M8 16h2M17 13h2M17 17h2" />
    </svg>
  );
}

export function ClockIcon(props) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CpuIcon(props) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <rect x="10" y="10" width="4" height="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" />
    </svg>
  );
}

export function StatusDot({ status }) {
  return <span className={status === 'operational' ? 'status-dot ok' : 'status-dot bad'} aria-hidden="true" />;
}
