'use client';

// TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 1 -- the self-hosted
// counterpart to lib/voice/speechProvider.js, implementing the exact
// same exported shape (isSpeechToTextSupported/isTextToSpeechSupported/
// startListening/speak/cancelSpeech) that file's own docstring has
// anticipated a future provider swap needing since
// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- calls this app's own
// backend (POST /api/portal/voice/transcribe,
// POST /api/portal/voice/synthesize, VOICE_MIGRATION_V1 Phase 2)
// instead of window.SpeechRecognition/window.speechSynthesis. The
// backend itself only actually serves these calls when the
// organisation's own VoiceProviderConfiguration selects a self-hosted
// provider -- this file does not duplicate that check, it just calls
// through and surfaces whatever honest error the backend returns
// (see api/voice.py's own 400/503 handling) if it isn't configured
// that way.
//
// Real, structural difference from speechProvider.js worth naming:
// the self-hosted engines are full-utterance request/response (Phase 2
// of VOICE_MIGRATION_V1 deliberately did not build streaming), not a
// live, incrementally-updating recognizer -- so onInterimResult is
// never called here (there is no interim transcript to show), and a
// "continuous" recording session is approximated client-side via
// silence detection (see _watchSilence below) rather than the
// browser's own internal VAD. See
// Workstreams/TERACOM_CONVERSATIONAL_EXPERIENCE_V1.md Part 2 for the
// full architecture this approximates.

export function isSpeechToTextSupported() {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined'
  );
}

export function isTextToSpeechSupported() {
  return typeof window !== 'undefined' && typeof window.Audio !== 'undefined';
}

// How long a real silence has to last before a continuous-mode
// recording is treated as "the customer has finished this utterance"
// and sent for transcription. Short enough that a normal end-of-
// sentence pause doesn't feel laggy, long enough that a customer
// taking a breath mid-thought isn't cut off -- the same real tradeoff
// speechProvider.js's own docstring names for the browser's internal
// (untunable) equivalent; this one is a real, adjustable number
// because this file owns the whole pipeline.
const SILENCE_MS_TO_STOP = 1400;
const SILENCE_VOLUME_THRESHOLD = 0.02;

function _rms(dataArray) {
  let sumSquares = 0;
  for (let i = 0; i < dataArray.length; i += 1) {
    const normalized = (dataArray[i] - 128) / 128;
    sumSquares += normalized * normalized;
  }
  return Math.sqrt(sumSquares / dataArray.length);
}

/**
 * Starts recording. `continuousMode` (Part 2's own real interim
 * implementation, not full streaming) auto-stops and sends once a
 * real silence of SILENCE_MS_TO_STOP has elapsed; when false, the
 * caller is expected to call the returned stop() function themselves
 * (push-to-talk style), matching speechProvider.js's own manual-stop
 * default behaviour.
 */
