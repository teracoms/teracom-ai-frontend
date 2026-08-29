import Link from 'next/link';

// CUSTOMER_EXPERIENCE_REDESIGN_V1 -- the new primary dashboard experience
// (objective item 1). Sits above the existing dashboard content, which is
// unchanged below it -- nothing removed, this is a new top section, not a
// replacement.
//
// CUSTOMER_EXPERIENCE_REFINEMENT_V1 Finding 1 -- three separate entry
// points (Start New Initiative / Chat with Orchestrator / Voice
// Conversation) collapsed to one. Voice, text, and file upload are now
// all real capabilities inside the one Orchestrator conversation
// (/portal/orchestrator, voiceEnabled) rather than separate
// destinations a customer has to choose between before they've even
// started. /portal/start (the one-shot Initiative form) is not
// deleted -- still real, still reachable directly -- just no longer
// a competing top-level button here.
export default function PrimaryActionHero() {
  return (
    <section className="hero hero-product">
      <div className="container">
        <div className="hero-copy">
          <h1>What would you like Teracom AI to do today?</h1>
          <p className="lead">
            Describe an outcome, type or speak — Teracom AI gets to work.
          </p>
          <div className="actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" href="/portal/orchestrator">
              Chat with Orchestrator
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
