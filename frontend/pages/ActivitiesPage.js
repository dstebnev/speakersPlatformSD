import { ActivityCard } from '../components/ActivityCard.js';

const e = React.createElement;
const { useState, useEffect, useMemo } = React;

const FORMAT_OPTIONS = [
  { value: 'all',     label: 'Все форматы' },
  { value: 'speech',  label: 'Выступление' },
  { value: 'article', label: 'Статья' },
  { value: 'digital', label: 'Digital' },
];

const TIME_OPTIONS = [
  { value: 'all',      label: 'Все' },
  { value: 'upcoming', label: 'Будущие' },
  { value: 'past',     label: 'Прошедшие' },
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
  const [timeFilter, setTimeFilter] = useState('upcoming');
  // Multi-select: empty array = "all" selected
  const [formatFilters, setFormatFilters] = useState([]);
  const [tagFilters, setTagFilters] = useState([]);

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

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const toggleFormat = (value) => {
    if (value === 'all') {
      setFormatFilters([]);
    } else {
      setFormatFilters(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      );
    }
    setOpenId(null);
  };

  const toggleTag = (value) => {
    if (value === 'all') {
      setTagFilters([]);
    } else {
      setTagFilters(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      );
    }
    setOpenId(null);
  };

  // Activities filtered by time only — base for format counts
  const timeFiltered = useMemo(() => {
    return activities.filter(a => {
      if (timeFilter === 'upcoming') return !a.date || a.date >= today;
      if (timeFilter === 'past') return a.date && a.date < today;
      return true;
    });
  }, [activities, timeFilter, today]);

  // Format counts depend on time filter only
  const formatCounts = useMemo(() => {
    const counts = {};
    timeFiltered.forEach(a => {
      counts[a.format] = (counts[a.format] || 0) + 1;
    });
    return counts;
  }, [timeFiltered]);

  // Tag counts depend on time filter + selected formats
  const tagCounts = useMemo(() => {
    const counts = {};
    timeFiltered
      .filter(a => formatFilters.length === 0 || formatFilters.includes(a.format))
      .forEach(a => {
        (a.expertise_tags || []).forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      });
    return counts;
  }, [timeFiltered, formatFilters]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const result = activities.filter(a => {
      if (timeFilter === 'upcoming' && a.date && a.date < today) return false;
      if (timeFilter === 'past' && (!a.date || a.date >= today)) return false;
      if (formatFilters.length > 0 && !formatFilters.includes(a.format)) return false;
      if (tagFilters.length > 0 && !(a.expertise_tags || []).some(t => tagFilters.includes(t))) return false;
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

    result.sort((a, b) => {
      const da = a.date || '';
      const db = b.date || '';
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return timeFilter === 'past' ? db.localeCompare(da) : da.localeCompare(db);
    });

    return result;
  }, [activities, timeFilter, formatFilters, tagFilters, query, speakerMap, today]);

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
    // Time filter chips
    e(
      'div',
      { className: 'filter-chips' },
      TIME_OPTIONS.map(opt =>
        e('button', {
          key: opt.value,
          className: `chip${timeFilter === opt.value ? ' active' : ''}`,
          onClick: () => { setTimeFilter(opt.value); setOpenId(null); },
        }, opt.label)
      )
    ),
    // Format filter chips (multi-select)
    e(
      'div',
      { className: 'filter-chips' },
      FORMAT_OPTIONS.map(opt => {
        const isActive = opt.value === 'all' ? formatFilters.length === 0 : formatFilters.includes(opt.value);
        const count = opt.value !== 'all' ? (formatCounts[opt.value] || 0) : null;
        return e('button', {
          key: opt.value,
          className: `chip${isActive ? ' active' : ''}`,
          onClick: () => toggleFormat(opt.value),
        },
          opt.label,
          count !== null && e('span', { className: 'chip__count' }, count)
        );
      })
    ),
    // Expertise tag chips (multi-select)
    tagChips.length > 1 && e(
      'div',
      { className: 'filter-chips' },
      tagChips.map(opt => {
        const isActive = opt.value === 'all' ? tagFilters.length === 0 : tagFilters.includes(opt.value);
        const count = opt.value !== 'all' ? (tagCounts[opt.value] || 0) : null;
        return e('button', {
          key: opt.value,
          className: `chip${isActive ? ' active' : ''}`,
          onClick: () => toggleTag(opt.value),
        },
          opt.label,
          count !== null && e('span', { className: 'chip__count' }, count)
        );
      })
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
