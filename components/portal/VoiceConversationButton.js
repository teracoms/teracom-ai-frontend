import Link from 'next/link';

// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- Voice Experience
// Foundation (focus area 4) replaces the prior honest placeholder (no
// voice capability existed anywhere in this backend) with a real one:
// browser-native speech-to-text/text-to-speech via
// lib/voice/speechProvider.js, wired into /portal/voice.
export default function VoiceConversationButton() {
  return (
    <Link className="btn btn-secondary" href="/portal/voice">
      Voice Conversation
    </Link>
  );
}
