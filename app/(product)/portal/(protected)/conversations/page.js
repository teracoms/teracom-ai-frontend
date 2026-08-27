import { redirect } from 'next/navigation';

// CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec3 -- Conversations merged into
// /portal/team (Executive Team), the same real merge
// /portal/people/page.js redirects from -- see that file's own
// docstring for the full rationale.
export default function ConversationsPageRedirect() {
  redirect('/portal/team');
}
