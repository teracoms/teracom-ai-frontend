/**
 * "Platform Review Wave 1" objective #4 — reserved space for an AI
 * Concierge Assistant on the login/marketing-facing surface. Purely
 * presentational: no backend integration exists for this yet, so it
 * is honestly labelled "Coming soon" rather than wired to a fake
 * response, the same discipline this codebase already applies to
 * every other not-yet-built surface (e.g. connectors, Section 8).
 */
export default function AiConciergePlaceholder() {
  return (
    <div className="ai-concierge-card">
      <div className="ai-concierge-copy">
        <span className="badge">Coming soon</span>
        <h3>AI Concierge Assistant</h3>
        <p>
          Ask questions about Teracom AI Workforce, pricing tiers, or getting started — a
          concierge assistant will be available here soon.
        </p>
      </div>
      <div className="ai-concierge-input" aria-hidden="true">
        <input type="text" placeholder="Ask the Teracom AI Concierge..." disabled />
        <span className="btn btn-secondary btn-small">Ask</span>
      </div>
    </div>
  );
}
