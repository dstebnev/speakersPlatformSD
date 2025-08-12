import { ACCENTS } from '../constants.js';
const e = React.createElement;

const formatDate = d => {
  const date = new Date(d);
  if (isNaN(date)) return d;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
};

export function TalkCard({ talk, speakers = [], onSelect }) {
  const isPast = new Date(talk.date) < new Date();
  const accent = ACCENTS[talk.direction] || '#03a9f4';
  const actionLabel = isPast ? 'Запись' : 'Регистрация';
  const actionLink = isPast ? talk.recordingLink : talk.registrationLink;

  return e(
    'article',
    {
      className: `talk-card ${isPast ? 'past' : 'upcoming'}`,
      onClick: () => onSelect && onSelect(talk),
      tabIndex: 0,
      role: 'button',
      'aria-label': `Доклад ${talk.title}`,
      style: { borderLeft: `4px solid ${accent}` },
    },
    e(
      'div',
      { className: 'speakers' },
      speakers.map((s, idx) =>
        e(
          'span',
          { key: s.id || idx },
          e('strong', null, s.name),
          idx < speakers.length - 1 ? ', ' : ''
        )
      )
    ),
    e('h3', { className: 'talk-title' }, talk.title),
    e('time', { dateTime: talk.date }, formatDate(talk.date)),
    e('div', { className: 'talk-event' }, talk.eventName),
    actionLink &&
      e(
        'div',
        { className: 'action' },
        e(
          'a',
          {
            href: actionLink,
            target: '_blank',
            onClick: ev => ev.stopPropagation(),
            'aria-label': actionLabel,
          },
          actionLabel
        )
      )
  );
}
