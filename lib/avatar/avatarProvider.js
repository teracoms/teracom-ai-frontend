// TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 3 -- Avatar Foundation.
// "Create foundation only. Do not build final avatar... Create
// framework only." Mirrors lib/voice/speechProvider.js's own
// established pattern for this codebase: name the real, closed set
// of states and provider types up front, implement exactly one real
// provider today, and leave the door open for a future one to plug
// into the same shape without any caller (AvatarPanel.js) needing to
// change.

// The four states this task named explicitly -- deliberately the same
// vocabulary components/portal/OrchestratorChat.js's own VOICE_STATE_*
// constants already use, so an avatar and the voice-state badge next
// to it are never able to say two different things about the same
// conversation turn.
export const AVATAR_STATES = ['idle', 'listening', 'processing', 'speaking'];

// Every future avatar rendering technology this task named explicitly,
// as a closed, versioned set -- not implied to already work. Only
// "placeholder" has a real, working component today
// (components/portal/AvatarPanel.js). Selecting any other value falls
// back to "placeholder" honestly rather than rendering nothing or
// pretending to be a technology that isn't built yet.
export const AVATAR_PROVIDER_TYPES = ['placeholder', 'static', 'animated', '2d', 'video'];

export const IMPLEMENTED_AVATAR_PROVIDER_TYPES = ['placeholder'];

export function resolveAvatarProviderType(requested) {
  return IMPLEMENTED_AVATAR_PROVIDER_TYPES.includes(requested) ? requested : 'placeholder';
}
