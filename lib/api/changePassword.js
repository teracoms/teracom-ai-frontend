// Server-only -- Settings & Security V1, POST /auth/change-password.
// Distinct from lib/api/auth.js's requestPasswordReset/confirmPasswordReset
// (the email-token forgot-password flow) -- this is "change my password
// while already signed in."
if (typeof window !== 'undefined') {
  throw new Error('lib/api/changePassword.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function changePassword(token, currentPassword, newPassword) {
  return backendFetch('/auth/change-password', {
    method: 'POST',
    token,
    body: { current_password: currentPassword, new_password: newPassword },
  });
}
