'use client';

import { useState } from 'react';

// CUSTOMER_EXPERIENCE_REDESIGN_V1 -- explicit placeholder only, per the
// objective's own "Voice Conversation (placeholder if required)". No voice
// capability exists anywhere in this backend today (confirmed by source
// search); this button says so honestly rather than silently doing
// nothing or pretending to start a call.
export default function VoiceConversationButton() {
  const [showNote, setShowNote] = useState(false);

  return (
    <div>
      <button type="button" className="btn btn-secondary" onClick={() => setShowNote(true)}>
        Voice Conversation
      </button>
      {showNote && (
        <p className="form-note" role="status" style={{ marginTop: '0.5rem' }}>
          Voice conversation is coming soon — for now, use Chat with Orchestrator.
        </p>
      )}
    </div>
  );
}
