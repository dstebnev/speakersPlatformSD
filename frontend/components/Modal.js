const e = React.createElement;
const { useEffect } = React;

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = ev => { if (ev.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return e(
    'div',
    { className: 'modal-backdrop', onClick: ev => { if (ev.target === ev.currentTarget) onClose(); } },
    e(
      'div',
      { className: 'modal-sheet' },
      e(
        'div',
        { className: 'modal-header' },
        e('span', { className: 'modal-header__title' }, title),
        e(
          'button',
          { className: 'modal-close', onClick: onClose, 'aria-label': 'Закрыть' },
          e('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: 16,
            height: 16,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 2.5,
          },
            e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M6 18L18 6M6 6l12 12' })
          )
        )
      ),
      e('div', { className: 'modal-body' }, children)
    )
  );
}
