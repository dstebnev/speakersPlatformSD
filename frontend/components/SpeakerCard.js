const e = React.createElement;

// Placeholder silhouette when no photo
function AvatarPlaceholder({ size }) {
  return e('div', {
    className: 'speaker-avatar speaker-avatar--placeholder',
    style: { width: size, height: size },
  },
    e('svg', { xmlns: 'http://www.w3.org/2000/svg', width: size * 0.55, height: size * 0.55, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
      e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' })
    )
  );
}

export function SpeakerCard({ speaker }) {
  const tgLink = speaker.telegram
    ? `https://t.me/${speaker.telegram.replace(/^@/, '')}`
    : null;

  return e(
    'article',
    { className: 'card speaker-card' },
    e(
      'div',
      { className: 'speaker-card__top' },
      // Avatar
      speaker.photoUrl
        ? e('img', { src: speaker.photoUrl, alt: speaker.name, className: 'speaker-avatar' })
        : e(AvatarPlaceholder, { size: 52 }),
      // Info
      e(
        'div',
        { className: 'speaker-card__info' },
        e('div', { className: 'speaker-card__name' }, speaker.name),
        speaker.role && e('div', { className: 'speaker-card__role' }, speaker.role),
      )
    ),
    speaker.expertise?.length > 0 && e(
      'div',
      { className: 'speaker-card__tags' },
      speaker.expertise.map(tag =>
        e('span', { key: tag, className: 'tag' }, tag)
      )
    ),
    (speaker.email || speaker.telegram) && e(
      'div',
      { className: 'speaker-card__contacts' },
      speaker.email && e(
        'a',
        { href: `mailto:${speaker.email}`, className: 'speaker-card__contact-link' },
        e('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
          e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' })
        ),
        speaker.email
      ),
      tgLink && e(
        'a',
        { href: tgLink, className: 'speaker-card__contact-link', target: '_blank', rel: 'noopener' },
        e('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 14, height: 14, viewBox: '0 0 24 24', fill: 'currentColor' },
          e('path', { d: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z' })
        ),
        '@' + speaker.telegram.replace(/^@/, '')
      )
    )
  );
}
