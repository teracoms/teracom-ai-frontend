'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// A short, safe fallback if the browser doesn't support
// Intl.supportedValuesOf('timeZone') (Safari < 15, some older browsers)
// -- the picker still works, just with a shorter list, rather than
// breaking entirely.
const FALLBACK_TIMEZONES = [
  'UTC',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Pacific/Auckland',
];

function listTimezones() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return FALLBACK_TIMEZONES;
  }
}

/**
 * Settings & Security V1 -- the User Settings page's one form, covering
 * Profile, Theme, Notifications, Timezone, Accessibility, and Dashboard
 * Preferences in a single PATCH /users/me/settings submit
 * (SETTINGS_SECURITY_V1_ARCHITECTURE.md §5). One combined form, not six
 * separate ones -- this product's existing pages (e.g. the Governance
 * page) already favour stacked sections on one page over a client-side
 * tab switcher, so this follows that same established convention rather
 * than inventing a new one.
 *
 * Theme only ever offers "Dark" as a real, selectable option -- Light
 * and System are shown, disabled, honestly labelled "Coming soon."
 * This product has exactly one working theme today
 * (FRONTEND_IMAGE_IMPLEMENTATION_V1.md §5's own same finding).
 */
export default function UserSettingsForm({ initialSettings }) {
  const [firstName, setFirstName] = useState(initialSettings.first_name);
  const [lastName, setLastName] = useState(initialSettings.last_name);
  const [timezone, setTimezone] = useState(initialSettings.timezone ?? '');
  const [reduceMotion, setReduceMotion] = useState(initialSettings.preferences.accessibility.reduce_motion);
  const [largerText, setLargerText] = useState(initialSettings.preferences.accessibility.larger_text);
  const [compactDensity, setCompactDensity] = useState(initialSettings.preferences.dashboard.compact_density);
  const [emailSecurityAlerts, setEmailSecurityAlerts] = useState(
    initialSettings.preferences.notifications.email_security_alerts
  );
  const [emailProductUpdates, setEmailProductUpdates] = useState(
    initialSettings.preferences.notifications.email_product_updates
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const timezones = listTimezones();

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const response = await fetch('/api/portal/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          timezone,
          preferences: {
            theme: 'dark',
            accessibility: { reduce_motion: reduceMotion, larger_text: largerText },
            dashboard: { compact_density: compactDensity },
            notifications: {
              email_security_alerts: emailSecurityAlerts,
              email_product_updates: emailProductUpdates,
            },
          },
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save your settings.');
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {saved && !error && <p className="activity-meta">Saved.</p>}

      <div className="section-heading left" style={{ marginTop: 0 }}>
        <h3>Profile</h3>
      </div>
      <input
        type="text"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        placeholder="First name"
        aria-label="First name"
        disabled={saving}
      />
      <input
        type="text"
        value={lastName}
        onChange={(event) => setLastName(event.target.value)}
        placeholder="Last name"
        aria-label="Last name"
        disabled={saving}
      />
      <input type="email" value={initialSettings.email} disabled aria-label="Email (read-only)" />
      <p className="form-note">
        Your email is your sign-in identifier and can&apos;t be changed here yet — that needs its own
        verification step to change safely, which doesn&apos;t exist in this product yet.
      </p>

      <div className="section-heading left">
        <h3>Theme</h3>
      </div>
      <div>
        <label>
          <input type="radio" name="theme" checked readOnly /> Dark
        </label>
        <br />
        <label>
          <input type="radio" name="theme" disabled /> Light <span className="badge">Coming soon</span>
        </label>
        <br />
        <label>
          <input type="radio" name="theme" disabled /> System <span className="badge">Coming soon</span>
        </label>
      </div>

      <div className="section-heading left">
        <h3>Timezone</h3>
      </div>
      <select value={timezone} onChange={(event) => setTimezone(event.target.value)} disabled={saving} aria-label="Timezone">
        <option value="">Use organisation default</option>
        {timezones.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </select>
      <p className="form-note">
        Times store as UTC everywhere in this product and convert automatically for daylight saving —
        no separate setting is needed for that.
      </p>

      <div className="section-heading left">
        <h3>Accessibility</h3>
      </div>
      <label>
        <input
          type="checkbox"
          checked={reduceMotion}
          onChange={(event) => setReduceMotion(event.target.checked)}
          disabled={saving}
        />{' '}
        Reduce motion
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          checked={largerText}
          onChange={(event) => setLargerText(event.target.checked)}
          disabled={saving}
        />{' '}
        Larger text
      </label>

      <div className="section-heading left">
        <h3>Dashboard Preferences</h3>
      </div>
      <label>
        <input
          type="checkbox"
          checked={compactDensity}
          onChange={(event) => setCompactDensity(event.target.checked)}
          disabled={saving}
        />{' '}
        Compact density
      </label>

      <div className="section-heading left">
        <h3>Notifications</h3>
      </div>
      <label>
        <input
          type="checkbox"
          checked={emailSecurityAlerts}
          onChange={(event) => setEmailSecurityAlerts(event.target.checked)}
          disabled={saving}
        />{' '}
        Email me about security alerts
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          checked={emailProductUpdates}
          onChange={(event) => setEmailProductUpdates(event.target.checked)}
          disabled={saving}
        />{' '}
        Email me about product updates
      </label>
      <p className="form-note">
        These preferences are saved to your account. Email delivery for these categories is being
        connected — you may not receive email for every category yet.
      </p>

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  );
}
