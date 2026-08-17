// No Next.js/server imports here on purpose — this module is shared by both
// server-side code (Route Handlers, layouts) and the Edge middleware, which
// cannot load server-only modules.
export const SESSION_COOKIE_NAME = 'teracom_session';

// Phase 0 Package O — a distinct cookie for the Customer Portal's own
// session plane, never interchangeable with the staff/org-member
// session above. See lib/api/portalContactAuth.js.
export const PORTAL_CONTACT_SESSION_COOKIE_NAME = 'teracom_portal_contact_session';
