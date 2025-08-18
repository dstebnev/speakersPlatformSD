import { TAGS } from '../tags.js';
const e = React.createElement;
const { useEffect, useRef } = React;

export function TagMultiSelect({ selected = [], onChange }) {
  const selectRef = useRef(null);
  const choicesRef = useRef(null);

  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;

    choicesRef.current = new Choices(el, {
      removeItemButton: true,
      searchEnabled: true,
      placeholderValue: 'Теги',
      itemSelectText: '',
      shouldSort: false,
    });

    if (selected.length) {
      choicesRef.current.setChoiceByValue(selected);
    }

    const handleChange = () => {
      const values = choicesRef.current ? choicesRef.current.getValue(true) : [];
      onChange?.(values);
    };

    el.addEventListener('change', handleChange);

    return () => {
      el.removeEventListener('change', handleChange);
      choicesRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!choicesRef.current) return;
    const current = choicesRef.current.getValue(true);
    const isSame =
      current.length === selected.length &&
      current.every(v => selected.includes(v));
    if (isSame) return;
    choicesRef.current.removeActiveItems();
    choicesRef.current.setChoiceByValue(selected);
  }, [selected]);

  return e(
    'select',
    { ref: selectRef, multiple: true },
    TAGS.map(t => e('option', { key: t, value: t }, t))
  );
}
