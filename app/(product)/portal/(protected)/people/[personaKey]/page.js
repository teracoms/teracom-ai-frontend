import { redirect } from 'next/navigation';

// CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec3 -- see /portal/people/page.js's
// own redirect for the full rationale; this is the per-persona
// equivalent, preserving any existing bookmark to a specific persona
// conversation.
export default function PersonaConversationRedirect({ params }) {
  redirect(`/portal/team/${params.personaKey}`);
}
