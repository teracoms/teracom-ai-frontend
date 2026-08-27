'use client';

// PROJECT_LIFECYCLE_AND_VOICE_REMEDIATION_V1 -- real customer feedback:
// "cannot determine where they are in the process, what is happening,
// what stage the project is at, what action is required next, whether
// work is running, where outputs are located." Every signal below is
// derived from data this workspace already fetches (conversation
// messages, the real ProjectRequirement, the real Task list, the real
// OutputArtifact list) -- no new backend endpoint, no new table, no
// fabricated status. Task title prefixes ("[QA] Follow-up: ...",
// "[Documentation] Follow-up: ...") are the same real, already-live
// naming convention services/execution_service.py#_maybe_create_handoff()
// establishes -- reused here to identify which task is the QA/
// Documentation step, not invented for this component.

const STAGE_DEFS = [
  { key: 'conversation', label: 'Conversation Started' },
  { key: 'requirements_gathering', label: 'Requirements Gathering' },
  { key: 'requirements_review', label: 'Requirements Review' },
  { key: 'planning', label: 'Planning' },
  { key: 'execution', label: 'Execution' },
  { key: 'qa_review', label: 'QA Review' },
  { key: 'documentation', label: 'Documentation' },
  { key: 'output_generation', label: 'Output Generation' },
  { key: 'complete', label: 'Complete' },
];

function isHandoffTask(task, role) {
  return task.title?.startsWith(`[${role}] Follow-up:`);
}

function workerName(workerId, workers) {
  return (workers ?? []).find((w) => w.id === workerId)?.name ?? null;
}

/**
 * Derives the full lifecycle state from already-real data. Exported
 * separately from the component so it stays easy to reason about (and
 * test) independent of rendering.
 */
export function deriveLifecycle({ conversationMessages, requirement, tasks, outputs, workers, project }) {
  const taskList = tasks ?? [];
  const outputList = outputs ?? [];

  const hasConversation = (conversationMessages ?? []).length > 0;
  const hasRequirement = requirement != null;
  const requirementReviewed = requirement != null && requirement.status !== 'draft';
  const hasTasks = taskList.length > 0;
  const hasOutputs = outputList.length > 0;

  const qaTask = taskList.find((t) => isHandoffTask(t, 'QA'));
  const docTask = taskList.find((t) => isHandoffTask(t, 'Documentation'));
  const rootTasks = taskList.filter((t) => !isHandoffTask(t, 'QA') && !isHandoffTask(t, 'Documentation'));
  const rootTasksDone = hasTasks && rootTasks.length > 0 && rootTasks.every((t) => t.status === 'done');
  const rootTaskInProgress = rootTasks.find((t) => t.status === 'in_progress' || t.status === 'pending');

  const done = {
    conversation: hasConversation,
    requirements_gathering: hasRequirement,
    requirements_review: requirementReviewed,
    planning: hasTasks,
    execution: rootTasksDone,
    qa_review: qaTask ? qaTask.status === 'done' : hasOutputs,
    documentation: docTask ? docTask.status === 'done' : hasOutputs,
    output_generation: hasOutputs,
    complete: hasOutputs && project?.status === 'completed',
  };

  const stages = STAGE_DEFS.map((def) => ({ ...def, done: Boolean(done[def.key]) }));

  // Real edge case, found live: a project routed through the automatic
  // engineering-plan pipeline (AUTONOMOUS_ORGANISATION_VALIDATION_V1)
  // can reach Execution/QA/Documentation/Output Generation while
  // Requirements Review still honestly sits at "draft" -- nothing in
  // that pipeline requires the customer to have clicked "confirm" for
  // real work to proceed. "Current stage" is therefore the stage right
  // after the *furthest* real progress made, not the first gap found --
  // otherwise a project with a real, ready Output would still show
  // "waiting for you to review Requirements" as if nothing had
  // happened since, which is actively misleading, not just imprecise.
  // Each stage's own ✅/⚪ still reflects its own real done value
  // unchanged -- an unconfirmed Requirements stage still shows ⚪
  // honestly, it just isn't what's highlighted as current.
  let furthestDoneIndex = -1;
  stages.forEach((stage, index) => {
    if (stage.done) furthestDoneIndex = index;
  });
  const currentIndex = furthestDoneIndex >= stages.length - 1 ? -1 : furthestDoneIndex + 1;
  const currentStage = currentIndex === -1 ? stages[stages.length - 1] : stages[currentIndex];
  const nextStage = currentIndex === -1 ? null : stages[currentIndex + 1] ?? null;

  // Active Owner / Active Status -- honest, stage-specific, naming a
  // real worker by name where one exists, or the customer's own next
  // action where the ball is genuinely in their court (never invents a
  // worker that isn't actually assigned).
  let activeOwner = 'Teracom AI';
  let activeStatus = 'Waiting to start';

  switch (currentStage?.key) {
    case 'conversation':
      activeOwner = 'You';
      activeStatus = 'Waiting for the first message';
      break;
    case 'requirements_gathering':
      activeOwner = 'Teracom AI';
      activeStatus = 'Extracting requirements from the conversation';
      break;
    case 'requirements_review':
      activeOwner = 'You';
      activeStatus = 'Waiting for you to review and confirm the requirements';
      break;
    case 'planning': {
      activeOwner = 'Administrator';
      activeStatus = hasRequirement ? 'Waiting for the engineering plan to be generated' : 'Waiting on requirements first';
      break;
    }
    case 'execution': {
      const name = rootTaskInProgress ? workerName(rootTaskInProgress.assignee_worker_id, workers) : null;
      activeOwner = name ?? 'Administrator';
      activeStatus = rootTaskInProgress?.status === 'in_progress' ? 'Running now' : 'Queued, waiting to be executed';
      break;
    }
    case 'qa_review': {
      const name = qaTask ? workerName(qaTask.assignee_worker_id, workers) : null;
      activeOwner = name ?? 'QA';
      activeStatus = qaTask ? (qaTask.status === 'in_progress' ? 'Running now' : 'Queued, waiting to be executed') : 'Waiting for execution to finish';
      break;
    }
    case 'documentation': {
      const name = docTask ? workerName(docTask.assignee_worker_id, workers) : null;
      activeOwner = name ?? 'Documentation';
      activeStatus = docTask ? (docTask.status === 'in_progress' ? 'Running now' : 'Queued, waiting to be executed') : 'Waiting for QA to finish';
      break;
    }
    case 'output_generation':
      activeOwner = 'Teracom AI';
      activeStatus = 'Waiting for documentation to finish';
      break;
    case 'complete':
      activeOwner = 'You';
      activeStatus = hasOutputs ? 'All work is done -- outputs are ready' : 'Waiting for outputs';
      break;
    default:
      break;
  }

  // TERACOM_PLATFORM_EVOLUTION_V1 -- "Current Project Progress," a real
  // fraction of the same nine honestly-derived stages above, not a
  // separately-invented percentage. A skipped-but-caught-up stage (the
  // Requirements Review edge case above) still counts as not-done here
  // -- deliberately: the progress fraction is "how much is genuinely
  // finished," not "how far did we get before hitting a gap," which is
  // what currentStage/nextStage already answer.
  const doneCount = stages.filter((stage) => stage.done).length;
  const progressPercent = Math.round((doneCount / stages.length) * 100);

  return {
    stages,
    currentStage,
    nextStage,
    activeOwner,
    activeStatus,
    outputCount: outputList.length,
    doneCount,
    totalStages: stages.length,
    progressPercent,
  };
}