export function startListening({ onFinalResult, onError, onEnd, continuousMode = false } = {}) {
  // VOICE_ACCESS_INVESTIGATION_V1 -- `navigator.mediaDevices` itself
  // is undefined outside a secure context (HTTPS, or localhost/
  // 127.0.0.1) in every current browser -- the real, common reason
  // isSpeechToTextSupported() below returns false is an insecure
  // origin, not an actually-unsupported browser. Named specifically
  // so the customer gets the real, actionable reason.
  if (typeof window !== 'undefined' && window.isSecureContext !== true) {
    onError?.(new Error(
      'Voice requires a secure connection (HTTPS) or localhost — this page was loaded over an ' +
      'insecure connection, so the browser blocks microphone access here regardless of permission settings.'
    ));
    return () => {};
  }

  if (!isSpeechToTextSupported()) {
    onError?.(new Error('Voice recording is not supported in this browser.'));
    return () => {};
  }

  let stopped = false;
  let recorder = null;
  let audioContext = null;
  let silenceTimer = null;
  let rafHandle = null;

  const chunks = [];

  function cleanupAudioAnalysis() {
    if (silenceTimer) clearTimeout(silenceTimer);
    if (rafHandle) cancelAnimationFrame(rafHandle);
    if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
  }

  function finish(stream) {
    if (stopped) return;
    stopped = true;
    cleanupAudioAnalysis();
    try {
      recorder?.stop();
    } catch {
      // Already stopped.
    }
    stream?.getTracks().forEach((track) => track.stop());
  }

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      if (stopped) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        if (chunks.length === 0) {
          onEnd?.();
          return;
        }
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        try {
          const formData = new FormData();
          formData.set('audio', blob, 'utterance.webm');
          const response = await fetch('/api/portal/voice/transcribe', { method: 'POST', body: formData });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || 'Unable to transcribe your recording.');
          if (data.text) onFinalResult?.(data.text);
          onEnd?.();
        } catch (err) {
          onError?.(err instanceof Error ? err : new Error('Unable to transcribe your recording.'));
        }
      };
      recorder.start();

      if (continuousMode) {
        // Real, working silence detection via the Web Audio API's own
        // AnalyserNode -- not a placeholder. Runs entirely client-side,
        // no audio leaves the browser until a real silence has elapsed
        // and the whole utterance is sent for transcription in one call.
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.fftSize);

        const checkVolume = () => {
          if (stopped) return;
          analyser.getByteTimeDomainData(dataArray);
          const level = _rms(dataArray);

          if (level > SILENCE_VOLUME_THRESHOLD) {
            if (silenceTimer) {
              clearTimeout(silenceTimer);
              silenceTimer = null;
            }
          } else if (!silenceTimer) {
            silenceTimer = setTimeout(() => finish(stream), SILENCE_MS_TO_STOP);
          }

          rafHandle = requestAnimationFrame(checkVolume);
        };
        rafHandle = requestAnimationFrame(checkVolume);
      }
    })
    .catch((err) => {
      stopped = true;
      onError?.(new Error(err?.name === 'NotAllowedError' ? 'Microphone access was denied.' : 'Unable to access the microphone.'));
    });

  return () => finish();
}

let _currentAudio = null;

export function speak(text, { onEnd, onError, rate = 1.25, voice = null } = {}) {
  if (!isTextToSpeechSupported()) {
    onError?.(new Error('Audio playback is not supported in this browser.'));
    return;
  }

  cancelSpeech();

  fetch('/api/portal/voice/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, speed: rate }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to synthesize this speech.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      _currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (_currentAudio === audio) _currentAudio = null;
        onEnd?.();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (_currentAudio === audio) _currentAudio = null;
        onError?.(new Error('Playback of the synthesized speech failed.'));
      };

      audio.play().catch((err) => {
        onError?.(err instanceof Error ? err : new Error('Unable to play the synthesized speech.'));
      });
    })
    .catch((err) => {
      onError?.(err instanceof Error ? err : new Error('Unable to synthesize this speech.'));
    });
}

export function cancelSpeech() {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
    _currentAudio = null;
  }
}

/**
 * TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 2 -- real, working interim
 * barge-in: while the assistant's own reply is playing, this keeps a
 * second, independent mic stream open purely to watch volume (no
 * audio recorded or sent anywhere by this function) and calls
 * onInterruptDetected() the moment the customer starts talking over
 * it, so the caller can cancelSpeech() and begin real listening
 * immediately -- a genuine improvement over "wait for the reply to
 * finish," though it is utterance-level interruption (react once
 * speech is detected), not true word-level simultaneous barge-in,
 * which would need a real streaming audio pipeline
 * (Workstreams/TERACOM_CONVERSATIONAL_EXPERIENCE_V1.md Part 2 names
 * this honestly as the harder, not-yet-attempted remainder).
 */
export function watchForInterruption({ onInterruptDetected, onError } = {}) {
  if (!isSpeechToTextSupported()) return () => {};

  let stopped = false;
  let audioContext = null;
  let rafHandle = null;
  let stream = null;

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((mediaStream) => {
      if (stopped) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = mediaStream;
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.fftSize);

      const check = () => {
        if (stopped) return;
        analyser.getByteTimeDomainData(dataArray);
        if (_rms(dataArray) > SILENCE_VOLUME_THRESHOLD * 2) {
          onInterruptDetected?.();
          return;
        }
        rafHandle = requestAnimationFrame(check);
      };
      rafHandle = requestAnimationFrame(check);
    })
    .catch((err) => {
      onError?.(err instanceof Error ? err : new Error('Unable to watch for interruption.'));
    });

  return () => {
    stopped = true;
    if (rafHandle) cancelAnimationFrame(rafHandle);
    if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
    stream?.getTracks().forEach((track) => track.stop());
  };
}
