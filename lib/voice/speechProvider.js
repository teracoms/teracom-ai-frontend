'use client';

// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- Voice Experience
// Foundation (focus area 4). "Do not implement mocked voice providers.
// Create real integration architecture." This wraps the browser's own,
// genuinely real, keyless Web Speech API (SpeechRecognition for
// speech-to-text, speechSynthesis for text-to-speech) behind a small
// provider-shaped interface -- isSupported()/listen()/speak()/cancel() --
// so a future cloud provider (Azure Speech, Google Cloud STT/TTS,
// ElevenLabs) can implement the exact same shape later without any
// caller (VoiceConversation.js, OrchestratorChat.js) needing to change.
// Client-only by construction (window/SpeechRecognition do not exist on
// the server) -- every export here is safe to call only from 'use client'
// code, mirroring the server-only guard convention lib/api/*.js already
// uses, just for the opposite boundary.

function getRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechToTextSupported() {
  return getRecognitionConstructor() !== null;
}

export function isTextToSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Starts one listening session. Calls onInterimResult as partial words
 * arrive (for a live, simultaneous transcript) and onFinalResult once
 * per completed phrase the recognizer has settled on (there can be
 * several across one session -- the caller decides when to actually
 * treat the turn as finished, see onEnd). Returns a stop() function;
 * callers should call it on unmount to avoid a recognizer left running
 * against a closed component, and should also call it deliberately
 * once the customer indicates they're done talking (there is no
 * "natural end of one utterance" signal to wait for any more -- see
 * the `continuous` note below).
 */
// PROJECT_LIFECYCLE_AND_VOICE_REMEDIATION_V1 VOICE002/VOICE003 -- real
// root cause of "cuts off too early": this was `continuous = false`,
// which ends the *entire* recognition session (fires onend) the moment
// the browser's own built-in silence detector decides one phrase is
// over -- not a mid-word cutoff, but a session that stops listening
// after the very first pause, which reads to a customer mid-thought as
// "it stopped listening while I was still talking." The Web Speech API
// exposes no configurable pause/silence threshold (browser-internal,
// not part of the spec) -- `continuous` is the one real lever
// available. Set to true, the recognizer keeps listening across
// multiple pauses/sentences until the caller explicitly stops it,
// which is also what makes natural, multi-sentence speech (VOICE003)
// possible at all.
export function startListening({ onInterimResult, onFinalResult, onError, onEnd, lang = 'en-AU' } = {}) {
  // VOICE_ACCESS_INVESTIGATION_V1 -- checked proactively, before even
  // attempting to construct a recognizer: Chrome/Edge have required a
  // secure context (HTTPS, or localhost/127.0.0.1) for the Web Speech
  // API since Chrome 47 -- on an insecure origin the constructor may
  // still exist, but .start() will always fail with a "not-allowed"
  // error the browser never explains. Surfacing the real reason here,
  // immediately, is more honest than waiting for that same denial to
  // arrive asynchronously via onerror with no context attached.
  if (typeof window !== 'undefined' && window.isSecureContext !== true) {
    onError?.(new Error(
      'Voice requires a secure connection (HTTPS) or localhost — this page was loaded over an ' +
      'insecure connection, so the browser blocks microphone access here regardless of permission settings.'
    ));
    return () => {};
  }

  const Recognition = getRecognitionConstructor();
  if (!Recognition) {
    onError?.(new Error('Speech-to-text is not supported in this browser.'));
    return () => {};
  }

  const recognizer = new Recognition();
  recognizer.lang = lang;
  recognizer.continuous = true;
  recognizer.interimResults = true;

  recognizer.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }
    if (interim) onInterimResult?.(interim);
    if (final) onFinalResult?.(final.trim());
  };

  recognizer.onerror = (event) => {
    if (event.error === 'not-allowed') {
      // VOICE_ACCESS_INVESTIGATION_V1 -- the proactive check above
      // catches this for a plain-HTTP non-localhost origin before the
      // recognizer is even constructed; this branch remains for the
      // genuine case it doesn't cover -- a secure-context page where
      // the customer (or a prior site setting) actually declined the
      // permission prompt itself.
      onError?.(new Error('Microphone access was denied. Check your browser\'s site permissions for this page.'));
      return;
    }
    onError?.(new Error(`Speech recognition error: ${event.error}`));
  };

  recognizer.onend = () => {
    onEnd?.();
  };

  recognizer.start();

  return () => {
    try {
      recognizer.stop();
    } catch {
      // Already stopped -- nothing to do.
    }
  };
}

