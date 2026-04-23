const e = React.createElement;

export function speakerHue(speaker) {
  const id = String(speaker.id || '');
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xFFFF;
  return hash % 360;
}

export function hueColor(hue, l = 0.72, c = 0.12) {
  return `oklch(${l} ${c} ${hue})`;
}

export function initials(name) {
  return (name || '').split(' ').slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
}

export function Avatar({ speaker, size = 54 }) {
  if (speaker.photoUrl) {
    return e('img', {
      src: speaker.photoUrl,
      alt: speaker.name,
      className: 'av',
      style: { width: size, height: size, objectFit: 'cover' },
    });
  }
  const hue = speakerHue(speaker);
  const bg = hueColor(hue, 0.58, 0.14);
  return e('div', {
    className: 'av',
    style: { width: size, height: size, background: bg, fontSize: size * 0.33 },
  }, initials(speaker.name));
}
