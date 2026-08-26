// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- Avatar Experience
// Foundation (focus area 5). One small, extensible presentational
// component every avatar-bearing surface (People list, persona
// conversation header, future Orchestrator profile) renders through --
// a real uploaded image when avatarRef is set (served from
// GET /executive-roles/{role_key}/avatar via the same-origin proxy), a
// plain initials fallback otherwise. No placeholder image, no stock art
// standing in for a real avatar that hasn't been uploaded yet.
export default function AvatarImage({ avatarRef, roleKey, label, size = 48 }) {
  const initials = (label || roleKey || '?')
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const dimension = { width: size, height: size, borderRadius: '50%' };

  if (avatarRef) {
    return (
      <img
        src={`/api/portal/executive-roles/${roleKey}/avatar`}
        alt={label || roleKey}
        style={{ ...dimension, objectFit: 'cover' }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={label || roleKey}
      style={{
        ...dimension,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-raised, #2a2a2a)',
        color: 'var(--text, #fff)',
        fontSize: size * 0.4,
        fontWeight: 600,
      }}
    >
      {initials}
    </div>
  );
}
