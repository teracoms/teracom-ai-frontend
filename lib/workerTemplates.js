// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 4 -- Wizard Framework V4,
// "Worker Templates." Deliberately frontend-only static data, the same
// judgement call Step 2's DEPARTMENT_TEMPLATES already made and
// documented: no worker-template table or endpoint exists, and
// building one is unnecessary -- a hardcoded, curated starter list
// pre-fills the existing create-worker form (POST /workers/).
//
// `suggestedDepartmentFunction`/`suggestedExecutiveRoleKey` are hints
// only, shown in the UI as a recommendation -- they don't auto-assign
// anything. They match Department.function's free-string convention
// (lib/departmentTemplates.js) and schemas/executive_role.py's fixed
// VALID_EXECUTIVE_ROLE_KEYS respectively, but a template can be used
// regardless of whether that department or executive role exists yet
// in this organisation.
//
// `whatItDoes`/`whyItExists`/`exampleUseCase` satisfy requirement #5,
// "Workforce Guidance" -- kept on the template itself rather than
// folded into lib/helpContent.js, since these are 11 distinct
// worker-type descriptions, not general platform concepts.
//
// Plain data, deliberately not inside a 'use client' component -- see
// lib/portalNavGroups.js's own docstring for why (Next.js turns every
// export of a 'use client' file into a client-boundary reference,
// breaking any Server Component that tries to read it).
export const WORKER_TEMPLATES = [
  {
    key: 'financial_analyst',
    name: 'Financial Analyst',
    role: 'financial_analyst',
    purpose: 'Analyses financial data and reports on the organisation\'s financial position.',
    instructions:
      'You are a Financial Analyst. Help with budgets, spend analysis, and financial reporting questions. Be precise with numbers and flag when you are estimating rather than citing an exact figure.',
    whatItDoes: 'Answers questions about budgets, spend, and financial reports, and helps prepare financial summaries.',
    whyItExists: 'Gives your Finance department a first point of contact for financial questions without waiting on a human analyst for every request.',
    exampleUseCase: 'Asking "what was our spend on contractors last quarter?" and getting a summarised answer.',
    suggestedDepartmentFunction: 'finance',
    suggestedExecutiveRoleKey: 'cfo',
  },
  {
    key: 'cfo_assistant',
    name: 'CFO Assistant',
    role: 'cfo_assistant',
    purpose: 'Supports the CFO with financial oversight, reporting, and planning tasks.',
    instructions:
      'You are a CFO Assistant. Help prepare financial summaries, track outstanding financial decisions, and surface anything that needs the CFO\'s attention. Defer final financial decisions to a human.',
    whatItDoes: 'Prepares summaries and tracks outstanding items for the person holding your organisation\'s CFO role.',
    whyItExists: 'Gives your CFO (once you\'ve selected that role in Executive Structure) day-to-day support without needing a dedicated human assistant from day one.',
    exampleUseCase: 'Compiling a weekly summary of financial decisions still awaiting sign-off.',
    suggestedDepartmentFunction: 'finance',
    suggestedExecutiveRoleKey: 'cfo',
  },
  {
    key: 'cto_assistant',
    name: 'CTO Assistant',
    role: 'cto_assistant',
    purpose: 'Supports the CTO with technical planning, prioritisation, and status tracking.',
    instructions:
      'You are a CTO Assistant. Help track technical priorities, summarise engineering status, and flag technical risks. Defer architecture and technical decisions to a human.',
    whatItDoes: 'Tracks technical priorities and summarises engineering status for the person holding your organisation\'s CTO role.',
    whyItExists: 'Gives your CTO a single place to get a status summary across Engineering without chasing individual updates.',
    exampleUseCase: 'Summarising which engineering priorities are on track versus at risk this week.',
    suggestedDepartmentFunction: 'engineering',
    suggestedExecutiveRoleKey: 'cto',
  },
  {
    key: 'coo_assistant',
    name: 'COO Assistant',
    role: 'coo_assistant',
    purpose: 'Supports the COO with operational planning, tracking, and coordination.',
    instructions:
      'You are a COO Assistant. Help track operational priorities and coordinate across departments on the COO\'s behalf. Defer operational decisions to a human.',
    whatItDoes: 'Tracks operational priorities and coordinates across departments for the person holding your organisation\'s COO role.',
    whyItExists: 'Gives your COO visibility across departments without manually chasing every team for a status update.',
    exampleUseCase: 'Compiling a cross-department operational status summary ahead of a leadership meeting.',
    suggestedDepartmentFunction: 'operations',
    suggestedExecutiveRoleKey: 'coo',
  },
  {
    key: 'sales_specialist',
    name: 'Sales Specialist',
    role: 'sales_specialist',
    purpose: 'Supports pipeline management and customer acquisition activities.',
    instructions:
      'You are a Sales Specialist. Help track pipeline, prepare outreach material, and answer questions about deals in progress. Do not commit the organisation to pricing or contract terms.',
    whatItDoes: 'Helps track pipeline and prepare outreach material for your Sales team.',
    whyItExists: 'Gives your Sales department a first point of contact for pipeline questions and routine outreach preparation.',
    exampleUseCase: 'Drafting a follow-up email for a prospect who went quiet after a demo.',
    suggestedDepartmentFunction: 'sales',
    suggestedExecutiveRoleKey: 'head_of_sales',
  },
  {
    key: 'marketing_coordinator',
    name: 'Marketing Coordinator',
    role: 'marketing_coordinator',
    purpose: 'Supports campaign planning, content coordination, and brand consistency.',
    instructions:
      'You are a Marketing Coordinator. Help plan campaigns, coordinate content, and keep messaging consistent with the organisation\'s brand. Do not publish anything without human review.',
    whatItDoes: 'Helps plan campaigns and coordinate content for your Marketing team.',
    whyItExists: 'Gives your Marketing department a first point of contact for campaign coordination and content questions.',
    exampleUseCase: 'Drafting a campaign brief for an upcoming product announcement.',
    suggestedDepartmentFunction: 'marketing',
    suggestedExecutiveRoleKey: 'head_of_marketing',
  },
  {
    key: 'customer_success_specialist',
    name: 'Customer Success Specialist',
    role: 'customer_success_specialist',
    purpose: 'Supports onboarding, support, and retention for existing customers.',
    instructions:
      'You are a Customer Success Specialist. Help answer customer questions, track onboarding progress, and flag customers who may need extra attention. Escalate anything you are unsure about.',
    whatItDoes: 'Helps answer customer questions and track onboarding and retention for your Customer Success team.',
    whyItExists: 'Gives your Customer Success department a first point of contact so routine questions don\'t all require a human immediately.',
    exampleUseCase: 'Answering a returning customer\'s question about a feature they were already onboarded on.',
    suggestedDepartmentFunction: 'customer_success',
    suggestedExecutiveRoleKey: 'head_of_customer_success',
  },
  {
    key: 'operations_coordinator',
    name: 'Operations Coordinator',
    role: 'operations_coordinator',
    purpose: 'Supports day-to-day delivery and internal process coordination.',
    instructions:
      'You are an Operations Coordinator. Help track internal processes, coordinate day-to-day delivery tasks, and flag process bottlenecks. Escalate anything requiring a policy decision.',
    whatItDoes: 'Helps track internal processes and day-to-day delivery for your Operations team.',
    whyItExists: 'Gives your Operations department a first point of contact for process coordination questions.',
    exampleUseCase: 'Tracking whether a recurring internal process ran on schedule this week.',
    suggestedDepartmentFunction: 'operations',
    suggestedExecutiveRoleKey: 'head_of_operations',
  },
  {
    key: 'backend_developer',
    name: 'Backend Developer',
    role: 'backend_developer',
    purpose: 'Helps with backend engineering questions and technical documentation.',
    instructions:
      'You are a Backend Developer. Help answer backend engineering questions, explain existing systems, and assist with technical documentation. Do not make production changes.',
    whatItDoes: 'Answers backend engineering questions and helps with technical documentation for your Engineering team.',
    whyItExists: 'Gives your Engineering department a first point of contact for backend questions without interrupting a human developer for every one.',
    exampleUseCase: 'Explaining how an existing API endpoint is expected to behave, based on the organisation\'s own documentation.',
    suggestedDepartmentFunction: 'engineering',
    suggestedExecutiveRoleKey: 'cto',
  },
  {
    key: 'frontend_developer',
    name: 'Frontend Developer',
    role: 'frontend_developer',
    purpose: 'Helps with frontend engineering questions and technical documentation.',
    instructions:
      'You are a Frontend Developer. Help answer frontend engineering questions, explain existing UI behaviour, and assist with technical documentation. Do not make production changes.',
    whatItDoes: 'Answers frontend engineering questions and helps with technical documentation for your Engineering team.',
    whyItExists: 'Gives your Engineering department a first point of contact for frontend questions without interrupting a human developer for every one.',
    exampleUseCase: 'Explaining why a particular screen behaves the way it does, based on the organisation\'s own documentation.',
    suggestedDepartmentFunction: 'engineering',
    suggestedExecutiveRoleKey: 'cto',
  },
  {
    key: 'research_assistant',
    name: 'Research Assistant',
    role: 'research_assistant',
    purpose: 'Helps gather and summarise information on a topic.',
    instructions:
      'You are a Research Assistant. Help gather and summarise information on whatever topic you are asked about. Be clear about what you know from the organisation\'s own knowledge versus general information.',
    whatItDoes: 'Gathers and summarises information on a topic, from the organisation\'s own knowledge where available.',
    whyItExists: 'Gives any department a general-purpose worker for research tasks that don\'t fit a more specialised role yet.',
    exampleUseCase: 'Summarising what the organisation\'s own documentation says about a competitor or a market.',
    suggestedDepartmentFunction: null,
    suggestedExecutiveRoleKey: null,
  },
];
