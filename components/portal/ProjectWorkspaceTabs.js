'use client';

import { useState } from 'react';

import OrchestratorChat from '@/components/portal/OrchestratorChat';
import EmptyState from '@/components/portal/EmptyState';
import ProjectStatusControl from '@/components/portal/ProjectStatusControl';
import TaskPanel from '@/components/portal/TaskPanel';
import ProjectOutputsPanel from '@/components/portal/ProjectOutputsPanel';
import RequirementsPanel from '@/components/portal/RequirementsPanel';
import ProjectLifecycleTracker from '@/components/portal/ProjectLifecycleTracker';
import GenerateEngineeringPlanButton from '@/components/portal/GenerateEngineeringPlanButton';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-AU', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec7 -- the five-tab layout this
// component used to render (Conversation/Requirements/Files/Outputs/
// Activity) collapses to two customer-facing tabs. Requirements (Sec5,
// now automatic) is folded directly into Conversation rather than kept
// as a tab of its own -- a customer reads their own requirements
// alongside the conversation that produced them, not by navigating
// away from it. Files and Activity aren't deleted (V2's own "nothing
// removed" finding still applies) -- they relocate here into
// Administration Mode, gated by the same `administrationMode` prop
// PortalNav already computes from role + preference (see
// CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec3), so only an admin who has
// switched into that mode sees them at all.
export default function ProjectWorkspaceTabs({
  project,
  conversationWorker,
  conversationMessages,
  requirement,
  uploads,
  outputs,
  storageUsage,
  taskExecutions,
  tasks,
  workers,
  workerPools,
  loadErrors,
  administrationMode,
  voicePreferences,
  orgVoiceProviderConfig,
}) {
  const TABS = administrationMode
    ? ['Conversation', 'Outputs', 'Files', 'Activity']
    : ['Conversation', 'Outputs'];
  const [activeTab, setActiveTab] = useState('Conversation');

  return (
    <div>
      <div role="tablist" aria-label="Project sections">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
            style={{ marginRight: '0.5rem' }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {activeTab === 'Conversation' && (
          <div>
            <ProjectLifecycleTracker
              conversationMessages={conversationMessages}
              requirement={requirement ?? null}
              tasks={tasks}
              outputs={outputs}
              workers={workers}
              project={project}
              onViewOutputs={() => setActiveTab('Outputs')}
            />

            {/* CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec5/Sec7 -- Requirements is
                automatic now, not a separate manual tab a customer has to
                remember to visit. It's docked above the thread it was
                generated from, so a customer sees what Teracom AI
                understood before reading how the conversation got there. */}
            <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--line)' }}>
              <RequirementsPanel projectId={project.id} requirement={requirement ?? null} />
            </div>

            {!conversationWorker ? (
              <EmptyState
                title="No workers yet"
                description="Create a worker first, then come back here to talk about this project."
              />
            ) : (
              <OrchestratorChat
                workerId={conversationWorker.id}
                projectId={project.id}
                initialMessages={conversationMessages}
                voiceEnabled
                voicePreferences={voicePreferences}
                orgVoiceProviderConfig={orgVoiceProviderConfig}
              />
            )}
          </div>
        )}

        {activeTab === 'Files' && (
          <div>
            <p className="form-note">
              Your organisation&apos;s shared knowledge library — files here aren&apos;t limited to this
              project yet, but this worker can draw on all of them.
            </p>
            {loadErrors?.uploads ? (
              <p className="form-error" role="alert">{loadErrors.uploads}</p>
            ) : (uploads ?? []).length === 0 ? (
              <EmptyState title="No files yet" description="Upload a document from Knowledge to see it here." />
            ) : (
              <ul className="activity-list">
                {uploads.map((item) => (
                  <li key={item.id}>
                    <p className="activity-title">{item.title}</p>
                    {item.document_type && <p className="activity-meta">{item.document_type}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'Outputs' && (
          <div>
            {/* OUTPUT_REPOSITORY_IMPLEMENTATION_V1 -- real, downloadable
                deliverables are now the primary content of this tab. */}
            <ProjectOutputsPanel projectId={project.id} outputs={outputs ?? []} storageUsage={storageUsage} />

            {/* Preserved verbatim from before this change, not removed --
                genuine execution telemetry (what a task actually did,
                verification results), a different thing from a
                downloadable deliverable, kept as supporting technical
                detail underneath the real outputs above. */}
            <div className="section-heading left" style={{ marginTop: '2rem' }}>
              <span className="eyebrow">Execution details</span>
              <h3>What Teracom AI&apos;s workers did, task by task.</h3>
            </div>
            {(taskExecutions ?? []).length === 0 ? (
              <EmptyState
                title="No execution records yet"
                description="Execution details appear here once tasks in this project are completed."
              />
            ) : (
              <ul className="activity-list">
                {taskExecutions.map(({ task, executions }) => (
                  <li key={task.id}>
                    <p className="activity-title">{task.title}</p>
                    <p className="activity-meta">Completed {formatDate(task.completed_at)}</p>
                    {executions.length === 0 ? (
                      <p className="activity-meta">No execution record available.</p>
                    ) : (
                      executions.map((execution) => (
                        <div key={execution.id} style={{ marginTop: '0.5rem' }}>
                          <span className="badge">{execution.status}</span>
                          {execution.verification_result && (
                            <p className="activity-meta">
                              Verification: {JSON.stringify(execution.verification_result)}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'Activity' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <ProjectStatusControl projectId={project.id} status={project.status} />
            </div>

            {/* PROJECT_EXECUTION_AND_VOICE_V1 -- the real, previously-
                unreachable link between Requirements and Task Creation.
                Placed above the plain task list/manual create form
                below (both preserved unchanged) since generating a plan
                from what's already been captured is the normal next
                step, manual task authoring the fallback. */}
            <div style={{ marginBottom: '1.5rem' }}>
              <GenerateEngineeringPlanButton projectId={project.id} primaryWorkerId={conversationWorker?.id} />
            </div>

            <div className="section-heading left">
              <span className="eyebrow">Tasks</span>
              <h2>Every task in this project.</h2>
            </div>
            <p className="form-note">
              Internal working detail — most people won&apos;t need this, but it&apos;s here if you do.
            </p>

            {loadErrors?.tasks || loadErrors?.workers ? (
              <p className="form-error" role="alert">
                {loadErrors.tasks ?? loadErrors.workers}
              </p>
            ) : (
              <TaskPanel projectId={project.id} tasks={tasks} workers={workers} workerPools={workerPools} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
