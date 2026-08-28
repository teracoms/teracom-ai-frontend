'use client';

// TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 1 -- "Frontend provider
// swap. Replace dependency on browser-native voice." This is the one
// real seam that replaces it: every caller (OrchestratorChat.js)
// imports from this file instead of lib/voice/speechProvider.js
// directly, and this file picks which real implementation actually
// runs based on the organisation/user's own resolved provider choice
// -- lib/voice/speechProvider.js (browser-native, unchanged, still
// the zero-infrastructure default) or
// lib/voice/selfHostedSpeechProvider.js (VOICE_MIGRATION_V1's own
// self-hosted Kokoro/faster-whisper engines). Neither underlying file
// was made to know about the other; this is the dispatch layer.
import * as browserNative from './speechProvider';
import * as selfHosted from './selfHostedSpeechProvider';

function engineFor(provider) {
  return provider === 'self_hosted' ? selfHosted : browserNative;
}

export function isSpeechToTextSupported(provider) {
  return engineFor(provider).isSpeechToTextSupported();
}

export function isTextToSpeechSupported(provider) {
  return engineFor(provider).isTextToSpeechSupported();
}

export function startListening(provider, options) {
  return engineFor(provider).startListening(options);
}

export function speak(provider, text, options) {
  return engineFor(provider).speak(text, options);
}

export function cancelSpeech(provider) {
  engineFor(provider).cancelSpeech();
}

/**
 * Only the self-hosted engine implements real interim interruption
 * detection today (lib/voice/selfHostedSpeechProvider.js's own
 * watchForInterruption -- see its docstring for why: it needs an
 * independent mic-volume watch, which the browser's own
 * SpeechRecognition/speechSynthesis pair has no equivalent hook for
 * without risking feedback between the two). Browser-native callers
 * get a real, honest no-op (a function that does nothing and returns
 * a no-op stop()), not a fabricated capability -- naming this
 * explicitly here rather than silently returning undefined.
 */
export function watchForInterruption(provider, options) {
  if (provider === 'self_hosted') return selfHosted.watchForInterruption(options);
  return () => {};
}

export function supportsInterruption(provider) {
  return provider === 'self_hosted';
}
