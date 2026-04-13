const e = React.createElement;
const { useRef, useEffect } = React;

const FORMAT_LABELS = { speech: 'Выступление', article: 'Статья', digital: 'Digital' };

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d + 'T00:00:00');
  if (isNaN(date)) return d;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function animateExpander(el, open) {
  if (open) {
    el.hidden = false;
    const h = el.scrollHeight;
    el.animate([{ height: '0px' }, { height: h + 'px' }], { duration: 200, easing: 'ease', fill: 'forwards' })
      .onfinish = () => { el.style.height = ''; };
  } else {
    const h = el.offsetHeight;
    const anim = el.animate([{ height: h + 'px' }, { height: '0px' }], { duration: 200, easing: 'ease', fill: 'forwards' });
    anim.onfinish = () => { el.hidden = true; el.style.height = ''; };
  }
}

export function ActivityCard({ activity, speakers = [], isOpen, onToggle }) {
  const expanderRef = useRef(null);
  const cardRef = useRef(null);
  const fmt = activity.format || 'speech';

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

  const speakerNames = speakers.map(s => s.name).join(', ');

  return e(
    'article',
    {
      className: `card activity-card${isOpen ? ' activity-card--open' : ''}`,
      ref: cardRef,
    },
    // Header (clickable)
    e(
      'button',
      { className: 'activity-card__header', onClick: () => onToggle && onToggle(activity.id) },
      e(
        'div',
        { className: 'activity-card__top' },
        e('span', { className: 'activity-card__name' }, activity.name),
        e('svg', {
          className: 'activity-card__expand-icon',
          xmlns: 'http://www.w3.org/2000/svg',
          width: 16,
          height: 16,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
        },
          e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M19 9l-7 7-7-7' })
        )
      ),
      speakerNames && e('div', { className: 'activity-card__speakers' }, speakerNames),
      e(
        'div',
        { className: 'activity-card__meta' },
        e('span', { className: `format-badge format-badge--${fmt}` }, FORMAT_LABELS[fmt] || fmt),
        activity.date && e('span', null, formatDate(activity.date)),
        activity.event && e('span', null, activity.event),
        ...(activity.expertise_tags || []).map(tag =>
          e('span', { className: 'tag', key: tag }, tag)
        )
      )
    ),
    // Expandable body
    e(
      'div',
      {
        className: 'activity-card__body',
        ref: expanderRef,
        hidden: !isOpen,
        style: { overflow: 'hidden' },
      },
      e(
        'div',
        { className: 'activity-card__body-inner' },
        activity.description && e('p', { className: 'activity-card__desc' }, activity.description),
        speakers.length > 0 && e(
          'div',
          { className: 'speaker-mini-list' },
          e('div', { className: 'field-label', style: { marginBottom: 4 } }, 'Спикеры'),
          speakers.map(s =>
            e('div', { key: s.id, className: 'speaker-mini-item' },
              e('span', { className: 'speaker-mini-item__name' }, s.name),
              s.role && e('span', { className: 'speaker-mini-item__role' }, '· ' + s.role)
            )
          )
        ),
        activity.event && e(
          'div', { className: 'activity-card__detail-row' },
          e('span', null, 'Площадка:'),
          e('span', null, activity.event)
        ),
        activity.date && e(
          'div', { className: 'activity-card__detail-row' },
          e('span', null, 'Дата:'),
          e('span', null, formatDate(activity.date))
        )
      )
    )
  );
}
