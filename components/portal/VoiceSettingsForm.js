'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 1 -- a curated, real subset
// of Kokoro's own actual voice set (voice_services/tts_service.py),
// not an invented list -- every value here is a real, selectable
// Kokoro voice name. Shown regardless of whether this organisation
// has self-hosted voice enabled yet, so an admin turning it on later
// finds a real preference already waiting, not a default nobody chose.
const KOKORO_VOICES = [
  { value: 'af_heart', label: 'Heart (American, warm)' },
  { value: 'af_bella', label: 'Bella (American)' },
  { value: 'bf_emma', label: 'Emma (British)' },
];

const PROVIDER_LABELS = {
  browser_native: 'Browser Native',
  self_hosted: 'Self-Hosted (Kokoro + faster-whisper)',
};

/**
 * TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 1 -- Voice Settings.
 * Two independent sections, two independent save actions, because
 * they hit two different real backend resources with two different
 * trust boundaries: the organisation's own VoiceProviderConfiguration
 * (VOICE_MIGRATION_V1, admin-only write, GET is read-open) and this
 * user's own personal preferences.voice (Settings & Security V1's own
 * PATCH /users/me/settings, any signed-in user). A non-admin sees the
 * organisation's real configured provider but cannot change it, the
 * same read-open-write-gated posture AIProviderConfigCard.js already
 * establishes for the AI Provider Configuration page.
 */
export default function VoiceSettingsForm({ initialSettings, orgVoiceProviderConfig, isAdmin }) {
  const router = useRouter();
  const voice = initialSettings.preferences.voice;

  const [provider, setProvider] = useState(voice.provider);
  const [voiceSelection, setVoiceSelection] = useState(voice.voice_selection);
  const [speechSpeed, setSpeechSpeed] = useState(voice.speech_speed);
  const [continuousMode, setContinuousMode] = useState(voice.continuous_mode);
  const [pushToTalk, setPushToTalk] = useState(voice.push_to_talk);
  const [autoSend, setAutoSend] = useState(voice.auto_send);
  const [voiceEnabled, setVoiceEnabled] = useState(voice.voice_enabled);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [orgProvider, setOrgProvider] = useState(
    orgVoiceProviderConfig?.stt_provider === 'faster_whisper_self_hosted' ? 'self_hosted' : 'browser_native'
  );
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);
  const [orgError, setOrgError] = useState(null);

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
          preferences: {
            voice: {
              provider,
              voice_selection: voiceSelection,
              speech_speed: Number(speechSpeed),
              continuous_mode: continuousMode,
              push_to_talk: pushToTalk,
              auto_send: autoSend,
              voice_enabled: voiceEnabled,
            },
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to save your voice settings.');

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your voice settings.');
    } finally {
      setSaving(false);
    }
  }

  async function handleOrgSubmit(event) {
    event.preventDefault();
    setOrgError(null);
    setOrgSaved(false);
    setSavingOrg(true);

    try {
      const response = await fetch('/api/portal/voice-provider-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          orgProvider === 'self_hosted'
            ? { stt_provider: 'faster_whisper_self_hosted', tts_provider: 'kokoro_self_hosted' }
            : { stt_provider: 'browser_native', tts_provider: 'browser_native' }
        ),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to update the organisation voice provider.');

      setOrgSaved(true);
      router.refresh();
    } catch (err) {
      setOrgError(err instanceof Error ? err.message : 'Unable to update the organisation voice provider.');
    } finally {
      setSavingOrg(false);
    }
  }

  return (
    <>
      <div className="section-heading left" style={{ marginTop: 0 }}>
        <h3>Organisation Voice Provider</h3>
      </div>
      <p className="form-note">
        Which real engine transcribes and speaks for everyone in this organisation. Self-hosted requires
        Teracom&apos;s own faster-whisper/Kokoro services to be running for this deployment — if they
        aren&apos;t reachable, conversations fall back to Browser Native automatically.
      </p>

      {isAdmin ? (
        <form className="contact-form" onSubmit={handleOrgSubmit} noValidate>
          {orgError && (
            <p className="form-error" role="alert">
              {orgError}
            </p>
          )}
          {orgSaved && !orgError && <p className="activity-meta">Saved.</p>}

          <select value={orgProvider} onChange={(event) => setOrgProvider(event.target.value)} disabled={savingOrg} aria-label="Organisation voice provider">
            {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" type="submit" disabled={savingOrg}>
            {savingOrg ? 'Saving...' : 'Save organisation provider'}
          </button>
        </form>
      ) : (
        <p className="activity-meta">
          Currently: <strong>{PROVIDER_LABELS[orgProvider]}</strong>. Only an organisation admin can change this.
        </p>
      )}

      <div className="section-heading left">
        <h3>Your Voice Preferences</h3>
      </div>

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {saved && !error && <p className="activity-meta">Saved.</p>}

        <label>
          <input type="checkbox" checked={voiceEnabled} onChange={(event) => setVoiceEnabled(event.target.checked)} disabled={saving} />{' '}
          Voice enabled
        </label>
        <p className="form-note">Turns off microphone/speaker controls in conversations entirely when unchecked.</p>

        <div className="section-heading left">
          <h4 style={{ margin: 0 }}>Voice Provider (your preference)</h4>
        </div>
        <select value={provider} onChange={(event) => setProvider(event.target.value)} disabled={saving} aria-label="Your preferred voice provider">
          {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="form-note">
          Only takes effect if this organisation has that provider enabled above — otherwise conversations
          use Browser Native and say so.
        </p>

        <div className="section-heading left">
          <h4 style={{ margin: 0 }}>Voice Selection</h4>
        </div>
        <select value={voiceSelection} onChange={(event) => setVoiceSelection(event.target.value)} disabled={saving} aria-label="Voice selection">
          {KOKORO_VOICES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="form-note">Only used when the self-hosted (Kokoro) provider is actually active.</p>

        <div className="section-heading left">
          <h4 style={{ margin: 0 }}>Speech Speed</h4>
        </div>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={speechSpeed}
          onChange={(event) => setSpeechSpeed(event.target.value)}
          disabled={saving}
          aria-label="Speech speed"
        />
        <span className="activity-meta">{Number(speechSpeed).toFixed(2)}x</span>

        <div className="section-heading left">
          <h4 style={{ margin: 0 }}>Conversation Style</h4>
        </div>
        <label>
          <input
            type="checkbox"
            checked={continuousMode}
            onChange={(event) => setContinuousMode(event.target.checked)}
            disabled={saving || pushToTalk}
          />{' '}
          Continuous mode (keep listening across pauses)
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={pushToTalk}
            onChange={(event) => setPushToTalk(event.target.checked)}
            disabled={saving}
          />{' '}
          Push-to-talk (hold a button to speak, instead of toggling)
        </label>
        <br />
        <label>
          <input type="checkbox" checked={autoSend} onChange={(event) => setAutoSend(event.target.checked)} disabled={saving} />{' '}
          Auto-send what I say (unchecking lets you review/edit the transcript before sending)
        </label>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save voice preferences'}
        </button>
      </form>
    </>
  );
}
