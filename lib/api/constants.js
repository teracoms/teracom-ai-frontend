// No Next.js/server imports here on purpose — this module is shared by both
// server-side code (Route Handlers, layouts) and the Edge middleware, which
// cannot load server-only modules.
export const SESSION_COOKIE_NAME = 'teracom_session';

// Phase 0 Package O — a distinct cookie for the Customer Portal's own
// session plane, never interchangeable with the staff/org-member
// session above. See lib/api/portalContactAuth.js.
export const PORTAL_CONTACT_SESSION_COOKIE_NAME = 'teracom_portal_contact_session';

// "Package SEC1" — the long-lived, revocable refresh token, stored in
// its own httpOnly cookie rather than folded into the access-token
// cookie above, so each can carry its own lifetime/semantics
// independently. See middleware.js's silent-refresh logic and
// lib/api/auth.js/lib/api/portalContactAuth.js's login/logout flows.
export const REFRESH_COOKIE_NAME = 'teracom_refresh';
export const PORTAL_CONTACT_REFRESH_COOKIE_NAME = 'teracom_portal_contact_refresh';
