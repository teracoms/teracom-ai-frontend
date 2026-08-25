import PlatformSectionNav from '@/components/portal/PlatformSectionNav';

export const metadata = {
  title: 'Documentation | Teracom AI Portal',
};

/**
 * The previously-missing in-app Product Documentation surface. No backend
 * capability exists for user-facing help content (confirmed: no
 * "documentation" model/service/endpoint anywhere outside test fixtures),
 * so this is deliberately static, hand-written reference content — real,
 * specific, and grounded in this product's actual current behaviour, not
 * placeholder text. Distinct from Training (/portal/training): this page
 * answers "what is this and who can use it", Training answers "how do I do
 * a specific task, step by step".
 */
const SECTIONS = [
  {
    heading: 'Your digital workforce',
    items: [
      {
        title: 'Workers',
        body: 'Each Worker is a named AI role with its own purpose and instructions (e.g. "Backend Developer", "QA"). Active/inactive status controls whether it can be assigned or consulted. Creating a worker directly is admin and above; any member may instead propose one for review.',
      },
      {
        title: 'Departments',
        body: 'Groups workers under a head. A department can carry a function tag ("sales", "customer_success", "marketing", "finance", or "operations") that unlocks its own dashboard widgets and boosts CTO orchestration routing toward that department. Assigning a head and creating departments is admin and above.',
      },
      {
        title: 'Workforce Overview',
        body: 'A single-page overview of your whole workforce: headcount, active/inactive split, every department with its head and members, unassigned workers, and any worker proposal still waiting on a decision.',
      },
      {
        title: 'Orchestration (CTO)',
        body: 'Ask the CTO worker to turn a goal into a plan (available to everyone) or execute that plan end-to-end, delegating through Department Heads to the specialist that best matches each subtask (requires employee tier and above; full execution is licence-tier gated).',
      },
    ],
  },
  {
    heading: 'Doing the work',
    items: [
      {
        title: 'Projects',
        body: 'A container for related tasks, with a status (active / completed / blocked), optionally scoped to a department. Every project has its own page — open one directly, or ask a worker to plan one from a goal (requires a Platinum-tier licence).',
      },
      {
        title: 'Tasks',
        body: 'Real, trackable units of work with a status (pending / in progress / done), an assignee, a due date and a priority. The standalone Tasks page shows every task across every project in one place; a task can also be added from inside its own project.',
      },
      {
        title: 'Knowledge',
        body: "Upload documents for a worker, a department, or the whole organisation to draw on. A department's knowledge is automatically visible to every worker in it (knowledge inheritance). From a document's own page, an admin can also set its type, sensitivity, and tags — tags feed the Governance knowledge_assignment rule (see Governance) for automatic access grants when a worker joins a department.",
      },
      {
        title: 'Memory',
        body: 'What a worker (or a department, or the organisation as a whole) has learned or decided over time — separate from Knowledge, which is source material you upload rather than something a worker produces. An admin can archive an incorrect or stale memory so it stops appearing and stops being used in chat or orchestration — memory has no true edit, only create/read/archive.',
      },
      {
        title: 'Chat',
        body: 'Talk to a worker directly. Answers are grounded in that worker\'s own assigned knowledge and memory — a worker declines rather than fabricates an answer to something outside its scope.',
      },
    ],
  },
  {
    heading: 'Business surfaces',
    items: [
      {
        title: 'Sales & Customer Success',
        body: 'Tracks contacts through prospect → lead → customer, plus proposals, quotes and contracts. A contact\'s stage only ever moves forward. Customer health (healthy/at-risk/etc.) is tracked per contact.',
      },
      {
        title: 'Finance',
        body: 'Estimated organisation cost, department budget allocations and approvals, and your current licence tier and status.',
      },
      {
        title: 'Operations',
        body: 'Organisation-wide project and task delivery statistics — counts by status and an overdue count. To create or manage a project or task directly, see Projects.',
      },
      {
        title: 'Marketing & Media Centre',
        body: 'Campaigns by stage, plus content and video assets moving through draft → submitted → published.',
      },
    ],
  },
  {
    heading: 'Platform',
    items: [
      {
        title: 'Reporting',
        body: 'One page pulling together Operations, Finance, Marketing, Sales & Customer Success, Platform Health, Organisation Health, Executive Dashboard, Organisational Intelligence, and Executive Briefing — the executive-style overview that used to mean visiting many separate pages. A top-level nav item, not nested under anything.',
      },
      {
        title: 'Federation',
        body: 'Cross-organisation consultation for licence tiers that include it. An admin can turn it off entirely for their organisation regardless of tier.',
      },
      {
        title: 'Platform Health',
        body: 'Live system status, deployment records, and any open incidents.',
      },
      {
        title: 'Support',
        body: 'Raise and track support requests, with a message thread per request.',
      },
    ],
  },
  {
    heading: 'Administration (admin and above)',
    items: [
      {
        title: 'Users',
        body: 'Your organisation\'s people, each with a role: Owner, Admin, Manager, Employee, or Read Only, each tier automatically covering everything the tiers below it can do. You can only grant a role at or below your own, and you can\'t change your own role or deactivate your own account (this prevents an organisation ever being left with no active admin).',
      },
      {
        title: 'Governance',
        body: 'Organisation- and department-level rules that admins can set and override (admin and above), cascading down automatically — a department without its own override inherits the organisation default. Today only knowledge_assignment rules have a live effect (a worker joining a department automatically gets access to matching-tagged knowledge); other rule types are recorded and audited for future enforcement.',
      },
      {
        title: 'Billing & Licensing',
        body: 'Your real, current licence status once your organisation has one — tier, hosting model, status, expiry, and usage against your entitlements. Before then, this page shows a clearly-labelled illustrative example instead of pretending to have real data. Also covers worker-pack add-ons and (enterprise) ownership transfer.',
      },
      {
        title: 'Organisation Profile',
        body: 'The full detail behind the Dashboard\'s own Organisation summary card — name, industry, federation setting, AI provider configuration — and, for enterprise customers, any sub-organisation you\'ve created underneath it.',
      },
    ],
  },
];

export default function DocumentationPage() {
  return (
    <>
      <PlatformSectionNav />
      <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Documentation</span>
            <h1>What everything in the portal does.</h1>
            <p className="lead">
              A reference for every surface in Teracom AI — what it is, and who can use it. Looking
              for step-by-step instructions instead? See{' '}
              <a href="/portal/training">Training</a>.
            </p>
          </div>
        </div>
      </section>

      {SECTIONS.map((section, index) => (
        <section className={index % 2 === 0 ? 'section' : 'section alt'} key={section.heading}>
          <div className="container">
            <div className="section-heading left">
              <h2>{section.heading}</h2>
            </div>
            <div className="feature-grid">
              {section.items.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ))}
    </main>
    </>
  );
}
