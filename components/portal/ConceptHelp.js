// UI_IMPLEMENTATION_SPRINT_1.md item 4/10 — the reusable Contextual Help
// Framework. A native <details>/<summary> disclosure, deliberately not a
// client-side popover: it needs no 'use client' boundary (every page this
// is used on is a Server Component), and <details> already gives correct
// keyboard and screen-reader behaviour for free, matching the accessibility
// bar PortalNav.js's own dropdown menu set for this codebase.
//
// Pass either a `concept` key (looked up in lib/helpContent.js, the shared
// content dictionary) or the four fields directly — the latter exists for
// a one-off concept that doesn't warrant a dictionary entry.
import { HELP_CONTENT } from '@/lib/helpContent';

export default function ConceptHelp({ concept, title, whatIsIt, whyItExists, example }) {
  const content = concept ? HELP_CONTENT[concept] : { title, whatIsIt, whyItExists, example };

  if (!content) return null;

  return (
    <details className="concept-help">
      <summary className="concept-help-toggle" aria-label={`What is ${content.title}?`}>
        <span aria-hidden="true">?</span>
      </summary>
      <div className="concept-help-panel">
        <p className="concept-help-title">{content.title}</p>
        <dl>
          <dt>What is it?</dt>
          <dd>{content.whatIsIt}</dd>
          <dt>Why does it exist?</dt>
          <dd>{content.whyItExists}</dd>
          <dt>Example</dt>
          <dd>{content.example}</dd>
        </dl>
      </div>
    </details>
  );
}
