import { ActivityCard } from '../components/ActivityCard.js';

const e = React.createElement;
const { useState, useEffect, useMemo } = React;

const FORMAT_OPTIONS = [
  { value: 'all',     label: 'Все форматы' },
  { value: 'speech',  label: 'Выступление' },
  { value: 'article', label: 'Статья' },
  { value: 'digital', label: 'Digital' },
];

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      fetchJSON('/api/activities'),
      fetchJSON('/api/speakers'),
      fetchJSON('/api/tags'),
    ])
      .then(([acts, spks, tags]) => {
        setActivities(acts);
        setSpeakers(spks);
        setExpertiseTags(tags);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const speakerMap = useMemo(() => Object.fromEntries(speakers.map(s => [s.id, s])), [speakers]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return activities.filter(a => {
      if (formatFilter !== 'all' && a.format !== formatFilter) return false;
      if (tagFilter !== 'all' && !(a.expertise_tags || []).includes(tagFilter)) return false;
      if (q) {
        const inName = a.name.toLowerCase().includes(q);
        const inEvent = (a.event || '').toLowerCase().includes(q);
        const inSpeakers = (a.speaker_ids || []).some(id =>
          speakerMap[id]?.name.toLowerCase().includes(q)
        );
        if (!inName && !inEvent && !inSpeakers) return false;
      }
      return true;
    });
  }, [activities, formatFilter, tagFilter, query, speakerMap]);

  const tagChips = useMemo(() => [
    { value: 'all', label: 'Все темы' },
    ...expertiseTags.map(t => ({ value: t.name, label: t.name })),
  ], [expertiseTags]);

  if (loading) return e('div', { className: 'page-scroll' }, e('div', { className: 'loader' }, e('div', { className: 'spinner' })));
  if (error)   return e('div', { className: 'page-scroll' }, e('div', { className: 'empty-state' }, e('div', { className: 'empty-state__icon' }, '⚠️'), e('div', { className: 'empty-state__text' }, error)));

  return e(
    'div',
    { className: 'page-scroll' },
    // Sticky header
    e(
      'div',
      { className: 'page-header' },
      e('div', { className: 'page-header__title' }, 'Активности'),
      e(
        'div',
        { className: 'search-bar' },
        e('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
          e('circle', { cx: 11, cy: 11, r: 8 }),
          e('path', { strokeLinecap: 'round', d: 'm21 21-4.35-4.35' })
        ),
        e('input', {
          type: 'search',
          placeholder: 'Поиск по названию, спикеру, площадке...',
          value: query,
          onChange: ev => { setQuery(ev.target.value); setOpenId(null); },
        })
      )
    ),
    // Format filter chips
    e(
      'div',
      { className: 'filter-chips' },
      FORMAT_OPTIONS.map(opt =>
        e('button', {
          key: opt.value,
          className: `chip${formatFilter === opt.value ? ' active' : ''}`,
          onClick: () => { setFormatFilter(opt.value); setOpenId(null); },
        }, opt.label)
      )
    ),
    // Expertise tag chips
    tagChips.length > 1 && e(
      'div',
      { className: 'filter-chips' },
      tagChips.map(opt =>
        e('button', {
          key: opt.value,
          className: `chip${tagFilter === opt.value ? ' active' : ''}`,
          onClick: () => { setTagFilter(opt.value); setOpenId(null); },
        }, opt.label)
      )
    ),
    // List
    filtered.length === 0
      ? e('div', { className: 'empty-state' },
          e('div', { className: 'empty-state__icon' }, '📋'),
          e('div', { className: 'empty-state__text' }, 'Нет активностей по выбранным фильтрам')
        )
      : e(
          'div',
          { className: 'list-container' },
          filtered.map(a =>
            e(ActivityCard, {
              key: a.id,
              activity: a,
              speakers: (a.speaker_ids || []).map(id => speakerMap[id]).filter(Boolean),
              isOpen: openId === a.id,
              onToggle: id => setOpenId(prev => prev === id ? null : id),
            })
          )
        )
  );
}
