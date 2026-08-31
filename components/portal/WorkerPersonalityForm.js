'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';
import AvatarPanel from '@/components/portal/AvatarPanel';

// TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- personality/avatar/voice
// configuration for one worker, mirroring AddVendorSourceForm.js's own
// established field/submit/error conventions. Every closed set below is
// the real, backend-validated set (services/worker_personality_service.py)
// -- not a guess -- and voiceOptions is genuinely just one real entry
// today (Kokoro's own real, currently-cached voice set), shown honestly
// rather than padded out with options that don't work.
const COMMUNICATION_STYLES = ['direct', 'consultative', 'supportive', 'analytical'];
const FORMALITY_LEVELS = ['casual', 'professional', 'formal'];
const TECHNICAL_DEPTHS = ['basic', 'intermediate', 'expert'];
const CONCISENESS_LEVELS = ['brief', 'balanced', 'detailed'];

export default function WorkerPersonalityForm({ worker, personality, voiceOptions }) {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    communication_style: personality?.communication_style ?? '',
    formality: personality?.formality ?? '',
    technical_depth: personality?.technical_depth ?? '',
    conciseness: personality?.conciseness ?? '',
    initiative_escalation_style: personality?.initiative_escalation_style ?? '',
    voice_id: personality?.voice_id ?? '',
  });
  const [avatarType, setAvatarType] = useState(personality?.avatar_type ?? 'placeholder');
  const [hasAvatarImage, setHasAvatarImage] = useState(personality?.has_avatar_image ?? false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  const canEdit = isAtLeastRole(user?.role, 'admin');
  const avatarImageUrl = hasAvatarImage
    ? `/api/portal/workers/${worker.id}/personality/avatar-image?v=${savedAt ?? 0}`
    : null;

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Only fields that differ from the loaded profile are sent --
      // mirrors updateVendorSource()'s own real partial-update contract,
      // matching the backend's "only update what's explicitly passed"
      // guarantee (services/worker_personality_service.py#set_
      // personality_profile()) rather than always sending every field.
      const payload = {};
      for (const [key, value] of Object.entries(formData)) {
        const original = personality?.[key] ?? '';
        if (value !== original) {
          payload[key] = value === '' ? null : value;
        }
      }

      if (Object.keys(payload).length > 0) {
        const response = await fetch(`/api/portal/workers/${worker.id}/personality`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to save this personality profile.');
      }

      if (avatarFile) {
        const fd = new FormData();
        // Real backend field name -- api/workers.py's own
        // upload_worker_avatar_image_route() takes `image: UploadFile`,
        // not `file` (the executive-roles avatar upload's own field
        // name, a different real endpoint this one doesn't share a
        // contract with despite the similar shape).
        fd.append('image', avatarFile);
        const uploadResponse = await fetch(`/api/portal/workers/${worker.id}/personality/avatar-image`, {
          method: 'POST',
          body: fd,
        });
        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) throw new Error(uploadData.error || 'Unable to upload this avatar image.');
        setHasAvatarImage(true);
        setAvatarType('static');
        setAvatarFile(null);
      }

      setSavedAt(Date.now());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this configuration.');
    } finally {
      setSaving(false);
    }
  }

  async function handleClearAvatarImage() {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/portal/workers/${worker.id}/personality/avatar-image`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to remove this avatar image.');
      setHasAvatarImage(false);
      setAvatarType('placeholder');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove this avatar image.');
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return (
      <p className="form-note">
        Only an organisation admin can configure a worker&apos;s voice, avatar, and personality.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <AvatarPanel voiceState="idle" providerType={avatarType} avatarImageUrl={avatarImageUrl} />

      <form className="contact-form" onSubmit={handleSave} noValidate style={{ flex: '1 1 320px' }}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <label className="form-note" htmlFor="communication_style">
          Communication style
        </label>
        <select
          id="communication_style"
          value={formData.communication_style}
          onChange={(event) => updateField('communication_style', event.target.value)}
          disabled={saving}
        >
          <option value="">Unset (default)</option>
          {COMMUNICATION_STYLES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <label className="form-note" htmlFor="formality">
          Formality
        </label>
        <select
          id="formality"
          value={formData.formality}
          onChange={(event) => updateField('formality', event.target.value)}
          disabled={saving}
        >
          <option value="">Unset (default)</option>
          {FORMALITY_LEVELS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <label className="form-note" htmlFor="technical_depth">
          Technical depth
        </label>
        <select
          id="technical_depth"
          value={formData.technical_depth}
          onChange={(event) => updateField('technical_depth', event.target.value)}
          disabled={saving}
        >
          <option value="">Unset (default)</option>
          {TECHNICAL_DEPTHS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <label className="form-note" htmlFor="conciseness">
          Conciseness
        </label>
        <select
          id="conciseness"
          value={formData.conciseness}
          onChange={(event) => updateField('conciseness', event.target.value)}
          disabled={saving}
        >
          <option value="">Unset (default)</option>
          {CONCISENESS_LEVELS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <label className="form-note" htmlFor="initiative_escalation_style">
          Initiative &amp; escalation style
        </label>
        <textarea
          id="initiative_escalation_style"
          placeholder="e.g. Always flag anything security-related immediately"
          value={formData.initiative_escalation_style}
          onChange={(event) => updateField('initiative_escalation_style', event.target.value)}
          disabled={saving}
          rows={2}
        />
        <p className="form-note">
          Phrasing guidance only — this never creates or changes a real escalation rule, approval
          threshold, or permission.
        </p>

        <label className="form-note" htmlFor="voice_id">
          Voice
        </label>
        <select
          id="voice_id"
          value={formData.voice_id}
          onChange={(event) => updateField('voice_id', event.target.value)}
          disabled={saving}
        >
          <option value="">Unset (default)</option>
          {voiceOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        {voiceOptions.length === 1 && (
          <p className="form-note">
            Only one real voice is currently available on this deployment — shown honestly rather
            than a fabricated choice.
          </p>
        )}

        <label className="form-note" htmlFor="avatar_file">
          Avatar image (optional — PNG or JPG, up to 2MB)
        </label>
        <input
          id="avatar_file"
          type="file"
          accept="image/png,image/jpeg"
          onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
          disabled={saving}
        />
        {hasAvatarImage && (
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleClearAvatarImage}
            disabled={saving}
          >
            Remove uploaded image (revert to placeholder)
          </button>
        )}
        <p className="form-note">
          No animated, 2D, or video avatar rendering exists yet — an uploaded image is shown as a
          real static avatar; without one, the honest placeholder is used.
        </p>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
