const e = React.createElement;

export function Card({ talk, speakers = [] }) {
  const main = speakers[0] || {};
  return e(
    'div',
    { className: 'card' },
    e('img', { src: main.photoUrl || '/default_icon.svg', alt: main.name || '' })
  );
}
