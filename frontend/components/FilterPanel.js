import { TAGS as DIRECTIONS } from '../tags.js';
import { useDebounce } from '../hooks/useDebounce.js';
const e = React.createElement;
const { useState, useEffect } = React;

export function FilterPanel({ filters, onChange, visible, speakers = [], events = [] }) {
  const { tag, status, query, speaker, from, to, event: eventName } = filters;

  const [localQuery, setLocalQuery] = useState(query);
  const [localSpeaker, setLocalSpeaker] = useState(speaker);

  useEffect(() => setLocalQuery(query), [query]);
  useEffect(() => setLocalSpeaker(speaker), [speaker]);

  const debouncedQuery = useDebounce(localQuery, 300);
  const debouncedSpeaker = useDebounce(localSpeaker, 300);

  const set = (key, value) => onChange({ ...filters, [key]: value });

  useEffect(() => {
    if (debouncedQuery !== query) set('query', debouncedQuery);
  }, [debouncedQuery, query]);

  useEffect(() => {
    if (debouncedSpeaker !== speaker) set('speaker', debouncedSpeaker);
  }, [debouncedSpeaker, speaker]);

  const reset = () =>
    onChange({ tag: 'all', status: 'all', query: '', speaker: '', event: '', from: '', to: '' });

  return e(
    'section',
    {
      className: `filter-panel${visible ? ' show' : ''}`,
      'aria-hidden': !visible,
    },
    e('input', {
      type: 'text',
      placeholder: 'Название доклада',
      value: localQuery,
      onChange: ev => setLocalQuery(ev.target.value),
      'aria-label': 'Поиск по названию',
    }),
    e('input', {
      type: 'text',
      list: 'speakers-list',
      placeholder: 'Спикер',
      value: localSpeaker,
      onChange: ev => setLocalSpeaker(ev.target.value),
      'aria-label': 'Поиск по спикеру',
    }),
    e(
      'datalist',
      { id: 'speakers-list' },
      speakers.map(s => e('option', { key: s.id, value: s.name }))
    ),
    e(
      'select',
      {
        value: eventName,
        onChange: ev => set('event', ev.target.value),
        'aria-label': 'Мероприятие',
      },
      e('option', { value: '' }, 'Все мероприятия'),
      events.map(evName => e('option', { key: evName, value: evName }, evName))
    ),
    e(
      'select',
      {
        value: tag,
        onChange: ev => set('tag', ev.target.value),
        'aria-label': 'Тег',
      },
      e('option', { value: 'all' }, 'Все теги'),
      DIRECTIONS.map(d => e('option', { key: d, value: d }, d))
    ),
    e(
      'select',
      {
        value: status,
        onChange: ev => set('status', ev.target.value),
        'aria-label': 'Статус',
      },
      e('option', { value: 'all' }, 'Все статусы'),
      e('option', { value: 'upcoming' }, 'Будущие'),
      e('option', { value: 'past' }, 'Прошедшие')
    ),
    e('input', {
      type: 'date',
      value: from,
      onChange: ev => set('from', ev.target.value),
      'aria-label': 'Дата от',
    }),
    e('input', {
      type: 'date',
      value: to,
      onChange: ev => set('to', ev.target.value),
      'aria-label': 'Дата до',
    }),
    e(
      'button',
      { onClick: reset, 'aria-label': 'Сбросить фильтры' },
      'Сбросить'
    )
  );
}
