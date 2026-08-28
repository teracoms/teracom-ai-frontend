'use client';

import { resolveAvatarProviderType } from '@/lib/avatar/avatarProvider';

// TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 3 -- Avatar Foundation.
// "Avatar panel in conversation view... Placeholder avatar component."
// This is deliberately a simple, honest placeholder -- a real avatar
// (static image, animated character, 2D rig, or video) is real future
// work this component's own provider abstraction
// (lib/avatar/avatarProvider.js) leaves room for, not attempted here.
// The one thing this component commits to for real: the same four
// states OrchestratorChat.js's own VOICE_STATE_LABEL already uses,
// rendered as a single, always-current visual, so an avatar and the
// voice-state badge next to it can never say two different things.
const STATE_COPY = {
  idle: { label: 'Idle', symbol: '○', className: 'badge-muted' },
  listening: { label: 'Listening', symbol: '🎤', className: 'badge-warn' },
  processing: { label: 'Processing', symbol: '⋯', className: 'badge-warn' },
  speaking: { label: 'Speaking', symbol: '🔊', className: 'badge-ok' },
};

export default function AvatarPanel({ voiceState = 'idle', providerType = 'placeholder' }) {
  const resolvedType = resolveAvatarProviderType(providerType);
  const { label, symbol, className } = STATE_COPY[voiceState] ?? STATE_COPY.idle;

  // Only "placeholder" is real today -- resolveAvatarProviderType()
  // already falls back to it for anything else, so this branch never
  // actually renders "nothing" for a future provider type that isn't
  // built yet.
  if (resolvedType !== 'placeholder') {
    return null;
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '96px' }}
      aria-label={`Assistant avatar, currently ${label.toLowerCase()}`}
    >
      <div
        className={voiceState === 'listening' || voiceState === 'speaking' ? 'avatar-panel-pulse' : ''}
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          background: 'rgba(255,255,255,.06)',
          border: '2px solid var(--line)',
        }}
        role="img"
      >
        <span aria-hidden="true">{symbol}</span>
      </div>
      <span className={`badge ${className}`} style={{ marginBottom: 0 }}>
        {label}
      </span>
    </div>
  );
}
