const e = React.createElement;
const { useState, useRef, useEffect } = React;

/**
 * Multi-select for speakers (by id).
 * Props:
 *   value: string[]          – selected speaker ids
 *   onChange: (ids) => void
 *   speakers: {id, name}[]
 */
export function SpeakersMultiSelect({ value = [], onChange, speakers = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const speakerMap = Object.fromEntries(speakers.map(s => [s.id, s]));
  const selected = value;
  const filtered = speakers.filter(
    s => !selected.includes(s.id) && s.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = ev => {
      if (containerRef.current && !containerRef.current.contains(ev.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const add = id => {
    if (!selected.includes(id)) onChange([...selected, id]);
    setQuery('');
    inputRef.current?.focus();
  };

  const remove = id => onChange(selected.filter(s => s !== id));

  return e(
    'div',
    { ref: containerRef, style: { position: 'relative' } },
    e(
      'div',
      {
        className: 'tags-input',
        onClick: () => { setOpen(true); inputRef.current?.focus(); },
      },
      selected.map(id => {
        const spk = speakerMap[id];
        return spk ? e('span', { key: id, className: 'tags-input__tag' },
          spk.name,
          e('button', {
            className: 'tags-input__remove',
            type: 'button',
            onClick: ev => { ev.stopPropagation(); remove(id); },
          }, '×')
        ) : null;
      }),
      e('input', {
        ref: inputRef,
        type: 'text',
        value: query,
        placeholder: selected.length === 0 ? 'Выберите спикеров...' : '',
        style: { border: 'none', background: 'transparent', outline: 'none', flex: 1, minWidth: 80, fontSize: '0.9375rem', color: 'var(--tg-theme-text-color)', fontFamily: 'inherit' },
        onFocus: () => setOpen(true),
        onChange: ev => { setQuery(ev.target.value); setOpen(true); },
      })
    ),
    open && filtered.length > 0 && e(
      'div',
      { className: 'tags-dropdown' },
      filtered.map(s =>
        e('div', {
          key: s.id,
          className: 'tags-dropdown__item',
          onMouseDown: ev => { ev.preventDefault(); add(s.id); },
        }, s.name, s.role ? e('span', { style: { color: 'var(--tg-theme-hint-color)', marginLeft: 6, fontSize: '0.8125rem' } }, s.role) : null)
      )
    )
  );
}
