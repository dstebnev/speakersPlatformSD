const e = React.createElement;
const { useState, useRef, useEffect } = React;

/**
 * Multi-select for expertise tags.
 * Props:
 *   value: string[]          – currently selected tag names
 *   onChange: (tags) => void
 *   options: {id, name}[]   – available tags from the server
 *   placeholder: string
 */
export function TagsMultiSelect({ value = [], onChange, options = [], placeholder = 'Выберите теги...' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const selected = value;
  const filtered = options.filter(
    o => !selected.includes(o.name) && o.name.toLowerCase().includes(query.toLowerCase())
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

  const add = name => {
    if (!selected.includes(name)) onChange([...selected, name]);
    setQuery('');
    inputRef.current?.focus();
  };

  const remove = name => onChange(selected.filter(t => t !== name));

  return e(
    'div',
    { ref: containerRef, style: { position: 'relative' } },
    e(
      'div',
      {
        className: 'tags-input',
        onClick: () => { setOpen(true); inputRef.current?.focus(); },
      },
      selected.map(tag =>
        e('span', { key: tag, className: 'tags-input__tag' },
          tag,
          e('button', {
            className: 'tags-input__remove',
            type: 'button',
            onClick: ev => { ev.stopPropagation(); remove(tag); },
          }, '×')
        )
      ),
      e('input', {
        ref: inputRef,
        type: 'text',
        value: query,
        placeholder: selected.length === 0 ? placeholder : '',
        style: { border: 'none', background: 'transparent', outline: 'none', flex: 1, minWidth: 80, fontSize: '0.9375rem', color: 'var(--tg-theme-text-color)', fontFamily: 'inherit' },
        onFocus: () => setOpen(true),
        onChange: ev => { setQuery(ev.target.value); setOpen(true); },
      })
    ),
    open && filtered.length > 0 && e(
      'div',
      { className: 'tags-dropdown' },
      filtered.map(o =>
        e('div', {
          key: o.id,
          className: 'tags-dropdown__item',
          onMouseDown: ev => { ev.preventDefault(); add(o.name); },
        }, o.name)
      )
    )
  );
}
