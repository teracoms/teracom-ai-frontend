'use client';

import { resolveAvatarProviderType } from '@/lib/avatar/avatarProvider';

// TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 3 -- Avatar Foundation.
// "Avatar panel in conversation view... Placeholder avatar component."
// TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION extends this with the one
// other real provider type that now exists, "static" (a worker's own
// uploaded image, teracom-ai-backend 428b3b2) -- "animated"/"2d"/
// "video" and real lip-sync remain unbuilt anywhere in this platform,
// still real future work this component's own provider abstraction
// (lib/avatar/avatarProvider.js) leaves room for. The one thing this
// component commits to for real, for every provider type: the same
// four states OrchestratorChat.js's own VOICE_STATE_LABEL already
// uses, rendered as a single, always-current visual, so an avatar and
// the voice-state badge next to it can never say two different
// things. There is no real lip-sync or phoneme-level animation here --
// the state-driven pulse ring is this platform's own honest "best
// supported synchronised animation" given that real constraint.
const STATE_COPY = {
  idle: { label: 'Idle', symbol: '○', className: 'badge-muted' },
  listening: { label: 'Listening', symbol: '🎤', className: 'badge-warn' },
  processing: { label: 'Processing', symbol: '⋯', className: 'badge-warn' },
  speaking: { label: 'Speaking', symbol: '🔊', className: 'badge-ok' },
};

// `avatarImageUrl` is only ever rendered when resolvedType === 'static'
// AND a URL was actually supplied -- a 'static' worker whose image
// hasn't loaded yet (or was cleared) falls back to the same honest
// placeholder circle everyone else gets, never a broken image icon.
export default function AvatarPanel({ voiceState = 'idle', providerType = 'placeholder', avatarImageUrl = null }) {
  const resolvedType = resolveAvatarProviderType(providerType);
  const { label, symbol, className } = STATE_COPY[voiceState] ?? STATE_COPY.idle;
  const showImage = resolvedType === 'static' && Boolean(avatarImageUrl);

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
          overflow: 'hidden',
        }}
        role="img"
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- same-origin
          // proxied binary (avatar-image route), matching AvatarImage.js's
          // own established <img> usage for this exact same real reason.
          <img
            src={avatarImageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span aria-hidden="true">{symbol}</span>
        )}
      </div>
      <span className={`badge ${className}`} style={{ marginBottom: 0 }}>
        {label}
      </span>
    </div>
  );
}
