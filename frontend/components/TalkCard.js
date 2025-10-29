import { ACCENTS } from '../constants.js';
const e = React.createElement;
const { useEffect, useRef } = React;

const formatDate = d => {
  const date = new Date(d);
  if (isNaN(date)) return d;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

function animateExpander(el, open) {
  const start = el.offsetHeight;
  if (open) el.hidden = false;
  const end = el.scrollHeight;
  const keyframes = open
    ? [{ height: `${start}px` }, { height: `${end}px` }]
    : [{ height: `${start}px` }, { height: '0px' }];
  const anim = el.animate(keyframes, { duration: 200, easing: 'ease' });
  anim.onfinish = () => {
    el.style.height = '';
    if (!open) el.hidden = true;
  };
}

export function TalkCard({ talk, speakers = [], isOpen, onToggle }) {
  const primaryTag = (talk.tags || [])[0];
  const accent = ACCENTS[primaryTag] || '#03a9f4';
  const rawStatus = (talk.status || '').toLowerCase();
  const isPast = rawStatus ? rawStatus === 'past' : new Date(talk.date) < new Date();
  const actionLabel = isPast ? 'Запись' : 'Регистрация';
  const actionLink = talk.link;
  const cardRef = useRef(null);
  const expanderRef = useRef(null);

  useEffect(() => {
    const el = expanderRef.current;
    if (!el) return;
    animateExpander(el, isOpen);
    if (isOpen && cardRef.current) {
      requestAnimationFrame(() => {
        cardRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
  }, [isOpen]);

  return e(
    'article',
    {
      className: `talk-card ${isPast ? 'past' : 'upcoming'}`,
      'data-talk-id': talk.id,
      'aria-expanded': isOpen ? 'true' : 'false',
      ref: cardRef,
      style: { borderLeft: `4px solid ${accent}` },
    },
    e(
      'button',
      {
        className: 'talk-card__header',
        'aria-controls': `talk-${talk.id}-details`,
        'aria-expanded': isOpen ? 'true' : 'false',
        onClick: () => onToggle && onToggle(talk.id),
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
      e('h3', { className: 'talk-title' }, talk.name),
      e('time', { dateTime: talk.date }, formatDate(talk.date)),
      e('div', { className: 'talk-event' }, talk.event)
    ),
    e(
      'div',
      {
        className: 'talk-card__expander',
        id: `talk-${talk.id}-details`,
        hidden: !isOpen,
        ref: expanderRef,
      },
      e(
        'div',
        { className: 'talk-card__details' },
        e('p', { className: 'talk-desc' }, talk.description || 'Описание появится позже'),
        speakers.length > 0 &&
          e(
            'div',
            { className: 'talk-speakers' },
            e('h4', null, 'Спикеры:'),
            e(
              'ul',
              null,
              speakers.map(s => e('li', { key: s.id }, s.name))
            )
          ),
        e(
          'div',
          { className: 'talk-meta' },
          e('div', { className: 'meta-row' }, 'Ивент: ', e('strong', null, talk.event)),
          e(
            'div',
            { className: 'meta-row' },
            'Дата: ',
            e('strong', null, formatDate(talk.date))
          ),
          primaryTag &&
            e(
              'div',
              { className: 'meta-row' },
              'Тег: ',
              e('strong', null, primaryTag)
            ),
          talk.rate !== null && talk.rate !== undefined &&
            e(
              'div',
              { className: 'meta-row' },
              'Рейтинг: ',
              e('strong', null, talk.rate)
            )
        ),
        actionLink &&
          e(
            'div',
            { className: 'talk-actions' },
            e(
              'a',
              {
                href: actionLink,
                target: '_blank',
                rel: 'noopener',
                onClick: ev => ev.stopPropagation(),
                className: 'btn btn-link',
              },
              actionLabel
            )
          )
      )
    )
  );
}
