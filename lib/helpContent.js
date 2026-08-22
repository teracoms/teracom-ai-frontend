// UI_IMPLEMENTATION_SPRINT_1.md item 4/10 — the Contextual Help Framework's
// content, kept in one place so it can be reviewed/edited without touching
// every page that uses it, the same convention this codebase already
// follows for other shared copy (e.g. ROLE_LABELS in several components).
//
// Each entry answers exactly the three questions the sprint asked for:
// what it is, why it exists, and one concrete example. Where a concept's
// real current behaviour is narrower than its name implies (Approval
// Thresholds), that's stated honestly here rather than glossed over —
// matching this codebase's existing precedent on the Governance page
// itself (UI_WALKTHROUGH_BACKLOG_V1.md item 8).
export const HELP_CONTENT = {
  knowledge: {
    title: 'Knowledge',
    whatIsIt: 'Documents you upload and organise — policies, procedures, SOPs, templates, training material, general organisational knowledge, and reference material — classified by category so it can be found and used.',
    whyItExists: 'Gives your Workers real, organisation-specific material to draw on, instead of only general knowledge — the difference between a Worker that knows your organisation and one that only knows how to talk.',
    example: 'Uploading your refund policy as a "Policy Documents" item so a Customer Success worker can answer refund questions correctly.',
    relatedConcepts: [
      {
        label: 'Workers',
        text: 'A Worker only sees Knowledge it has actually been assigned — uploading a document doesn\'t automatically give every Worker access to it (see Knowledge Assignment).',
      },
      {
        label: 'Organisational Memory',
        text: 'Knowledge and Memory are related but distinct, and today they are separate systems, stated honestly rather than implied to be connected: Knowledge is what you upload and organise — static documents. Memory is what a Worker, Department, or your organisation has learned or been told over time — dynamic facts recorded as conversations happen. Uploading a Knowledge document does not automatically create a memory. Both exist for the same underlying goal — giving your Workers real context — but they are built and consumed differently today.',
      },
    ],
  },
  department: {
    title: 'Department',
    whatIsIt: 'A grouping above Workers in your organisation — the same kind of structure a Sales team or Engineering team would be in a human organisation.',
    whyItExists: 'Gives your organisation a real place to organise Workers, assign a leader, and apply different rules to different parts of the business.',
    example: 'An "Engineering" department containing three Workers, one of them designated its Department Head.',
    // CUSTOMER_ONBOARDING_WIZARD_V1.md Step 2's own explicit ask: relation
    // to Workers, Governance, and the Executive Orchestrator, each as its
    // own distinct call-out rather than folded into one paragraph.
    relatedConcepts: [
      {
        label: 'Workers',
        text: 'Every Worker belongs to at most one Department. A Department with no Workers yet is a normal, valid state — assign Workers to it once you\'ve created some.',
      },
      {
        label: 'Governance',
        text: 'Organisation-wide Governance Rules apply to every Department by default; a Department Override replaces that default for one Department only.',
      },
      {
        label: 'the Executive Orchestrator',
        text: 'There is no separate "Executive Orchestrator" entity to create — Orchestration is a platform capability every Department automatically participates in. Designating one Department as your coordinating department (e.g. using the Executive template) is a naming choice, not a technical requirement.',
      },
    ],
  },
  executiveTeam: {
    title: 'Executive Team',
    whatIsIt: 'The named leadership roles you choose to recognise in your organisation — CEO, COO, CFO, CTO, and heads of Sales, Marketing, Operations, and Customer Success. Selecting a role here records that title as real for your organisation; it does not create an account or a person.',
    whyItExists: 'Gives your organisation a visible leadership layer above Departments, so the structure shown in the portal matches how your organisation actually thinks of itself — before any Workers or Department Heads exist yet.',
    example: "Selecting \"CTO\" and \"Head of Sales\" because those are real roles at your organisation today, leaving the rest unselected until they're needed.",
    relatedConcepts: [
      {
        label: 'the Executive Orchestrator',
        text: 'There is no separate "Executive Orchestrator" entity to create — Orchestration is a platform capability every Department automatically participates in. Selecting executive roles here is about naming your organisation\'s leadership, not configuring Orchestration itself.',
      },
      {
        label: 'Department Heads',
        text: 'A Department Head is a Worker, designated once that Worker belongs to a Department. Once you have Workers (a later step), it\'s common to designate a Department Head who also holds one of your selected Executive Team roles — for example, your Sales department\'s head also being your "Head of Sales".',
      },
      {
        label: 'Workers',
        text: 'Workers sit inside Departments, not directly under the Executive Team. The Executive Team is a naming/visibility layer above your Departments — it does not require or create any Worker on its own.',
      },
    ],
  },
  departmentHeads: {
    title: 'Department Head',
    whatIsIt: 'A Worker designated as the lead for their Department. It is an existing Worker, not a separate role, account, or entity of its own.',
    whyItExists: 'Gives each Department a clear point of coordination once it has Workers, and is what lets Department-Head-to-Department-Head communication happen for cross-department questions.',
    example: "Designating your Engineering department's most senior Worker as its Department Head, once that department has at least one Worker.",
    relatedConcepts: [
      {
        label: 'Workers',
        text: 'A Worker must already belong to the Department they lead before being designated its head — you cannot make an outside Worker the head of a Department they\'re not a member of.',
      },
      {
        label: 'the Executive Team',
        text: 'Department Heads are the natural bridge to any Executive Team role you\'ve selected — for example, tagging your Sales department\'s head as your organisation\'s "Head of Sales".',
      },
    ],
  },
  workers: {
    title: 'Workers',
    whatIsIt: 'An AI worker is a persona-driven AI agent assigned to a department, with its own knowledge, memory, and chat history.',
    whyItExists: 'Lets your organisation delegate real tasks — support, sales, documentation — to an AI without a human handling every request personally.',
    example: 'A "Backend Developer" worker in your Engineering department answers technical questions and helps triage tasks assigned to that department.',
  },
  digitalWorkforce: {
    title: 'Digital Workforce',
    whatIsIt: 'An aggregate view of every worker across your organisation — headcount, department structure, and pending worker-creation requests in one place.',
    whyItExists: 'Gives an admin a single screen to see workforce capacity and growth without visiting every department individually.',
    example: 'Checking whether your Sales department has enough active workers before approving a new worker-creation request.',
  },
  governance: {
    title: 'Governance',
    whatIsIt: 'Organisation-wide and department-level rules that record policy, standards, and knowledge-handling decisions.',
    whyItExists: 'Gives admins a documented, auditable place to set expectations for how workers and knowledge should be treated, with a real audit trail of who set what and when.',
    example: 'Setting a Knowledge Assignment rule so every new worker in the Support department automatically gains access to documents tagged "onboarding".',
  },
  federation: {
    title: 'Federation',
    whatIsIt: "A mechanism for a worker to escalate a question outside its own department's knowledge, for a second opinion from a related worker or department.",
    whyItExists: "Prevents a worker from confidently answering something it doesn't actually have the knowledge for.",
    example: 'A Sales worker facing a technical question escalates it to Engineering rather than guessing.',
  },
  memory: {
    title: 'Memory',
    whatIsIt: 'The record of what a worker has learned or been told during past conversations, retained and reused in future interactions.',
    whyItExists: 'Lets a worker build context over time instead of starting from zero on every conversation.',
    example: "A worker remembering a customer's stated preference from a chat last week, without being told again.",
  },
  orchestration: {
    title: 'Orchestration',
    whatIsIt: 'The process of breaking a larger request into subtasks and routing each one to the worker or department best suited to handle it.',
    whyItExists: 'Lets one request become several coordinated actions across departments, rather than one worker attempting the whole thing alone.',
    example: 'A CTO Orchestration request that produces a roadmap with tasks assigned across Engineering, Sales, and Documentation.',
  },
  departmentOverrides: {
    title: 'Department Overrides',
    whatIsIt: "A department-specific governance rule that replaces the organisation's own default for that one department only.",
    whyItExists: 'Lets one department follow a stricter or different policy than the rest of the organisation, without changing the org-wide default for everyone else.',
    example: "Overriding the organisation's default Knowledge Assignment tag for the Legal department specifically.",
  },
  knowledgeAssignment: {
    title: 'Knowledge Assignment',
    whatIsIt: 'A governance rule type that determines which uploaded documents a worker automatically gains access to, based on tags.',
    whyItExists: "This is currently the one governance rule type with a real, live effect — it's what actually controls what a worker can see, not just a policy statement.",
    example: 'Tagging a document "onboarding" and setting a department\'s Knowledge Assignment rule to that tag, so every worker in that department automatically gains access to it.',
  },
  approvalThresholds: {
    title: 'Approval Thresholds',
    whatIsIt: 'A governance rule intended to gate an action — for example a spending decision — behind a numeric limit requiring human sign-off above it.',
    whyItExists: 'Exists to let an organisation define where automated or worker action should stop and a human decision should take over.',
    example: "Stated honestly: setting a value here today records the number and is fully audited, but — unlike Knowledge Assignment — nothing in the platform currently reads it back to actually gate anything yet.",
  },
  policyRegister: {
    title: 'Policy Register',
    whatIsIt: 'The running, audited record of every governance rule an organisation or department has set, with who set it and when.',
    whyItExists: 'Gives an organisation a single place to review its own accumulated governance decisions rather than reconstructing them from memory.',
    example: 'Reviewing the Policy Register before an audit to confirm what rules are actually in effect.',
  },
  governanceRules: {
    title: 'Governance Rules',
    whatIsIt: 'An individual policy statement — a rule type, a key, and a value — set at the organisation level or overridden per department.',
    whyItExists: 'This is the basic unit Governance and Department Overrides are both built from; understanding one rule explains how the rest of the system works.',
    example: 'A rule of type "policy", key "data_retention_days", value "90".',
  },
};
