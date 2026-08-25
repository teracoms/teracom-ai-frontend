// CUSTOMER_EXPERIENCE_REDESIGN_V1 -- picks a sensible default worker to
// front an Initiative, so the customer never has to know "worker" is a
// concept at all. This is a plain client-side keyword match, not real
// intelligence -- the actual decomposition/routing intelligence already
// lives server-side in services/cto_orchestration_service.py#generate_plan(),
// which POST /projects/plan (via planInitiative(), lib/api/initiative.js)
// re-routes through its own department-head-then-specialist chain regardless
// of which worker is passed in as the entry point. This heuristic only
// decides which worker starts that chain, and is deliberately simple and
// visible here rather than pretended to be smarter than it is.
const KEYWORD_HINTS = [
  { pattern: /website|landing page|web page|webpage/i, hints: ['web', 'design', 'frontend', 'developer'] },
  { pattern: /crm|software|app(lication)?|system|database|automation/i, hints: ['develop', 'engineer', 'software', 'technical'] },
  { pattern: /proposal|quote|contract/i, hints: ['sales', 'business', 'proposal', 'account'] },
  { pattern: /marketing|campaign|social media|advert/i, hints: ['marketing', 'campaign', 'content', 'brand'] },
  { pattern: /document|report|write|content/i, hints: ['writer', 'content', 'document', 'communications'] },
];

function scoreWorker(worker, hints) {
  const haystack = `${worker.role || ''} ${worker.purpose || ''}`.toLowerCase();
  return hints.reduce((score, hint) => (haystack.includes(hint) ? score + 1 : score), 0);
}

/**
 * Returns the most relevant active worker for a given free-text goal, or
 * null if there are no active workers at all. Preference order: (1) a
 * keyword-matched worker for the goal's apparent category, (2) a worker
 * whose role/purpose mentions "project manager" (Project.js's own stated
 * default-owner convention), (3) the first active worker.
 */
export function pickDefaultWorker(workers, goalText) {
  const active = (workers || []).filter((worker) => worker.status === 'active');
  if (active.length === 0) return null;

  const matchedHints = KEYWORD_HINTS.find((entry) => entry.pattern.test(goalText || ''))?.hints;
  if (matchedHints) {
    const scored = active
      .map((worker) => ({ worker, score: scoreWorker(worker, matchedHints) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);
    if (scored.length > 0) return scored[0].worker;
  }

  const projectManager = active.find((worker) =>
    `${worker.role || ''} ${worker.purpose || ''}`.toLowerCase().includes('project manager')
  );
  if (projectManager) return projectManager;

  return active[0];
}

// A short, human-readable project name derived from the customer's own
// free-text goal -- POST /projects/plan and POST /projects/ both require a
// `name`, but the Initiative flow deliberately asks for one thing only.
export function deriveProjectName(goalText) {
  const trimmed = (goalText || '').trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 60) return trimmed;
  return `${trimmed.slice(0, 57)}...`;
}
