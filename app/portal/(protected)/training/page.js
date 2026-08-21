import Link from 'next/link';

export const metadata = {
  title: 'Training | Teracom AI Portal',
};

/**
 * The previously-missing in-app Product Training surface. No backend
 * capability exists for training content, and this is deliberately
 * distinct from Onboarding (/portal/onboarding, a one-time checklist
 * seeded only once an organisation's first licence request is
 * approved — never for a trial signup, see
 * services/organisation_onboarding_service.py#seed_welcome_checklist()'s
 * own docstring and TERACOM_CUSTOMER_READINESS_REVIEW_V1.md finding
 * #18): Training is task-oriented "how do I do X" reference, usable
 * any time by anyone, not a setup checklist. Also distinct from
 * Documentation (/portal/documentation), which answers "what is
 * this" rather than "how do I do it".
 */
const GUIDES = [
  {
    title: 'Get your organisation set up',
    steps: [
      'Sign up for a trial to start immediately, or have a licence request approved to activate a full organisation.',
      {
        text: "Once a licence request is approved, work through your Onboarding checklist — it's seeded automatically at that point, not during a trial. Trial organisations can use these guides in the meantime.",
        href: '/portal/onboarding',
      },
      { text: 'Invite your team from Users and assign each person a role.', href: '/portal/admin/users' },
    ],
  },
  {
    title: 'Build your digital workforce',
    steps: [
      { text: 'Create a department from Admin → Departments.', href: '/portal/admin/departments' },
      {
        text: 'Create a worker directly, or propose one for another admin to review.',
        href: '/portal/workers/new',
      },
      { text: 'Decide on any pending worker proposals from the requests queue.', href: '/portal/workers/requests' },
      'Assign a department head so the department has someone to route work through.',
      { text: 'Check the result any time from Digital Workforce.', href: '/portal/digital-workforce' },
    ],
  },
  {
    title: 'Assign and track work',
    steps: [
      { text: 'Create a project from Operations.', href: '/portal/operations' },
      'Add tasks to it with an assignee, a due date, and a priority.',
      { text: 'Watch every task across every project move from pending to done on the Tasks page.', href: '/portal/tasks' },
    ],
  },
  {
    title: 'Get a plan from the CTO',
    steps: [
      { text: 'Open Orchestration and describe what you want built or solved.', href: '/portal/cto' },
      'Review the generated plan — this step is available to everyone, at any licence tier.',
      'If your licence tier supports execution, run the plan; it delegates each subtask through your Department Heads to whichever specialist actually matches it.',
    ],
  },
  {
    title: 'Give a worker knowledge',
    steps: [
      { text: 'Upload a document from Knowledge.', href: '/portal/knowledge' },
      'Assign it to one worker, or to a whole department — every worker in that department can then use it automatically.',
      'Ask the worker a question in Chat to confirm it can find and use what you uploaded.',
    ],
  },
  {
    title: 'Manage who can do what',
    steps: [
      { text: 'Open Users.', href: '/portal/admin/users' },
      'Assign each person a role: Owner, Admin, Manager, Employee, or Read Only — each tier automatically covers everything below it.',
      'You can only grant a role at or below your own, and no one can change their own role or deactivate their own account.',
    ],
  },
  {
    title: 'Get an executive overview',
    steps: [
      {
        text: 'Open Reporting for one page covering Operations, Finance, Marketing, Sales & Customer Success, and platform health.',
        href: '/portal/reporting',
      },
    ],
  },
  {
    title: 'Ask for help',
    steps: [
      { text: 'Open Support and raise a request.', href: '/portal/support' },
      'Follow the conversation thread on that request until it\'s resolved.',
    ],
  },
];

function Step({ step }) {
  if (typeof step === 'string') return <li>{step}</li>;
  return (
    <li>
      {step.text} <Link href={step.href}>Open →</Link>
    </li>
  );
}

export default function TrainingPage() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Training</span>
            <h1>How to do the things you&apos;ll actually want to do.</h1>
            <p className="lead">
              Step-by-step guides for the most common tasks in Teracom AI. Looking for what a
              surface is rather than how to use it? See{' '}
              <a href="/portal/documentation">Documentation</a>.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ul className="activity-list">
            {GUIDES.map((guide) => (
              <li key={guide.title}>
                <p className="activity-title">{guide.title}</p>
                <ol style={{ color: 'var(--muted)', marginTop: '10px', display: 'grid', gap: '6px' }}>
                  {guide.steps.map((step) => (
                    <Step step={step} key={typeof step === 'string' ? step : step.text} />
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
