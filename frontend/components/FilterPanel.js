import { DIRECTIONS } from '../directions.js';
const e = React.createElement;

export function FilterPanel({ filters, onChange, visible }) {
  const { direction, status, query, speaker, from, to } = filters;
  const set = (key, value) => onChange({ ...filters, [key]: value });
  const reset = () =>
    onChange({ direction: 'all', status: 'all', query: '', speaker: '', from: '', to: '' });

  return e(
    'section',
    {
      className: `filter-panel${visible ? ' show' : ''}`,
      'aria-hidden': !visible,
    },
    e('input', {
      type: 'text',
      placeholder: 'Название доклада',
      value: query,
      onChange: ev => set('query', ev.target.value),
      'aria-label': 'Поиск по названию',
    }),
    e('input', {
      type: 'text',
      placeholder: 'Спикер',
      value: speaker,
      onChange: ev => set('speaker', ev.target.value),
      'aria-label': 'Поиск по спикеру',
    }),
    e(
      'select',
      {
        value: direction,
        onChange: ev => set('direction', ev.target.value),
        'aria-label': 'Направление',
      },
      e('option', { value: 'all' }, 'Все направления'),
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
