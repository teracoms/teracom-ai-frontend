import { redirect } from 'next/navigation';

// CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec3 -- People merged into
// /portal/team (Executive Team), per CUSTOMER_EXPERIENCE_REDESIGN_V2
// Sec6/Sec12 item 5's own finding that People and Conversations
// reached substantially the same content two different ways. This
// route redirects rather than being deleted, per that review's own
// "nothing recommended for removal" finding -- any existing bookmark
// or external link still resolves.
export default function PeoplePageRedirect() {
  redirect('/portal/team');
}
