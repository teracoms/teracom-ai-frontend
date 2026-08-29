import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchProjects } from '@/lib/api/projects';
import { fetchPersonas } from '@/lib/api/people';
import { fetchMyChatSessions } from '@/lib/api/chat';
import { settle, errorMessage } from '@/lib/api/results';
import AvatarImage from '@/components/portal/AvatarImage';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Executive Team | Teracom AI Portal',
};

// CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec3 -- the real merge of the
// previously-separate "People" (/portal/people) and "Conversations"
// (/portal/conversations) nav entries CUSTOMER_EXPERIENCE_REDESIGN_V2
// Sec6/Sec12 item 5 found reaching substantially the same content two
// different ways. One page: talk to the Orchestrator, start a Voice
// Conversation, every executive persona, and every project
// conversation -- no new backend endpoint or data, purely an index
// over the real fetchProjects()/fetchPersonas() both prior pages
// already used. /portal/people and /portal/conversations now redirect
// here rather than being deleted, per that same review's own
// "nothing recommended for removal" finding.
export default async function ExecutiveTeamPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Executive Team</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  const [projectsSettled, personasSettled, sessionsSettled] = await Promise.allSettled([
    fetchProjects(token),
    fetchPersonas(token),
    fetchMyChatSessions(token),
  ]);

  const projectsResult = settle(projectsSettled);
  const personasResult = settle(personasSettled);
  const sessionsResult = settle(sessionsSettled);
  const projects = projectsResult.value ?? [];
  const personas = personasResult.value ?? [];
  // PROJ001 -- "Draft Conversations": a pre-project Orchestrator
  // conversation the customer started but hasn't (yet) turned into a
  // project. Previously these were never persisted at all and simply
  // vanished on navigating away -- this is the real fix, not cosmetic.
  const draftConversations = (sessionsResult.value ?? []).filter((s) => s.kind === 'orchestrator_draft');

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

          {draftConversations.length > 0 && (
            <>
              <div className="section-heading left">
                <span className="eyebrow">Draft conversations</span>
                <p>Started but not yet turned into a project — pick up right where you left off.</p>
              </div>
              <ul className="activity-list" style={{ marginBottom: '2rem' }}>
                {draftConversations.map((session) => (
                  <li key={session.id}>
                    <div className="assignment-row">
                      <div>
                        <p className="activity-title">{session.title || 'Untitled conversation'}</p>
                        <p className="activity-meta">
                          Last message {new Date(session.last_message_at ?? session.created_at).toLocaleString('en-AU', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Link className="btn btn-primary btn-small" href={`/portal/orchestrator?session=${session.id}`}>
                        Resume Conversation
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="section-heading left">
            <span className="eyebrow">Executive team</span>
          </div>
          {personasResult.error ? (
            <p className="form-error" role="alert" style={{ marginBottom: '2rem' }}>
              {errorMessage(personasResult.error)}
            </p>
          ) : personas.length === 0 ? (
            <EmptyState
              title="No executive roles selected yet"
              description="Select executive roles for your organisation during Administration Setup, then come back here to talk to them."
            />
          ) : (
            <ul className="activity-list" style={{ marginBottom: '2rem' }}>
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
                    <Link className="btn btn-primary btn-small" href={`/portal/team/${persona.role_key}`}>
                      Open Conversation
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="section-heading left">
            <span className="eyebrow">Active conversations</span>
            <p>Project conversations — already real, persisted throughout each project.</p>
          </div>
          {projectsResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(projectsResult.error)}
            </p>
          ) : projects.length === 0 ? (
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
