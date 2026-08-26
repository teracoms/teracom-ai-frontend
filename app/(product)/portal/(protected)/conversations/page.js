import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchProjects } from '@/lib/api/projects';
import { fetchPersonas } from '@/lib/api/people';
import { settle } from '@/lib/api/results';
import AvatarImage from '@/components/portal/AvatarImage';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Conversations | Teracom AI Portal',
};

// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- Navigation Refactor
// (focus area 6). A single hub for every real conversation surface this
// platform has: Chat with Orchestrator (pre-project), Voice Conversation,
// each project's own persisted Conversation tab, and each executive
// persona's conversation. No new backend endpoint or data of its own --
// purely an index over the real fetchProjects()/fetchPersonas() this
// platform already has, closing the "Conversations" gap in the
// Home/People/Conversations/Projects/Outputs/Protection navigation
// vocabulary without inventing a new conversation engine.
export default async function ConversationsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Conversations</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  const [projectsSettled, personasSettled] = await Promise.allSettled([
    fetchProjects(token),
    fetchPersonas(token),
  ]);

  const projects = settle(projectsSettled).value ?? [];
  const personas = settle(personasSettled).value ?? [];

  return (
    <main>
      <section className="hero hero-product hero-compact">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">
              <Link href="/portal/dashboard">&larr; Dashboard</Link>
            </span>
            <h1>Conversations</h1>
            <p className="lead">Every conversation with Teracom AI, in one place.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Start a new conversation</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <Link className="btn btn-primary" href="/portal/orchestrator">
              Chat with Orchestrator
            </Link>
            <Link className="btn btn-secondary" href="/portal/voice">
              Voice Conversation
            </Link>
          </div>

          <div className="section-heading left">
            <span className="eyebrow">Executive team</span>
          </div>
          {personas.length === 0 ? (
            <p className="activity-meta" style={{ marginBottom: '2rem' }}>
              No executive roles selected yet — see <Link href="/portal/people">People</Link>.
            </p>
          ) : (
            <ul className="activity-list" style={{ marginBottom: '2rem' }}>
              {personas.map((persona) => (
                <li key={persona.role_key}>
                  <div className="assignment-row">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <AvatarImage avatarRef={persona.avatar_ref} roleKey={persona.role_key} label={persona.label} size={36} />
                      <p className="activity-title">{persona.label}</p>
                    </div>
                    <Link className="btn btn-secondary btn-small" href={`/portal/people/${persona.role_key}`}>
                      Continue
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="section-heading left">
            <span className="eyebrow">Project conversations</span>
          </div>
          {projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Start an initiative to begin a project conversation."
            />
          ) : (
            <ul className="activity-list">
              {projects.map((project) => (
                <li key={project.id}>
                  <div className="assignment-row">
                    <p className="activity-title">{project.name}</p>
                    <Link className="btn btn-secondary btn-small" href={`/portal/workspace/${project.id}`}>
                      Open
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
