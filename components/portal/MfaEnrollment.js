'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Settings & Security V1 -- MFA enrolment/disable
 * (SETTINGS_SECURITY_V1_ARCHITECTURE.md §2). Three states:
 *  - not enrolled: a "Set up MFA" button starts enrolment.
 *  - mid-enrolment: shows the secret (manual entry -- no QR code image
 *    is generated, §2's own deliberate scope cut) and a code field to
 *    confirm.
 *  - enrolled: shows backup codes exactly once right after confirming,
 *    then a "Disable MFA" form (password + code) once that banner is
 *    dismissed.
 */
export default function MfaEnrollment({ initiallyEnabled }) {
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [setup, setSetup] = useState(null); // { secret, secret_display, otpauth_uri }
  const [confirmCode, setConfirmCode] = useState('');
  const [backupCodes, setBackupCodes] = useState(null);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function startSetup() {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/portal/mfa/setup', { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to start MFA setup.');
      setSetup(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start MFA setup.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmSetup(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/portal/mfa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: confirmCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'That code is incorrect or has expired.');
      setBackupCodes(data.backup_codes);
      setEnabled(true);
      setSetup(null);
      setConfirmCode('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code is incorrect or has expired.');
    } finally {
      setSubmitting(false);
    }
  }

  async function disable(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/portal/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword, code: disableCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to disable MFA.');
      setEnabled(false);
      setDisablePassword('');
      setDisableCode('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to disable MFA.');
    } finally {
      setSubmitting(false);
    }
  }

  if (backupCodes) {
    return (
      <div>
        <p className="activity-meta">
          <strong>MFA is now enabled.</strong> Save these backup codes somewhere safe — each one works
          exactly once, and this is the only time they&apos;ll be shown.
        </p>
        <ul className="activity-list">
          {backupCodes.map((code) => (
            <li key={code}>
              <code>{code}</code>
            </li>
          ))}
        </ul>
        <button className="btn btn-secondary btn-small" type="button" onClick={() => setBackupCodes(null)}>
          I&apos;ve saved these codes
        </button>
      </div>
    );
  }

  const errorNode = error ? (
    <p className="form-error" role="alert">
      {error}
    </p>
  ) : null;

  if (!enabled && !setup) {
    return (
      <div>
        {errorNode}
        <p className="activity-meta">MFA is not enabled on your account.</p>
        <button className="btn btn-primary btn-small" type="button" onClick={startSetup} disabled={submitting}>
          {submitting ? 'Starting...' : 'Set up MFA'}
        </button>
      </div>
    );
  }

  if (setup) {
    return (
      <form className="contact-form" onSubmit={confirmSetup} noValidate>
        {errorNode}
        <p className="activity-meta">
          Enter this key into your authenticator app (Google Authenticator, Authy, 1Password, etc.):
        </p>
        <p>
          <code>{setup.secret_display}</code>
        </p>
        <input
          type="text"
          value={confirmCode}
          onChange={(event) => setConfirmCode(event.target.value)}
          placeholder="6-digit code"
          disabled={submitting}
          aria-label="Confirmation code"
        />
        <button className="btn btn-primary btn-small" type="submit" disabled={submitting || !confirmCode.trim()}>
          {submitting ? 'Confirming...' : 'Confirm and enable'}
        </button>
      </form>
    );
  }

  return (
    <form className="contact-form" onSubmit={disable} noValidate>
      {errorNode}
      <p className="activity-meta">MFA is enabled on your account.</p>
      <input
        type="password"
        value={disablePassword}
        onChange={(event) => setDisablePassword(event.target.value)}
        placeholder="Current password"
        autoComplete="current-password"
        disabled={submitting}
        aria-label="Current password"
      />
      <input
        type="text"
        value={disableCode}
        onChange={(event) => setDisableCode(event.target.value)}
        placeholder="Current code or a backup code"
        disabled={submitting}
        aria-label="Current MFA code or backup code"
      />
      <button
        className="btn btn-secondary btn-small"
        type="submit"
        disabled={submitting || !disablePassword || !disableCode.trim()}
      >
        {submitting ? 'Disabling...' : 'Disable MFA'}
      </button>
    </form>
  );
}
