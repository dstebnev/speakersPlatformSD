const e = React.createElement;

export function Card({ talk, speakers = [] }) {
  return e(
    'div',
    { className: 'card' },
    e(
      'div',
      { className: 'avatars' },
      speakers.map((s, idx) =>
        e('img', {
          key: idx,
          className: 'avatar',
          src: s.photoUrl || '/default_icon.svg',
          alt: s.name || '',
        })
      )
    )
  );
}
