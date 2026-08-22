'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * "Customer Experience & Commercial Readiness Wave" objective #9 — AI
 * Concierge foundation. Confirmed scope: no live LLM yet (a real
 * generative responder on this public, unauthenticated surface is a
 * different risk profile — rate limiting, prompt injection — than
 * every existing Ollama use in this app, all of which sit behind
 * authenticated, multi-tenant contexts). This is a scripted router:
 * "Talk to Sales"/"Request Demo"/"Start Trial" go to the real actions
 * already built elsewhere on this page; "Trial questions"/"Platform
 * questions" expand a small, fixed FAQ. No backend call, no
 * fabricated conversation.
 */
const FAQS = {
  trial: [
    {
      q: 'How long is the trial?',
      a: '14 days, no credit card required. You can start one right from this page.',
    },
    {
      q: 'What happens when my trial ends?',
      a: "You'll get a grace period to keep using your workspace before it moves to a locked, read-only state. Contact us any time to move to a full plan.",
    },
    {
      q: 'How many workers do I get on a trial?',
      a: 'Trials include a small allocation of AI workers so you can try real workflows - contact sales for full-tier limits.',
    },
  ],
  platform: [
    {
      q: 'What is Teracom AI Workforce?',
      a: 'A platform for building and running AI workers - for sales, customer success, finance, operations, marketing and more - across your organisation.',
    },
    {
      q: 'What is SecurityOS?',
      a: 'SecurityOS is a Teracom AI product built specifically for electronic security professionals - technical support, documentation and estimation assistance.',
    },
    {
      q: "What's Contact Sales help with?",
      a: 'Tiers, hosting models, and rollout planning for your organisation.',
    },
  ],
};

export default function AiConciergePlaceholder() {
  const [openTopic, setOpenTopic] = useState(null);

  function toggleTopic(topic) {
    setOpenTopic((current) => (current === topic ? null : topic));
  }

  return (
    <div className="ai-concierge-card">
      <div className="ai-concierge-copy">
        <span className="badge">Concierge foundation</span>
        <h3>Ask the Teracom AI Concierge</h3>
        <p>
          Quick answers about trials and the platform, and fast routes to the team - not yet a
          live AI assistant.
        </p>

        <div className="mini-services" style={{ marginTop: '18px' }}>
          <Link href="/portal/start-trial">Start Trial</Link>
          <Link href="https://www.teracomsolutions.com.au/?interest=Request+Demo#contact">Request Demo</Link>
          <Link href="https://www.teracomsolutions.com.au/?interest=Talk+to+Sales#contact">Talk to Sales</Link>
          <button type="button" className={openTopic === 'trial' ? 'active' : ''} onClick={() => toggleTopic('trial')}>
            Trial questions
          </button>
          <button
            type="button"
            className={openTopic === 'platform' ? 'active' : ''}
            onClick={() => toggleTopic('platform')}
          >
            Platform questions
          </button>
        </div>

        {openTopic && (
          <ul className="activity-list" style={{ marginTop: '18px' }}>
            {FAQS[openTopic].map((item) => (
              <li key={item.q}>
                <p className="activity-title">{item.q}</p>
                <p className="activity-meta">{item.a}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
