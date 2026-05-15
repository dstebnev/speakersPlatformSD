import { ActivityCard } from '../components/ActivityCard.js';

const e = React.createElement;
const { useState, useEffect, useMemo } = React;

const FORMAT_OPTIONS = [
  { value: 'speech',  label: 'Выступление' },
  { value: 'article', label: 'Статья' },
  { value: 'digital', label: 'Digital' },
  { value: 'devrel',  label: 'Деврел' },
];

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

const SearchIcon = e('svg', {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  width: 16, height: 16,
},
  e('circle', { cx: 11, cy: 11, r: 7 }),
  e('path', { d: 'm20 20-3.5-3.5', strokeLinecap: 'round' }));

const MicIcon = e('svg', {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
  width: 22, height: 22,
},
  e('rect', { x: 9, y: 3, width: 6, height: 12, rx: 3 }),
  e('path', { d: 'M5 11a7 7 0 0 0 14 0M12 18v3', strokeLinecap: 'round' }));

export function ActivitiesPage({ onOpenRequest }) {
  const [activities, setActivities] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const [formatFilters, setFormatFilters] = useState([]);
  const [tagFilters, setTagFilters] = useState([]);

  useEffect(() => {
    Promise.all([
      fetchJSON('/api/activities'),
      fetchJSON('/api/speakers'),
      fetchJSON('/api/tags'),
    ])
      .then(([acts, spks, tags]) => {
        setActivities(acts.filter(a => a.format !== 'devrel'));
        setSpeakers(spks);
        setExpertiseTags(tags);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const speakerMap = useMemo(() =>
    Object.fromEntries(speakers.map(s => [s.id, s])), [speakers]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const toggleFormat = value => {
    setFormatFilters(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    setOpenId(null);
  };

  const toggleTag = value => {
    setTagFilters(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    setOpenId(null);
  };

  // Only upcoming activities
  const upcoming = useMemo(() =>
    activities.filter(a => !a.date || a.date >= today),
    [activities, today]);

  const formatCounts = useMemo(() => {
    const counts = {};
    upcoming.forEach(a => { counts[a.format] = (counts[a.format] || 0) + 1; });
    return counts;
  }, [upcoming]);

  const tagCounts = useMemo(() => {
    const counts = {};
    upcoming
      .filter(a => formatFilters.length === 0 || formatFilters.includes(a.format))
      .forEach(a => {
        (a.expertise_tags || []).forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      });
    return counts;
  }, [upcoming, formatFilters]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const result = upcoming.filter(a => {
      if (formatFilters.length > 0 && !formatFilters.includes(a.format)) return false;
      if (tagFilters.length > 0 && !(a.expertise_tags || []).some(t => tagFilters.includes(t))) return false;
      if (q) {
        const inName = a.name.toLowerCase().includes(q);
        const inEvent = (a.event || '').toLowerCase().includes(q);
        const inSpks = (a.speaker_ids || []).some(id => speakerMap[id]?.name.toLowerCase().includes(q));
        if (!inName && !inEvent && !inSpks) return false;
      }
      return true;
    });
    result.sort((a, b) => {
      const da = a.date || '', db = b.date || '';
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.localeCompare(db); // ascending — nearest first
    });
    return result;
  }, [upcoming, formatFilters, tagFilters, query, speakerMap]);

  if (loading) return e('div', { className: 'page-scroll' },
    e('div', { className: 'loader' }, e('div', { className: 'spinner' })));
  if (error) return e('div', { className: 'page-scroll' },
    e('div', { className: 'empty-state' },
      e('div', { className: 'empty-state__icon' }, '⚠️'),
      e('div', { className: 'empty-state__text' }, error)));

  const allTagChips = expertiseTags.map(t => t.name);

  return e('div', { className: 'page' },

    // Header
    e('div', { className: 'page__head' },
      e('div', null,
        e('h1', { className: 'page__title' }, 'Активности'),
        e('div', { className: 'page__sub' }, 'Запланированные выступления и публикации')),
      e('div', { className: 'page__count' }, `${filtered.length} из ${upcoming.length}`)),

    // Search
    e('div', { className: 'search' },
      SearchIcon,
      e('input', {
        placeholder: 'Поиск по названию, спикеру или площадке…',
        value: query,
        onChange: ev => { setQuery(ev.target.value); setOpenId(null); },
      })),

    // Format filter
    e('div', { className: 'chiprow' },
      e('span', { className: 'chiprow__label' }, 'Формат'),
      e('button', {
        className: 'chip' + (formatFilters.length === 0 ? ' is-active' : ''),
        onClick: () => { setFormatFilters([]); setOpenId(null); },
      }, 'Все'),
      FORMAT_OPTIONS.map(opt => {
        const count = formatCounts[opt.value] || 0;
        return e('button', {
          key: opt.value,
          className: 'chip' + (formatFilters.includes(opt.value) ? ' is-active' : ''),
          onClick: () => toggleFormat(opt.value),
        },
          e('span', { className: `fmt-dot fmt-dot--${opt.value}` }),
          opt.label,
          e('span', { className: 'chip__count' }, count));
      })),

    // Tag filter
    allTagChips.length > 0 && e('div', { className: 'chiprow' },
      e('span', { className: 'chiprow__label' }, 'Темы'),
      e('button', {
        className: 'chip' + (tagFilters.length === 0 ? ' is-active' : ''),
        onClick: () => { setTagFilters([]); setOpenId(null); },
      }, 'Все'),
      allTagChips.map(t => e('button', {
        key: t,
        className: 'chip' + (tagFilters.includes(t) ? ' is-active' : ''),
        onClick: () => toggleTag(t),
      },
        t,
        tagCounts[t] != null && e('span', { className: 'chip__count' }, tagCounts[t] || 0)))),

    // List
    filtered.length === 0
      ? e('div', { className: 'empty', style: { marginTop: 18 } },
          e('div', { className: 'empty__glyph' }, '«ничего»'),
          'нет запланированных активностей')
      : e('div', { className: 'act-list' },
          filtered.map(a => e(ActivityCard, {
            key: a.id,
            activity: a,
            speakers: (a.speaker_ids || []).map(id => speakerMap[id]).filter(Boolean),
            isOpen: openId === a.id,
            onToggle: id => setOpenId(prev => prev === id ? null : id),
          }))),

    // CTA
    e('div', { className: 'cta' },
      e('div', { className: 'cta__ic' }, MicIcon),
      e('div', { className: 'cta__txt' },
        e('div', { className: 'cta__title' }, 'Хочешь сделать доклад или статью? Или тебя нет в списке, но должен'),
        e('div', { className: 'cta__sub' }, 'DevRel поможет с подготовкой, площадкой и продвижением.')),
      e('button', { className: 'cta__btn', onClick: onOpenRequest }, 'Отправить заявку')));
}