function StageIcon({ done, current }) {
  if (done) return <span aria-hidden="true">✅</span>;
  if (current) return <span aria-hidden="true">🟡</span>;
  return <span aria-hidden="true">⚪</span>;
}

export default function ProjectLifecycleTracker({ conversationMessages, requirement, tasks, outputs, workers, project, onViewOutputs }) {
  const {
    stages,
    currentStage,
    nextStage,
    activeOwner,
    activeStatus,
    outputCount,
    doneCount,
    totalStages,
    progressPercent,
  } = deriveLifecycle({
    conversationMessages,
    requirement,
    tasks,
    outputs,
    workers,
    project,
  });

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="section-heading left" style={{ marginTop: 0 }}>
        <span className="eyebrow">Project Lifecycle</span>
        <h3>{currentStage?.label ?? 'Not started'}</h3>
      </div>

      {/* TERACOM_PLATFORM_EVOLUTION_V1 -- "Current Project Progress," a
          real, honest fraction of the same nine stages above, not a
          separate invented number. */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p className="activity-meta" style={{ marginBottom: '0.4rem' }}>
          <strong>Current Project Progress:</strong> {doneCount} of {totalStages} stages complete ({progressPercent}%)
        </p>
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              borderRadius: '999px',
              background: progressPercent === 100 ? 'var(--red)' : '#ffb800',
              transition: 'width .3s ease',
            }}
          />
        </div>
      </div>

      <ul style={{ listStyle: 'none', margin: '0 0 1.25rem', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {stages.map((stage) => (
          <li
            key={stage.key}
            style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', opacity: stage.key === currentStage?.key ? 1 : stage.done ? 0.85 : 0.55 }}
          >
            <StageIcon done={stage.done} current={stage.key === currentStage?.key} />
            <span className={stage.key === currentStage?.key ? 'activity-title' : 'activity-meta'}>{stage.label}</span>
          </li>
        ))}
      </ul>

      <div className="stat-grid stat-grid-3" style={{ marginBottom: outputCount > 0 ? '1rem' : 0 }}>
        <div>
          <span className="eyebrow">Current Stage</span>
          <p className="activity-title">{currentStage?.label ?? '—'}</p>
        </div>
        <div>
          <span className="eyebrow">Next Stage</span>
          <p className="activity-title">{nextStage?.label ?? 'None -- this is the last stage'}</p>
        </div>
        <div>
          <span className="eyebrow">Active Owner</span>
          <p className="activity-title">{activeOwner}</p>
        </div>
      </div>

      <p className="activity-meta">
        <strong>Status:</strong> {activeStatus}
      </p>

      {outputCount > 0 && (
        <button type="button" className="btn btn-secondary btn-small" onClick={onViewOutputs} style={{ marginTop: '0.75rem' }}>
          View {outputCount} available {outputCount === 1 ? 'Output' : 'Outputs'}
        </button>
      )}
    </div>
  );
}