/**
 * Speaks text aloud. onEnd fires when playback finishes naturally OR
 * is deliberately cancelled (see the VOICE006 note below) -- either
 * way, a caller can chain "listen again" onto it for a hands-free
 * back-and-forth.
 */
// PROJECT_LIFECYCLE_AND_VOICE_REMEDIATION_V1 VOICE005 -- still "too
// slow" even after UX_DEFECT_REMEDIATION_V1's own 1.15 bump; raised
// further to 1.25. Exposed as an optional override, not hardcoded, so
// a future per-user preference (Settings) can adjust it without
// changing this function's own signature again.
const DEFAULT_SPEECH_RATE = 1.25;

// PROJECT_EXECUTION_AND_VOICE_V1 -- closes the one real limitation the
// prior pass had to leave documented rather than fixed: getVoices()
// returns an empty list on first call in some browsers until the async
// `voiceschanged` event fires once. A conversation turn's own real
// round trip to the Orchestrator (a real LLM call, seconds not
// milliseconds) gives the browser ample time to have already fired
// that event well before speak() is ever actually called -- caching
// the result here means pickPreferredVoice() below reads from a warm
// cache in the overwhelming majority of real calls, not a cold,
// possibly-still-empty getVoices() on every single one. Module-level,
// registers once, guarded so it's a safe no-op anywhere
// speechSynthesis doesn't exist (SSR, unsupported browsers).
let cachedVoices = null;
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const warmVoiceCache = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) cachedVoices = voices;
  };
  warmVoiceCache();
  window.speechSynthesis.addEventListener('voiceschanged', warmVoiceCache);
}

// VOICE001 -- real root cause: the browser's own default voice for a
// given language/OS combination is usually its lowest-effort, most
// "robotic"-sounding option; most platforms also install at least one
// higher-quality voice (commonly labelled "Natural"/"Enhanced"/
// "Premium"/"Neural") that the API never selects on its own. This is a
// genuine, honest improvement achievable with zero new dependency --
// falls back to the platform default (today's exact behaviour) the
// moment nothing better is found, never worse than before.
function pickPreferredVoice(lang) {
  if (!isTextToSpeechSupported()) return null;
  const voices = cachedVoices ?? window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const langPrefix = lang.slice(0, 2).toLowerCase();
  const langVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(langPrefix));
  const pool = langVoices.length > 0 ? langVoices : voices;

  return (
    pool.find((voice) => /natural|enhanced|premium|neural/i.test(voice.name)) ??
    pool.find((voice) => voice.localService === false) ??
    null
  );
}

export function speak(text, { onEnd, onError, lang = 'en-AU', rate = DEFAULT_SPEECH_RATE } = {}) {
  if (!isTextToSpeechSupported()) {
    onError?.(new Error('Text-to-speech is not supported in this browser.'));
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;

  const preferredVoice = pickPreferredVoice(lang);
  if (preferredVoice) utterance.voice = preferredVoice;

  utterance.onend = () => onEnd?.();
  // VOICE006 -- real bug: calling speechSynthesis.cancel() to stop
  // playback (e.g. a customer pressing "Stop Speaking") does not fire
  // onend at all -- the Web Speech API fires onerror with
  // event.error === "interrupted" instead, a real, spec-defined
  // outcome of a deliberate cancel, not a genuine failure. The
  // previous version treated every onerror as a real error, so
  // stopping speech on purpose surfaced "Speech synthesis error:
  // interrupted" to the customer as if something had broken.
  // "canceled" (the other spec value for the same situation, some
  // browsers use one spelling, some the other) gets the same honest
  // treatment: route to onEnd, not onError.
  utterance.onerror = (event) => {
    if (event.error === 'interrupted' || event.error === 'canceled') {
      onEnd?.();
      return;
    }
    onError?.(new Error(`Speech synthesis error: ${event.error}`));
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech() {
  if (isTextToSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
