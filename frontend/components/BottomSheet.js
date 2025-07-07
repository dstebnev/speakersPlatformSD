import { ACCENTS } from '../constants.js';
const e = React.createElement;

export function BottomSheet({ talk, speaker }) {
  if (!talk) return null;

  const accent = ACCENTS[talk.direction] || '#03a9f4';

  const link =
    talk.status === 'past'
      ? e('a', { href: talk.recordingLink, target: '_blank' }, 'Запись')
      : e('a', { href: talk.registrationLink, target: '_blank' }, 'Регистрация');

  return e(
    'div',
    { className: 'bottom-sheet', style: { borderTop: `8px solid ${accent}` } },
    e('div', { className: 'handle' }),
    e(
      'div',
      { className: 'sheet-content' },
      e('h3', null, talk.title),
      e('div', { className: 'sheet-speaker' }, speaker?.name || ''),
      e('div', null, talk.description),
      e('div', { className: 'sheet-event' }, talk.eventName),
      link
    )
  );
}
