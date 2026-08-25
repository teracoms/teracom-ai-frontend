import Link from 'next/link';

import VoiceConversationButton from '@/components/portal/VoiceConversationButton';

// CUSTOMER_EXPERIENCE_REDESIGN_V1 -- the new primary dashboard experience
// (objective item 1). Sits above the existing dashboard content, which is
// unchanged below it -- nothing removed, this is a new top section, not a
// replacement.
export default function PrimaryActionHero() {
  return (
    <section className="hero hero-product">
      <div className="container">
        <div className="hero-copy">
          <h1>What would you like Teracom AI to do today?</h1>
          <p className="lead">
            Describe an outcome and Teracom AI gets to work — or talk it through first.
          </p>
          <div className="actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" href="/portal/start">
              Start New Initiative
            </Link>
            <Link className="btn btn-secondary" href="/portal/orchestrator">
              Chat with Orchestrator
            </Link>
            <VoiceConversationButton />
          </div>
        </div>
      </div>
    </section>
  );
}
