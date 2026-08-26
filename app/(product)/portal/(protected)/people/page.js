import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchPersonas } from '@/lib/api/people';
import { errorMessage } from '@/lib/api/results';
import AvatarImage from '@/components/portal/AvatarImage';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'People | Teracom AI Portal',
};

// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- People Experience
// (focus area 3), the first top-level surface of the eventual
// Home/People/Conversations/Projects/Outputs/Protection navigation
// (focus area 6). Lists this organisation's own selected executive
// personas (GET /people/personas) -- an org that hasn't selected any
// executive roles yet (Onboarding Wizard Step 3) sees a real, honest
// empty state here rather than a fabricated default team.
export default async function PeoplePage() {
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

  let personas = [];
  let loadError = null;
  try {
    personas = await fetchPersonas(token);
  } catch (error) {
    loadError = error;
  }

  return (
    <main>
      <section className="hero hero-product hero-compact">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">
              <Link href="/portal/dashboard">&larr; Dashboard</Link>
            </span>
            <h1>Your Executive Team</h1>
            <p className="lead">
              Talk to whoever owns the part of the business you have a question about — every
              conversation draws on the same shared organisational memory.
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
          ) : personas.length === 0 ? (
            <EmptyState
              title="No executive roles selected yet"
              description="Select executive roles for your organisation during Administration Setup, then come back here to talk to them."
            />
          ) : (
            <ul className="activity-list">
              {personas.map((persona) => (
                <li key={persona.role_key}>
                  <div className="assignment-row">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <AvatarImage avatarRef={persona.avatar_ref} roleKey={persona.role_key} label={persona.label} />
                      <div>
                        <p className="activity-title">{persona.label}</p>
                        <p className="activity-meta">
                          {persona.worker_name ? `Delivered by ${persona.worker_name}` : 'No colleague assigned yet'}
                        </p>
                      </div>
                    </div>
                    <Link className="btn btn-primary btn-small" href={`/portal/people/${persona.role_key}`}>
                      Open Conversation
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
