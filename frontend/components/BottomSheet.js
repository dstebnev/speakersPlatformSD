import { ACCENTS } from '../constants.js';
const e = React.createElement;

export function BottomSheet({ talk, speakers = [] }) {
  if (!talk) return null;

  const primaryTag = (talk.tags || [])[0];
  const accent = ACCENTS[primaryTag] || '#03a9f4';
  const [expanded, setExpanded] = React.useState(false);
  const startYRef = React.useRef(0);

  React.useEffect(() => {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;
    nav.classList.toggle('disabled', expanded);
    return () => nav.classList.remove('disabled');
  }, [expanded]);

  React.useEffect(() => {
    document.body.classList.toggle('sheet-expanded', expanded);
    return () => document.body.classList.remove('sheet-expanded');
  }, [expanded]);

  const handleStart = ev => {
    const y = ev.touches ? ev.touches[0].clientY : ev.clientY;
    startYRef.current = y;
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

  const handleMove = ev => {
    const y = ev.touches ? ev.touches[0].clientY : ev.clientY;
    const diff = startYRef.current - y;
    if (diff > 50) {
      setExpanded(true);
    } else if (diff < -50) {
      setExpanded(false);
    }
  };

  const handleEnd = () => {
    document.removeEventListener('pointermove', handleMove);
    document.removeEventListener('pointerup', handleEnd);
    document.removeEventListener('touchmove', handleMove);
    document.removeEventListener('touchend', handleEnd);
  };

  const rawStatus = (talk.status || '').toLowerCase();
  const isPast = rawStatus ? rawStatus === 'past' : new Date(talk.date) < new Date();
  const link =
    talk.link &&
    e(
      'a',
      { href: talk.link, target: '_blank', rel: 'noopener' },
      isPast ? 'Запись' : 'Регистрация'
    );

  return e(
    'div',
    {
      className: `bottom-sheet${expanded ? ' expanded' : ''}`,
      style: { borderTop: `8px solid ${accent}` },
      onPointerDown: handleStart,
      onTouchStart: handleStart,
      role: 'dialog',
      'aria-modal': true,
    },
    e('div', {
      className: `handle${expanded ? ' arrow-down' : ''}`,
      onClick: () => expanded && setExpanded(false),
    }),
    e(
      'div',
      { className: 'sheet-content' },
      e('h3', null, talk.name),
      e(
        'div',
        { className: 'sheet-speaker' },
        speakers.map((s, idx) =>
          e(
            'span',
            { key: s.id || idx },
            s.name + (idx < speakers.length - 1 ? ', ' : '')
          )
        )
      ),
      e('div', null, talk.description),
      speakers.length > 0 &&
        e(
          'div',
          { className: 'sheet-bio' },
          speakers.map((s, idx) =>
            e(
              'p',
              { key: s.id || idx },
              e('strong', null, s.name + ': '),
              s.description
            )
          )
        ),
      e('div', { className: 'sheet-event' }, talk.event),
      primaryTag && e('div', { className: 'sheet-tag' }, `Тег: ${primaryTag}`),
      talk.rate !== null && talk.rate !== undefined && e('div', { className: 'sheet-rate' }, `Рейтинг: ${talk.rate}`),
      link
    )
  );
}
