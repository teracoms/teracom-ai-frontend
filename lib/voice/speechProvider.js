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
 * per completed utterance. Returns a stop() function; callers should
 * call it on unmount to avoid a recognizer left running against a
 * closed component.
 */
export function startListening({ onInterimResult, onFinalResult, onError, onEnd, lang = 'en-AU' } = {}) {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) {
    onError?.(new Error('Speech-to-text is not supported in this browser.'));
    return () => {};
  }

  const recognizer = new Recognition();
  recognizer.lang = lang;
  recognizer.continuous = false;
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
    onError?.(new Error(event.error === 'not-allowed' ? 'Microphone access was denied.' : `Speech recognition error: ${event.error}`));
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
 * Speaks text aloud. onEnd fires when playback finishes (including when
 * cancelled), so a caller can chain "listen again" onto the end of a
 * spoken reply for a hands-free back-and-forth.
 */
export function speak(text, { onEnd, onError, lang = 'en-AU' } = {}) {
  if (!isTextToSpeechSupported()) {
    onError?.(new Error('Text-to-speech is not supported in this browser.'));
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.onend = () => onEnd?.();
  utterance.onerror = (event) => onError?.(new Error(`Speech synthesis error: ${event.error}`));

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech() {
  if (isTextToSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
