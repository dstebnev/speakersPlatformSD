import { ACCENTS } from '../constants.js';
const e = React.createElement;

export function BottomSheet({ talk, speakers = [] }) {
  if (!talk) return null;

  const accent = ACCENTS[talk.direction] || '#03a9f4';
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

  const link =
    talk.status === 'past'
      ? e('a', { href: talk.recordingLink, target: '_blank' }, 'Запись')
      : e('a', { href: talk.registrationLink, target: '_blank' }, 'Регистрация');

  return e(
    'div',
    {
      className: `bottom-sheet${expanded ? ' expanded' : ''}`,
      style: { borderTop: `8px solid ${accent}` },
      onPointerDown: handleStart,
      onTouchStart: handleStart,
    },
    e('div', {
      className: `handle${expanded ? ' arrow-down' : ''}`,
      onClick: () => expanded && setExpanded(false),
    }),
    e(
      'div',
      { className: 'sheet-content' },
      e('h3', null, talk.title),
      e('div', { className: 'sheet-speaker' }, speakers.map(s => s.name).join(', ')),
      e('div', null, talk.description),
      e('div', { className: 'sheet-event' }, talk.eventName),
      link
    ),
  );
}
