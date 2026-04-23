import { Avatar } from './Avatar.js';

const e = React.createElement;

export function SpeakerCard({ speaker, onClick }) {
  return e('article', { className: 'spk', onClick },
    e(Avatar, { speaker, size: 52 }),
    e('div', { className: 'spk__info' },
      e('div', { className: 'spk__name' }, speaker.name),
      e('div', { className: 'spk__role' }, speaker.role || '—'),
      (speaker.expertise || []).length > 0 && e('div', { className: 'spk__tags' },
        speaker.expertise.slice(0, 3).map(t =>
          e('span', { key: t, className: 'tag' }, t)))));
}
