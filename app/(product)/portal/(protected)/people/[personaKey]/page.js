import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchPersonas, fetchPersonaConversation } from '@/lib/api/people';
import { errorMessage } from '@/lib/api/results';
import AvatarImage from '@/components/portal/AvatarImage';
import PersonaChat from '@/components/portal/PersonaChat';
import EmptyState from '@/components/portal/EmptyState';

export async function generateMetadata({ params }) {
  return { title: `${params.personaKey.replace(/_/g, ' ')} | Teracom AI Portal` };
}

// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- People Experience.
// Real, persisted per-user conversation with one executive persona.
// Fetches this organisation's persona list once to resolve the label/
// avatar/worker for the header (no dedicated GET /people/{key} exists,
// same fan-out precedent app/portal/(protected)/workspace/[projectId]
// already uses for its own project lookup), plus the real conversation
// history for this persona (empty on first visit -- an honest, not
// fabricated, empty state).
export default async function PersonaConversationPage({ params }) {
  const { personaKey } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">People</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  const [personasSettled, conversationSettled] = await Promise.allSettled([
    fetchPersonas(token),
    fetchPersonaConversation(token, personaKey),
  ]);

  if (personasSettled.status === 'rejected') {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">People</span>
            <p className="form-error" role="alert">
              {errorMessage(personasSettled.reason)}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const persona = (personasSettled.value ?? []).find((item) => item.role_key === personaKey);

  if (!persona) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">
              <Link href="/portal/people">&larr; People</Link>
            </span>
            <h1>This executive isn&apos;t available.</h1>
            <p className="lead">
              Your organisation hasn&apos;t selected this executive role, or it doesn&apos;t exist.
              See <Link href="/portal/people">your executive team</Link>.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const conversationMessages =
    conversationSettled.status === 'fulfilled' ? conversationSettled.value?.messages ?? [] : [];

  return (
    <main>
      <section className="hero hero-product hero-compact">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">
              <Link href="/portal/people">&larr; People</Link>
            </span>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <AvatarImage avatarRef={persona.avatar_ref} roleKey={persona.role_key} label={persona.label} size={64} />
              <div>
                <h1>{persona.label}</h1>
                <p className="lead">
                  {persona.worker_name ? `Delivered by ${persona.worker_name}` : 'No colleague assigned yet'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!persona.worker_id ? (
            <EmptyState
              title="No workers yet"
              description="Create a worker first, then come back here to talk to this executive."
            />
          ) : (
            <PersonaChat personaKey={persona.role_key} initialMessages={conversationMessages} />
          )}
        </div>
      </section>
    </main>
  );
}
