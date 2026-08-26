'use client';

import { useState } from 'react';

import OrchestratorChat from '@/components/portal/OrchestratorChat';
import EmptyState from '@/components/portal/EmptyState';
import ProjectStatusControl from '@/components/portal/ProjectStatusControl';
import TaskPanel from '@/components/portal/TaskPanel';
import ProjectOutputsPanel from '@/components/portal/ProjectOutputsPanel';
import RequirementsPanel from '@/components/portal/RequirementsPanel';

const TABS = ['Conversation', 'Requirements', 'Files', 'Outputs', 'Activity'];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-AU', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// CUSTOMER_EXPERIENCE_REDESIGN_V1 -- item 4, "Conversation becomes primary
// interface. Tasks become secondary/internal." Conversation is the default
// tab; TaskPanel and ProjectStatusControl (the entire previous project
// page's own functionality) are preserved unchanged inside Activity, not
// removed -- just no longer the first thing a customer sees.
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
}) {
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
              />
            )}
          </div>
        )}

        {activeTab === 'Requirements' && (
          <div>
            <RequirementsPanel projectId={project.id} requirement={requirement ?? null} />
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
