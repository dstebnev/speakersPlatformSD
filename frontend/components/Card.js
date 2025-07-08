const e = React.createElement;

export function Card({ talk, speaker }) {
  return e(
    'div',
    { className: 'card' },
    e('img', { src: speaker.photoUrl || '/default_icon.svg', alt: speaker.name })
  );
}
