import Link from 'next/link';

import { getSessionToken, getSessionUser } from '@/lib/api/auth';
import { fetchUserSettings } from '@/lib/api/userSettings';
import { fetchVoiceProviderConfig } from '@/lib/api/voice';
import { errorMessage } from '@/lib/api/results';
import { isAtLeastRole } from '@/lib/roles';
import VoiceSettingsForm from '@/components/portal/VoiceSettingsForm';

export const metadata = {
  title: 'Voice Settings | Teracom AI Portal',
};

/**
 * TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 1 -- "Add voice settings
 * page." Mirrors app/(product)/portal/(protected)/settings/page.js's
 * own structure (real settings fetched server-side, a client form
 * does the actual PATCH), extended with the organisation's own
 * VoiceProviderConfiguration (VOICE_MIGRATION_V1) alongside the
 * per-user preferences this workstream adds.
 */
export default async function VoiceSettingsPage() {
  const token = getSessionToken();
  const user = getSessionUser();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Voice Settings</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view your voice settings.</p>
          </div>
        </section>
      </main>
    );
  }

  let settings;
  let loadError = null;
  try {
    settings = await fetchUserSettings(token);
  } catch (error) {
    loadError = error;
  }

  let orgVoiceProviderConfig = null;
  try {
    orgVoiceProviderConfig = await fetchVoiceProviderConfig(token);
  } catch {
    orgVoiceProviderConfig = null;
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">
              <Link href="/portal/settings">&larr; Settings</Link>
            </span>
            <h1>Voice settings.</h1>
            <p className="lead">Provider, voice, speed, and how listening works in your conversations.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loadError ? (
            <p className="form-error" role="alert">
              {errorMessage(loadError)}
            </p>
          ) : (
            <VoiceSettingsForm
              initialSettings={settings}
              orgVoiceProviderConfig={orgVoiceProviderConfig}
              isAdmin={isAtLeastRole(user?.role, 'admin')}
            />
          )}
        </div>
      </section>
    </main>
  );
}
