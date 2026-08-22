// UI_IMPLEMENTATION_SPRINT_1.md item 4/10 — the reusable Contextual Help
// Framework. A native <details>/<summary> disclosure, deliberately not a
// client-side popover: it needs no 'use client' boundary (every page this
// is used on is a Server Component), and <details> already gives correct
// keyboard and screen-reader behaviour for free, matching the accessibility
// bar PortalNav.js's own dropdown menu set for this codebase.
//
// Pass either a `concept` key (looked up in lib/helpContent.js, the shared
// content dictionary) or the fields directly — the latter exists for a
// one-off concept that doesn't warrant a dictionary entry.
//
// `relatedConcepts` — CUSTOMER_ONBOARDING_WIZARD_V1.md Step 2's own
// requirement to explain how one concept relates to several others (e.g.
// Department -> Workers/Governance/Executive Orchestrator) as distinct,
// explicit call-outs rather than folding them into one paragraph. Optional
// — every existing concept without it renders exactly as before.
import { Fragment } from 'react';

import { HELP_CONTENT } from '@/lib/helpContent';

export default function ConceptHelp({ concept, title, whatIsIt, whyItExists, example, relatedConcepts }) {
  const content = concept
    ? HELP_CONTENT[concept]
    : { title, whatIsIt, whyItExists, example, relatedConcepts };

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
          {content.relatedConcepts?.map((related) => (
            <Fragment key={related.label}>
              <dt>How it relates to {related.label}</dt>
              <dd>{related.text}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </details>
  );
}
