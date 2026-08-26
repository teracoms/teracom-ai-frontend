import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList } from '@/lib/api/workers';
import { errorMessage } from '@/lib/api/results';
import { pickDefaultWorker } from '@/lib/portalInitiative';
import OrchestratorChat from '@/components/portal/OrchestratorChat';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Voice Conversation | Teracom AI Portal',
};

// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- Voice Experience
// Foundation (focus area 4). Replaces VoiceConversationButton.js's own
// prior honest placeholder ("no voice capability exists anywhere in this
// backend today") now that one does: real browser-native speech-to-text/
// text-to-speech (lib/voice/speechProvider.js), layered onto the exact
// same pre-project Orchestrator conversation /portal/orchestrator already
// uses -- OrchestratorChat with voiceEnabled, not a separate conversation
// engine.
export default async function VoicePage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Voice Conversation</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  let workers = [];
  let loadError = null;
  try {
    workers = await fetchWorkerList(token);
  } catch (error) {
    loadError = error;
  }

  const orchestratorWorker = pickDefaultWorker(workers, '');

  return (
    <main>
      <section className="hero hero-product hero-compact">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">
              <Link href="/portal/dashboard">&larr; Dashboard</Link>
            </span>
            <h1>Voice Conversation</h1>
            <p className="lead">
              Speak to the Orchestrator and hear it reply — the full text transcript is shown
              alongside, the same conversation either way.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loadError ? (
            <p className="form-error" role="alert">
              {errorMessage(loadError)}
            </p>
          ) : !orchestratorWorker ? (
            <EmptyState
              title="No workers yet"
              description="Create a worker first, then come back here to talk."
            />
          ) : (
            <OrchestratorChat workerId={orchestratorWorker.id} voiceEnabled />
          )}
        </div>
      </section>
    </main>
  );
}
