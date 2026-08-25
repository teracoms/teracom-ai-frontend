import { redirect } from 'next/navigation';

// CUSTOMER_EXPERIENCE_REDESIGN_V1 -- the single-project view moved to
// /portal/workspace/[projectId] (Conversation/Files/Outputs/Activity).
// Every capability this page used to offer directly (TaskPanel,
// ProjectStatusControl) is preserved there in full, inside the Activity
// tab -- nothing removed, only relocated. Redirecting rather than deleting
// this route keeps any existing bookmark or deep link resolving.
export default function ProjectDetailRedirect({ params }) {
  redirect(`/portal/workspace/${params.projectId}`);
}
